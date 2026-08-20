import type { User as SupabaseUser } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { HttpError } from "./api-errors";
import { authenticateRequest } from "./auth";

const requestWithAuthorization = (authorization?: string) =>
  new Request("https://example.test/api/sessions", {
    headers: authorization ? { authorization } : undefined,
  });

const supabaseUser = { id: "supabase-user-1" } as SupabaseUser;

describe("authenticateRequest", () => {
  it("rejects requests without a well-formed bearer token", async () => {
    await expect(authenticateRequest(requestWithAuthorization())).rejects
      .toMatchObject<HttpError>({ status: 401, code: "UNAUTHORIZED" });
    await expect(
      authenticateRequest(requestWithAuthorization("Basic abc")),
    ).rejects.toMatchObject<HttpError>({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("validates the token and resolves the database user by auth subject", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: supabaseUser },
      error: null,
    });
    const findUnique = vi.fn().mockResolvedValue({ id: "database-user-1" });

    await expect(
      authenticateRequest(requestWithAuthorization("Bearer access-token"), {
        authClient: { auth: { getUser } },
        userLookup: { user: { findUnique } },
      }),
    ).resolves.toEqual({
      id: "database-user-1",
      authSubject: "supabase-user-1",
    });
    expect(getUser).toHaveBeenCalledWith("access-token");
    expect(findUnique).toHaveBeenCalledWith({
      where: { authProviderId: "supabase-user-1" },
      select: { id: true },
    });
  });

  it("rejects invalid Supabase sessions", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: new Error("invalid JWT"),
    });

    await expect(
      authenticateRequest(requestWithAuthorization("Bearer bad-token"), {
        authClient: { auth: { getUser } },
        userLookup: { user: { findUnique: vi.fn() } },
      }),
    ).rejects.toMatchObject<HttpError>({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("rejects authenticated subjects without a database user", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: supabaseUser },
      error: null,
    });

    await expect(
      authenticateRequest(requestWithAuthorization("Bearer access-token"), {
        authClient: { auth: { getUser } },
        userLookup: {
          user: { findUnique: vi.fn().mockResolvedValue(null) },
        },
      }),
    ).rejects.toMatchObject<HttpError>({
      status: 403,
      code: "ACCOUNT_NOT_PROVISIONED",
    });
  });
});
