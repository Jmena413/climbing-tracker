import { describe, expect, it } from "vitest";
import { isFlash } from "./index";

describe("isFlash", () => {
  it("derives a flash from a one-attempt send", () => {
    expect(isFlash({ attempts: 1, sent: true })).toBe(true);
    expect(isFlash({ attempts: 2, sent: true })).toBe(false);
    expect(isFlash({ attempts: 1, sent: false })).toBe(false);
  });
});
