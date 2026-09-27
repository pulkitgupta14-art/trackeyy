export type HabitType = 'BOOLEAN' | 'NUMBER' | 'DURATION' | 'DISTANCE' | 'QUANTITY';

export type HabitFrequency = 
  | 'DAILY' 
  | 'WEEKLY' 
  | 'WEEKDAYS' 
  | 'WEEKENDS' 
  | 'CUSTOM_DAYS' 
  | 'INTERVAL' 
  | 'MONTHLY' 
  | 'MULTI_DAILY';

export type HabitStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type CompletionState = 
  | 'COMPLETED' 
  | 'PARTIALLY_COMPLETED' 
  | 'MISSED' 
  | 'SKIPPED' 
  | 'SCHEDULED' 
  | 'NOT_SCHEDULED';

export interface HabitScheduleConfig {
  frequency: HabitFrequency;
  customDays: number[];
  intervalDays: number | null;
  timesPerDay: number | null;
  targetValue: number | null;
  startDate: Date;
  endDate: Date | null;
  reminderTime: string | null;
  reminderEnabled: boolean;
  timezone: string;
}

export interface Habit {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  type: HabitType;
  frequency: HabitFrequency;
  customDays: number[];
  intervalDays: number | null;
  timesPerDay: number | null;
  targetValue: number | null;
  unit: string | null;
  startDate: Date;
  endDate: Date | null;
  reminderTime: string | null;
  reminderEnabled: boolean;
  status: HabitStatus;
  sortOrder: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  date: Date;
  completedAt: Date;
  value: number | null;
  note: string | null;
  state: CompletionState;
  scheduledValue: number | null;
  isManualOverride: boolean;
}

export interface CompletionInput {
  habitId: string;
  userId: string;
  date: Date;
  value?: number;
  note?: string;
  state?: CompletionState;
}

export interface ProgressResult {
  value: number;
  target: number;
  percentage: number;
  state: CompletionState;
  isComplete: boolean;
  remaining: number;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
  totalScheduled: number;
  totalCompleted: number;
  totalPartiallyCompleted: number;
  totalMissed: number;
  totalSkipped: number;
}

export interface DailyScheduleResult {
  date: Date;
  habitId: string;
  isScheduled: boolean;
  scheduledCount: number;
  scheduledValue: number | null;
  completion: HabitCompletion | null;
  state: CompletionState;
}

export interface ScheduleRangeResult {
  habitId: string;
  rangeStart: Date;
  rangeEnd: Date;
  scheduledDays: DailyScheduleResult[];
  summary: {
    totalScheduled: number;
    totalCompleted: number;
    totalPartiallyCompleted: number;
    totalMissed: number;
    totalSkipped: number;
    totalNotScheduled: number;
  };
}

export interface HabitValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CompletionValidationResult {
  valid: boolean;
  errors: string[];
  completion: HabitCompletion | null;
}

export interface TimezoneContext {
  timezone: string;
  now: Date;
}

export interface DuplicateCompletionPolicy {
  allow: boolean;
  replace: boolean;
  maxPerDay: number;
}