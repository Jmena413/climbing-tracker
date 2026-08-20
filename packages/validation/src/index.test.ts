import { describe, expect, it } from "vitest";
import {
  createSessionClimbSchema,
  endSessionSchema,
  sessionIdParamsSchema,
  startSessionSchema,
} from "./index";

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

describe("session schemas", () => {
  it("accepts an empty start request and valid optional fields", () => {
    expect(startSessionSchema.safeParse({}).success).toBe(true);
    expect(
      startSessionSchema.safeParse({
        gymId: "e3b3f9dc-b3aa-47fd-a0e4-2f15ef0af68c",
        startedAt: "2026-08-20T13:30:00.000Z",
        notes: "Board session",
      }).success,
    ).toBe(true);
  });

  it("rejects client-selected ownership and malformed timestamps", () => {
    expect(
      startSessionSchema.safeParse({ userId: crypto.randomUUID() }).success,
    ).toBe(false);
    expect(
      endSessionSchema.safeParse({ endedAt: "August 20" }).success,
    ).toBe(false);
  });

  it("requires a UUID session route parameter", () => {
    expect(sessionIdParamsSchema.safeParse({ sessionId: "not-a-uuid" }).success)
      .toBe(false);
  });
});
