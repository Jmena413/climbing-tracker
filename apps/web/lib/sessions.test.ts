import type { Session } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { HttpError } from "./api-errors";
import {
  endSession,
  getActiveSession,
  startSession,
  type SessionServiceDependencies,
} from "./sessions";

const userId = "6cf316dc-b5b9-4e7c-8197-83ea7e1d9177";
const sessionId = "068b2364-3e67-4985-a59a-acce8321db79";
const startedAt = new Date("2026-08-20T13:00:00.000Z");

const session = (overrides: Partial<Session> = {}): Session => ({
  id: sessionId,
  userId,
  gymId: null,
  startedAt,
  endedAt: null,
  notes: null,
  createdAt: startedAt,
  updatedAt: startedAt,
  ...overrides,
});

type Database = NonNullable<SessionServiceDependencies["database"]>;

function databaseWith(
  overrides: Partial<Record<keyof Database["session"], unknown>> = {},
): Database {
  return {
    session: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      updateMany: vi.fn(),
      ...overrides,
    },
  } as unknown as Database;
}

describe("session service", () => {
  it("starts a session owned by the authenticated database user", async () => {
    const created = session();
    const database = databaseWith({
      create: vi.fn().mockResolvedValue(created),
    });

    await expect(
      startSession(
        userId,
        { gymId: null, notes: "Evening session" },
        { database, now: () => startedAt },
      ),
    ).resolves.toEqual(created);
    expect(database.session.create).toHaveBeenCalledWith({
      data: {
        userId,
        gymId: null,
        startedAt,
        notes: "Evening session",
      },
    });
  });

  it("rejects a second active session", async () => {
    const database = databaseWith({
      findFirst: vi.fn().mockResolvedValue(session()),
    });

    await expect(startSession(userId, {}, { database })).rejects
      .toMatchObject<HttpError>({
        status: 409,
        code: "ACTIVE_SESSION_EXISTS",
      });
    expect(database.session.create).not.toHaveBeenCalled();
  });

  it("maps a database uniqueness race to an active-session conflict", async () => {
    const database = databaseWith({
      create: vi.fn().mockRejectedValue({ code: "P2002" }),
    });

    await expect(startSession(userId, {}, { database })).rejects
      .toMatchObject<HttpError>({
        status: 409,
        code: "ACTIVE_SESSION_EXISTS",
      });
  });

  it("gets only the authenticated user's active session", async () => {
    const active = session();
    const findFirst = vi.fn().mockResolvedValue(active);
    const database = databaseWith({ findFirst });

    await expect(getActiveSession(userId, { database })).resolves.toEqual(
      active,
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: { userId, endedAt: null },
    });
  });

  it("does not end a session the authenticated user does not own", async () => {
    const database = databaseWith();

    await expect(endSession(userId, sessionId, {}, { database })).rejects
      .toMatchObject<HttpError>({
        status: 404,
        code: "SESSION_NOT_FOUND",
      });
    expect(database.session.findFirst).toHaveBeenCalledWith({
      where: { id: sessionId, userId },
    });
    expect(database.session.updateMany).not.toHaveBeenCalled();
  });

  it("ends an owned active session with a user-scoped update", async () => {
    const endedAt = new Date("2026-08-20T15:00:00.000Z");
    const ended = session({ endedAt, updatedAt: endedAt });
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce(session())
      .mockResolvedValueOnce(ended);
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const database = databaseWith({ findFirst, updateMany });

    await expect(
      endSession(userId, sessionId, {}, { database, now: () => endedAt }),
    ).resolves.toEqual(ended);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: sessionId, userId, endedAt: null },
      data: { endedAt },
    });
  });

  it("rejects an end time before the session start", async () => {
    const database = databaseWith({
      findFirst: vi.fn().mockResolvedValue(session()),
    });

    await expect(
      endSession(
        userId,
        sessionId,
        { endedAt: "2026-08-20T12:59:59.000Z" },
        { database },
      ),
    ).rejects.toMatchObject<HttpError>({
      status: 400,
      code: "INVALID_END_TIME",
    });
    expect(database.session.updateMany).not.toHaveBeenCalled();
  });
});
