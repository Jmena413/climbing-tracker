import type { User as SupabaseUser } from "@supabase/supabase-js";
import { HttpError } from "./api-errors";
import { prisma } from "./prisma";
import { createSupabaseServerClient } from "./supabase";

interface AuthClient {
  auth: {
    getUser: (accessToken: string) => Promise<{
      data: { user: SupabaseUser | null };
      error: unknown;
    }>;
  };
}

interface UserLookup {
  user: {
    findUnique: (args: {
      where: { authProviderId: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
}

export interface AuthenticatedUser {
  id: string;
  authSubject: string;
}

export interface AuthenticationDependencies {
  authClient?: AuthClient;
  userLookup?: UserLookup;
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match?.[1]) {
    throw new HttpError(
      401,
      "UNAUTHORIZED",
      "A valid bearer access token is required",
    );
  }
  return match[1];
}

export async function authenticateRequest(
  request: Request,
  dependencies: AuthenticationDependencies = {},
): Promise<AuthenticatedUser> {
  const accessToken = bearerToken(request);
  const authClient =
    dependencies.authClient ?? createSupabaseServerClient() as AuthClient;
  const userLookup = dependencies.userLookup ?? prisma;
  const { data, error } = await authClient.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new HttpError(
      401,
      "UNAUTHORIZED",
      "A valid bearer access token is required",
    );
  }

  const databaseUser = await userLookup.user.findUnique({
    where: { authProviderId: data.user.id },
    select: { id: true },
  });

  if (!databaseUser) {
    throw new HttpError(
      403,
      "ACCOUNT_NOT_PROVISIONED",
      "The authenticated account has not been provisioned",
    );
  }

  return { id: databaseUser.id, authSubject: data.user.id };
}
