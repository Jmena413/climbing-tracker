import { V_SCALE_GRADES } from "@climbing-tracker/domain";
import { z } from "zod";

export const gradeSchema = z.object({
  system: z.literal("V_SCALE"),
  value: z.enum(V_SCALE_GRADES),
});

export const createSessionClimbSchema = z.object({
  grade: gradeSchema,
  attempts: z.number().int().min(1),
  sent: z.boolean(),
});

export type CreateSessionClimbInput = z.infer<typeof createSessionClimbSchema>;

const sessionTimestampSchema = z
  .string()
  .datetime({ offset: true, precision: 3 });

export const startSessionSchema = z
  .object({
    gymId: z.string().uuid().nullable().optional(),
    startedAt: sessionTimestampSchema.optional(),
    notes: z.string().trim().max(2_000).nullable().optional(),
  })
  .strict();

export const endSessionSchema = z
  .object({
    endedAt: sessionTimestampSchema.optional(),
  })
  .strict();

export const sessionIdParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type EndSessionInput = z.infer<typeof endSessionSchema>;
