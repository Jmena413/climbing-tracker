import { describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient } from "./index";

const session = {
  id: "068b2364-3e67-4985-a59a-acce8321db79",
  gymId: null,
  startedAt: "2026-08-20T13:00:00.000Z",
  endedAt: null,
  notes: null,
  createdAt: "2026-08-20T13:00:00.000Z",
  updatedAt: "2026-08-20T13:00:00.000Z",
};

describe("API client", () => {
  it("attaches the current access token", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ status: "ok" })));
    const api = createApiClient({
      baseUrl: "https://example.test",
      getAccessToken: async () => "token",
      fetch,
    });
    await expect(api.health()).resolves.toEqual({ status: "ok" });
    expect(fetch).toHaveBeenCalledWith("https://example.test/api/health", {
      headers: { Authorization: "Bearer token" },
    });
  });

  it("starts, gets, and ends authenticated sessions", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session }), { status: 201 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ session })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ session: { ...session, endedAt: session.updatedAt } }),
        ),
      );
    const api = createApiClient({
      baseUrl: "https://example.test",
      getAccessToken: async () => "token",
      fetch,
    });

    await expect(api.startSession()).resolves.toEqual(session);
    await expect(api.getActiveSession()).resolves.toEqual(session);
    await expect(api.endSession(session.id)).resolves.toMatchObject({
      id: session.id,
      endedAt: session.updatedAt,
    });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://example.test/api/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: "{}",
      },
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "https://example.test/api/sessions/active",
      { headers: { Authorization: "Bearer token" } },
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      `https://example.test/api/sessions/${session.id}/end`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: "{}",
      },
    );
  });

  it("surfaces API error messages", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "ACTIVE_SESSION_EXISTS",
            message: "The user already has an active session",
          },
        }),
        { status: 409 },
      ),
    );
    const api = createApiClient({
      baseUrl: "https://example.test",
      getAccessToken: async () => "token",
      fetch,
    });

    await expect(api.startSession()).rejects.toEqual(
      new ApiError(409, "The user already has an active session"),
    );
  });
});
