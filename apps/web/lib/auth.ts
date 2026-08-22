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
      select: { id: true; email: true };
    }) => Promise<{ id: string; email?: string } | null>;
    create?: (args: {
      data: { authProviderId: string; email: string };
      select: { id: true; email: true };
    }) => Promise<{ id: string; email: string }>;
    update?: (args: {
      where: { id: string };
      data: { email: string };
      select: { id: true; email: true };
    }) => Promise<{ id: string; email: string }>;
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

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function verifiedEmail(user: SupabaseUser): string {
  const email = user.email?.trim().toLowerCase();
  if (!email || !(user.email_confirmed_at ?? user.confirmed_at)) {
    throw new HttpError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Confirm your email address before accessing Climbing Tracker",
    );
  }
  return email;
}

/**
 * Resolves the local account from the verified Supabase identity.
 *
 * Supabase remains the source of truth for email. We reconcile a changed,
 * verified email on each authenticated request. A unique-email conflict is
 * surfaced as a safe conflict instead of accidentally linking identities.
 */
export async function provisionAuthenticatedUser(
  user: SupabaseUser,
  userLookup: UserLookup,
): Promise<AuthenticatedUser> {
  const email = verifiedEmail(user);
  const existing = await userLookup.user.findUnique({
    where: { authProviderId: user.id },
    select: { id: true, email: true },
  });

  if (existing) {
    if (
      (!existing.email || existing.email.toLowerCase() !== email) &&
      userLookup.user.update
    ) {
      try {
        await userLookup.user.update({
          where: { id: existing.id },
          data: { email },
          select: { id: true, email: true },
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new HttpError(
            409,
            "EMAIL_CONFLICT",
            "This email address is already linked to another account",
          );
        }
        throw error;
      }
    }
    return { id: existing.id, authSubject: user.id };
  }

  if (!userLookup.user.create) {
    throw new HttpError(
      500,
      "ACCOUNT_PROVISIONING_UNAVAILABLE",
      "Account provisioning is not configured",
    );
  }

  try {
    const created = await userLookup.user.create({
      data: { authProviderId: user.id, email },
      select: { id: true, email: true },
    });
    return { id: created.id, authSubject: user.id };
  } catch (error) {
    // A concurrent request may have won the unique authProviderId insert.
    // Read it back so both requests resolve to the same local account.
    if (!isUniqueConstraintError(error)) throw error;
    const concurrent = await userLookup.user.findUnique({
      where: { authProviderId: user.id },
      select: { id: true, email: true },
    });
    if (concurrent) return { id: concurrent.id, authSubject: user.id };
    throw new HttpError(
      409,
      "EMAIL_CONFLICT",
      "This email address is already linked to another account",
    );
  }
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
    dependencies.authClient ?? (createSupabaseServerClient() as AuthClient);
  const userLookup = dependencies.userLookup ?? prisma;
  const { data, error } = await authClient.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new HttpError(
      401,
      "UNAUTHORIZED",
      "A valid bearer access token is required",
    );
  }

  return provisionAuthenticatedUser(data.user, userLookup);
}
