import type { PrismaClient, Session } from "@prisma/client";
import type {
  EndSessionInput,
  StartSessionInput,
} from "@climbing-tracker/validation";
import { HttpError } from "./api-errors";
import { prisma } from "./prisma";

type SessionDatabase = Pick<PrismaClient, "session">;

export interface SessionServiceDependencies {
  database?: SessionDatabase;
  now?: () => Date;
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

export async function startSession(
  userId: string,
  input: StartSessionInput,
  dependencies: SessionServiceDependencies = {},
): Promise<Session> {
  const database = dependencies.database ?? prisma;
  const activeSession = await database.session.findFirst({
    where: { userId, endedAt: null },
  });

  if (activeSession) {
    throw new HttpError(
      409,
      "ACTIVE_SESSION_EXISTS",
      "The user already has an active session",
    );
  }

  try {
    return await database.session.create({
      data: {
        userId,
        gymId: input.gymId,
        startedAt: input.startedAt
          ? new Date(input.startedAt)
          : (dependencies.now?.() ?? new Date()),
        notes: input.notes,
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new HttpError(
        409,
        "ACTIVE_SESSION_EXISTS",
        "The user already has an active session",
      );
    }
    if (isPrismaError(error, "P2003")) {
      throw new HttpError(400, "INVALID_GYM", "The selected gym does not exist");
    }
    throw error;
  }
}

export async function getActiveSession(
  userId: string,
  dependencies: SessionServiceDependencies = {},
): Promise<Session | null> {
  const database = dependencies.database ?? prisma;
  return database.session.findFirst({
    where: { userId, endedAt: null },
  });
}

export async function endSession(
  userId: string,
  sessionId: string,
  input: EndSessionInput,
  dependencies: SessionServiceDependencies = {},
): Promise<Session> {
  const database = dependencies.database ?? prisma;
  const ownedSession = await database.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!ownedSession) {
    throw new HttpError(404, "SESSION_NOT_FOUND", "Session not found");
  }
  if (ownedSession.endedAt) {
    throw new HttpError(409, "SESSION_ALREADY_ENDED", "Session is already ended");
  }

  const endedAt = input.endedAt
    ? new Date(input.endedAt)
    : (dependencies.now?.() ?? new Date());
  if (endedAt < ownedSession.startedAt) {
    throw new HttpError(
      400,
      "INVALID_END_TIME",
      "Session end time cannot be before its start time",
    );
  }

  const result = await database.session.updateMany({
    where: { id: sessionId, userId, endedAt: null },
    data: { endedAt },
  });
  if (result.count !== 1) {
    throw new HttpError(409, "SESSION_ALREADY_ENDED", "Session is already ended");
  }

  const endedSession = await database.session.findFirst({
    where: { id: sessionId, userId },
  });
  if (!endedSession) {
    throw new HttpError(404, "SESSION_NOT_FOUND", "Session not found");
  }
  return endedSession;
}
