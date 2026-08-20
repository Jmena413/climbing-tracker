import { describe, expect, it } from "vitest";
import { createSessionClimbSchema } from "./index";

describe("createSessionClimbSchema", () => {
  it("rejects attempt counts below one", () => {
    expect(
      createSessionClimbSchema.safeParse({
        grade: { system: "V_SCALE", value: "V3" },
        attempts: 0,
        sent: false,
      }).success,
    ).toBe(false);
  });
});
