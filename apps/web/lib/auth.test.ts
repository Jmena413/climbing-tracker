import type { User as SupabaseUser } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { authenticateRequest } from "./auth";

const requestWithAuthorization = (authorization?: string) =>
  new Request("https://example.test/api/sessions", {
    headers: authorization ? { authorization } : undefined,
  });

const supabaseUser = {
  id: "supabase-user-1",
  email: "climber@example.com",
  email_confirmed_at: "2026-08-21T12:00:00.000Z",
} as SupabaseUser;

describe("authenticateRequest", () => {
  it("rejects requests without a well-formed bearer token", async () => {
    await expect(
      authenticateRequest(requestWithAuthorization()),
    ).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
    await expect(
      authenticateRequest(requestWithAuthorization("Basic abc")),
    ).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("validates the token and resolves the database user by auth subject", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: supabaseUser },
      error: null,
    });
    const findUnique = vi.fn().mockResolvedValue({
      id: "database-user-1",
      email: "climber@example.com",
    });

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
      select: { id: true, email: true },
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
    ).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("provisions authenticated subjects without a database user", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: supabaseUser },
      error: null,
    });

    const create = vi.fn().mockResolvedValue({
      id: "database-user-1",
      email: "climber@example.com",
    });
    await expect(
      authenticateRequest(requestWithAuthorization("Bearer access-token"), {
        authClient: { auth: { getUser } },
        userLookup: {
          user: { findUnique: vi.fn().mockResolvedValue(null), create },
        },
      }),
    ).resolves.toEqual({
      id: "database-user-1",
      authSubject: "supabase-user-1",
    });
    expect(create).toHaveBeenCalledWith({
      data: { authProviderId: "supabase-user-1", email: "climber@example.com" },
      select: { id: true, email: true },
    });
  });

  it("rejects an authenticated user whose email is not verified", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { ...supabaseUser, email_confirmed_at: null } },
      error: null,
    });

    await expect(
      authenticateRequest(requestWithAuthorization("Bearer access-token"), {
        authClient: { auth: { getUser } },
        userLookup: { user: { findUnique: vi.fn() } },
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "EMAIL_NOT_VERIFIED",
    });
  });

  it("rejects a verified subject that has no email", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: {
        user: { ...supabaseUser, email: null },
      },
      error: null,
    });

    await expect(
      authenticateRequest(requestWithAuthorization("Bearer access-token"), {
        authClient: { auth: { getUser } },
        userLookup: { user: { findUnique: vi.fn() } },
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "EMAIL_NOT_VERIFIED",
    });
  });

  it("synchronizes a changed verified email", async () => {
    const update = vi.fn().mockResolvedValue({
      id: "database-user-1",
      email: "new@example.com",
    });
    const findUnique = vi.fn().mockResolvedValue({
      id: "database-user-1",
      email: "old@example.com",
    });

    await expect(
      authenticateRequest(requestWithAuthorization("Bearer access-token"), {
        authClient: {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: {
                user: { ...supabaseUser, email: "new@example.com" },
              },
              error: null,
            }),
          },
        },
        userLookup: { user: { findUnique, update } },
      }),
    ).resolves.toEqual({
      id: "database-user-1",
      authSubject: "supabase-user-1",
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "database-user-1" },
      data: { email: "new@example.com" },
      select: { id: true, email: true },
    });
  });

  it("does not relink an identity when verified email synchronization conflicts", async () => {
    const update = vi.fn().mockRejectedValue({ code: "P2002" });

    await expect(
      authenticateRequest(requestWithAuthorization("Bearer access-token"), {
        authClient: {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { ...supabaseUser, email: "new@example.com" } },
              error: null,
            }),
          },
        },
        userLookup: {
          user: {
            findUnique: vi.fn().mockResolvedValue({
              id: "database-user-1",
              email: "old@example.com",
            }),
            update,
          },
        },
      }),
    ).rejects.toMatchObject({ status: 409, code: "EMAIL_CONFLICT" });
  });

  it("reads back a concurrent provision instead of duplicating a user", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "database-user-1",
        email: "climber@example.com",
      });
    const create = vi.fn().mockRejectedValue({ code: "P2002" });

    await expect(
      authenticateRequest(requestWithAuthorization("Bearer access-token"), {
        authClient: {
          auth: {
            getUser: vi
              .fn()
              .mockResolvedValue({ data: { user: supabaseUser }, error: null }),
          },
        },
        userLookup: { user: { findUnique, create } },
      }),
    ).resolves.toEqual({
      id: "database-user-1",
      authSubject: "supabase-user-1",
    });
  });
});
