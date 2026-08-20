import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "./index";

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
});
