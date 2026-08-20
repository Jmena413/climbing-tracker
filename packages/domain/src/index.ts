export const V_SCALE_GRADES = [
  "VB",
  "V0",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
  "V7",
  "V8",
  "V9",
  "V10",
  "V11",
  "V12",
  "V13",
  "V14",
  "V15",
  "V16",
  "V17",
] as const;

export type VScaleGrade = (typeof V_SCALE_GRADES)[number];
export type Grade = { system: "V_SCALE"; value: VScaleGrade };

export interface Session {
  id: string;
  userId: string;
  gymId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDto {
  id: string;
  gymId: string | null;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionClimb {
  id: string;
  sessionId: string;
  grade: Grade;
  attempts: number;
  sent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const isFlash = (
  climb: Pick<SessionClimb, "attempts" | "sent">,
): boolean => climb.sent && climb.attempts === 1;
