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
