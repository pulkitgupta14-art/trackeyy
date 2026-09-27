import { Habit, HabitCompletion, Activity, Goal, Category, User, Workout, Exercise, WorkoutSet, StudySession, GoalHabit, GoalActivity, NotificationPreference } from "@prisma/client";

export type HabitWithRelations = Habit & {
  category: Category | null;
  completions: HabitCompletion[];
  _count: { completions: number };
};

export type ActivityWithRelations = Activity & {
  workout: (Workout & { exercises: (Exercise & { sets: WorkoutSet[] })[] }) | null;
  studySession: StudySession | null;
};

export type GoalWithRelations = Goal & {
  habitLinks: (GoalHabit & { habit: Habit })[];
  activityLinks: (GoalActivity & { activity: Activity })[];
};

export type UserWithRelations = User & {
  preferences: NotificationPreference | null;
  _count: { habits: number; activities: number; goals: number };
};

export interface HabitFormData {
  name: string;
  description?: string;
  icon?: string;
  color: string;
  categoryId?: string;
  type: "BOOLEAN" | "NUMBER" | "DURATION" | "DISTANCE" | "QUANTITY";
  frequency: "DAILY" | "WEEKDAYS" | "WEEKENDS" | "WEEKLY" | "CUSTOM_DAYS" | "INTERVAL" | "MONTHLY" | "MULTI_DAILY";
  customDays: number[];
  intervalDays?: number;
  timesPerDay?: number;
  targetValue?: number;
  unit?: string;
  startDate?: Date;
  endDate?: Date;
  reminderTime?: string;
  reminderEnabled: boolean;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

export interface ActivityFormData {
  type: "GYM" | "RUNNING" | "WALKING" | "CYCLING" | "BADMINTON" | "STUDYING" | "CODING" | "READING" | "MEDITATION" | "CUSTOM";
  customType?: string;
  name?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  distance?: number;
  quantity?: number;
  unit?: string;
  notes?: string;
  rating?: number;
  workout?: WorkoutFormData;
  studySession?: StudySessionFormData;
}

export interface WorkoutFormData {
  name?: string;
  notes?: string;
  exercises: ExerciseFormData[];
}

export interface ExerciseFormData {
  name: string;
  sortOrder: number;
  notes?: string;
  sets: SetFormData[];
}

export interface SetFormData {
  setNumber: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isPR: boolean;
  isWarmup: boolean;
}

export interface StudySessionFormData {
  subject: string;
  topic?: string;
  goalMinutes?: number;
}

export interface GoalFormData {
  name: string;
  description?: string;
  targetValue: number;
  unit: string;
  deadline: Date;
  autoCalculate: boolean;
  habitLinks: { habitId: string; weight: number }[];
  activityLinks: { activityId: string; weight: number }[];
}

export interface DashboardStats {
  todayCompletion: number;
  todayTotal: number;
  todayCompleted: number;
  currentStreaks: { habitId: string; streak: number }[];
  weeklyConsistency: number;
  activeGoals: number;
  recentActivities: ActivityWithRelations[];
}

export interface CalendarDayData {
  date: Date;
  habits: { habitId: string; completed: boolean; value?: number }[];
  activities: ActivityWithRelations[];
  goals: GoalWithRelations[];
}

export interface AnalyticsData {
  dailyCompletion: { date: string; completed: number; total: number; rate: number }[];
  weeklyCompletion: { week: string; completed: number; total: number; rate: number }[];
  monthlyCompletion: { month: string; completed: number; total: number; rate: number }[];
  habitConsistency: { habitId: string; name: string; rate: number; streak: number }[];
  categoryBreakdown: { category: string; count: number; minutes: number }[];
  streakHistory: { date: string; streak: number }[];
}

export interface Insight {
  id: string;
  type: "streak" | "consistency" | "improvement" | "decline" | "pattern" | "milestone";
  title: string;
  description: string;
  value?: number;
  trend?: "up" | "down" | "neutral";
  relatedHabits?: string[];
  generatedAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}