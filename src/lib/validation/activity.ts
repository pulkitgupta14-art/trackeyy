import { z } from "zod";

export const activityTypeSchema = z.enum([
  "GYM",
  "RUNNING",
  "WALKING",
  "CYCLING",
  "BADMINTON",
  "STUDYING",
  "CODING",
  "READING",
  "MEDITATION",
  "CUSTOM",
]);

export const createActivitySchema = z.object({
  type: activityTypeSchema,
  customType: z.string().max(50).optional(),
  name: z.string().max(100).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().min(1).max(1440).optional(),
  distance: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export const workoutSchema = z.object({
  name: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  exercises: z.array(
    z.object({
      name: z.string().min(1).max(100),
      sortOrder: z.number().default(0),
      notes: z.string().max(500).optional(),
      sets: z.array(
        z.object({
          setNumber: z.number().min(1),
          weight: z.number().positive().optional(),
          reps: z.number().min(1).optional(),
          duration: z.number().min(1).optional(),
          distance: z.number().positive().optional(),
          isPR: z.boolean().default(false),
          isWarmup: z.boolean().default(false),
        })
      ).min(1),
    })
  ).min(1),
});

export const studySessionSchema = z.object({
  subject: z.string().min(1).max(100),
  topic: z.string().max(100).optional(),
  goalMinutes: z.number().min(1).max(1440).optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
export type StudySessionInput = z.infer<typeof studySessionSchema>;