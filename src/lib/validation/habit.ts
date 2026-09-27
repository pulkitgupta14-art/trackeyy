import { z } from "zod";

export const habitFrequencySchema = z.enum([
  "DAILY",
  "WEEKLY",
  "WEEKDAYS",
  "WEEKENDS",
  "CUSTOM_DAYS",
  "INTERVAL",
  "MONTHLY",
  "MULTI_DAILY",
]);

export const habitTypeSchema = z.enum([
  "BOOLEAN",
  "NUMBER",
  "DURATION",
  "DISTANCE",
  "QUANTITY",
]);

export const habitStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);

export const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  categoryId: z.string().cuid().optional(),
  type: habitTypeSchema.default("BOOLEAN"),
  frequency: habitFrequencySchema.default("DAILY"),
  customDays: z.array(z.number().min(0).max(6)).default([]),
  intervalDays: z.number().min(1).max(365).optional(),
  timesPerDay: z.number().min(1).max(10).optional(),
  targetValue: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  reminderEnabled: z.boolean().default(false),
  status: habitStatusSchema.default("ACTIVE"),
});

export const updateHabitSchema = createHabitSchema.partial();

export const habitCompletionSchema = z.object({
  date: z.string().datetime(),
  value: z.number().optional(),
  note: z.string().max(500).optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type HabitCompletionInput = z.infer<typeof habitCompletionSchema>;