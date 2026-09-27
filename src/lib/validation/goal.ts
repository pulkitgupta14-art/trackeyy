import { z } from "zod";

export const goalStatusSchema = z.enum(["ACTIVE", "COMPLETED", "PAUSED", "FAILED"]);

export const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetValue: z.number().positive(),
  unit: z.string().min(1).max(20),
  deadline: z.string().datetime(),
  autoCalculate: z.boolean().default(true),
  habitLinks: z.array(
    z.object({
      habitId: z.string().cuid(),
      weight: z.number().positive().default(1),
    })
  ).default([]),
  activityLinks: z.array(
    z.object({
      activityId: z.string().cuid(),
      weight: z.number().positive().default(1),
    })
  ).default([]),
});

export const updateGoalSchema = createGoalSchema.partial();

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;