import { describe, expect, it } from "vitest";
import { authCallbackPath, safeAuthNext } from "./auth-redirect";

describe("auth redirect helpers", () => {
  it("keeps safe internal paths and their query string", () => {
    expect(safeAuthNext("/auth/update-password?from=recovery")).toBe(
      "/auth/update-password?from=recovery",
    );
  });

  it("rejects absolute and protocol-relative redirects", () => {
    expect(safeAuthNext("https://evil.example/steal")).toBe("/");
    expect(safeAuthNext("//evil.example/steal")).toBe("/");
    expect(safeAuthNext("not-a-path")).toBe("/");
  });

  it("encodes a callback destination", () => {
    expect(authCallbackPath("/auth/update-password")).toBe(
      "/auth/callback?next=%2Fauth%2Fupdate-password",
    );
  });
});
