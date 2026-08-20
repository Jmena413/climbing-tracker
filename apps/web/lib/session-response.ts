import type { Session } from "@prisma/client";
import type { SessionDto } from "@climbing-tracker/domain";

export function toSessionDto(session: Session): SessionDto {
  return {
    id: session.id,
    gymId: session.gymId,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
