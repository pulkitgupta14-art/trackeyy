import { startOfDay, endOfDay, isSameDay, isBefore, isAfter } from 'date-fns';
// @ts-ignore
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import type {
  Habit,
  HabitCompletion,
  CompletionInput,
  CompletionState,
  ProgressResult,
  CompletionValidationResult,
  HabitScheduleConfig,
  DuplicateCompletionPolicy,
} from './types';
import { HabitSchedulingEngine } from './scheduling';

export class HabitCompletionEngine {
  private schedulingEngine: HabitSchedulingEngine;
  private duplicatePolicy: DuplicateCompletionPolicy;

  constructor(timezone: string = 'UTC', duplicatePolicy?: Partial<DuplicateCompletionPolicy>) {
    this.schedulingEngine = new HabitSchedulingEngine(timezone);
    this.duplicatePolicy = {
      allow: duplicatePolicy?.allow ?? true,
      replace: duplicatePolicy?.replace ?? true,
      maxPerDay: duplicatePolicy?.maxPerDay ?? 1,
    };
  }

  setTimezone(timezone: string): void {
    this.schedulingEngine.setTimezone(timezone);
  }

  getSchedulingEngine(): HabitSchedulingEngine {
    return this.schedulingEngine;
  }

  private getUtcStartOfDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  }

  calculateProgress(
    habit: Habit,
    completion: HabitCompletion | null,
    date: Date
  ): ProgressResult {
    const config = HabitSchedulingEngine.createConfigFromHabit(habit, this.schedulingEngine.getTimezone());
    const isScheduled = this.schedulingEngine.isHabitDueOnDate(config, date);
    
    if (!isScheduled) {
      return {
        value: 0,
        target: 0,
        percentage: 0,
        state: 'NOT_SCHEDULED',
        isComplete: false,
        remaining: 0,
      };
    }

    const target = habit.targetValue ?? 1;
    const value = completion?.value ?? (completion ? 1 : 0);
    const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;
    const remaining = Math.max(target - value, 0);

    let state: CompletionState;
    if (!completion) {
      const now = utcToZonedTime(new Date(), this.schedulingEngine.getTimezone());
      const checkDate = utcToZonedTime(date, this.schedulingEngine.getTimezone());
      state = isBefore(checkDate, startOfDay(now)) ? 'MISSED' : 'SCHEDULED';
    } else {
      state = completion.state;
    }

    let isComplete = false;
    switch (habit.type) {
      case 'BOOLEAN':
        isComplete = state === 'COMPLETED';
        break;
      case 'NUMBER':
      case 'DURATION':
      case 'DISTANCE':
      case 'QUANTITY':
        isComplete = value >= target;
        break;
    }

    return {
      value,
      target,
      percentage: Math.round(percentage * 100) / 100,
      state,
      isComplete,
      remaining,
    };
  }

  validateCompletion(input: CompletionInput, habit: Habit): CompletionValidationResult {
    const errors: string[] = [];
    const config = HabitSchedulingEngine.createConfigFromHabit(habit, this.schedulingEngine.getTimezone());
    const isScheduled = this.schedulingEngine.isHabitDueOnDate(config, input.date);

    if (!isScheduled) {
      errors.push('Habit is not scheduled for this date');
    }

    if (habit.status !== 'ACTIVE') {
      errors.push('Cannot complete inactive or archived habit');
    }

    if (input.value !== undefined && input.value !== null) {
      if (input.value < 0) {
        errors.push('Completion value cannot be negative');
      }

      if (habit.targetValue !== null && habit.targetValue !== undefined && input.value > habit.targetValue * 10) {
        errors.push('Completion value exceeds reasonable maximum');
      }
    }

    if (habit.type === 'BOOLEAN' && input.value !== undefined && input.value !== null) {
      if (input.value < 0) {
        errors.push('Boolean habit value cannot be negative');
      }
    }

    if (input.value !== undefined && habit.targetValue && input.value > habit.targetValue) {
    }

    const completion: HabitCompletion = {
      id: crypto.randomUUID(),
      habitId: input.habitId,
      userId: input.userId,
      date: this.getUtcStartOfDay(input.date),
      completedAt: new Date(),
      value: input.value ?? null,
      note: input.note ?? null,
      state: input.state ?? this.determineState(habit, input.value),
      scheduledValue: habit.targetValue ?? null,
      isManualOverride: !!input.state,
    };

    return {
      valid: errors.length === 0,
      errors,
      completion: errors.length === 0 ? completion : null,
    };
  }

  private determineState(habit: Habit, value: number | undefined): CompletionState {
    if (value === undefined || value === null) {
      return 'COMPLETED';
    }

    if (habit.type === 'BOOLEAN') {
      return value >= 1 ? 'COMPLETED' : 'PARTIALLY_COMPLETED';
    }

    if (!habit.targetValue || habit.targetValue <= 0) {
      return value > 0 ? 'COMPLETED' : 'PARTIALLY_COMPLETED';
    }

    const percentage = (value / habit.targetValue) * 100;

    if (percentage >= 100) {
      return 'COMPLETED';
    } else if (percentage > 0) {
      return 'PARTIALLY_COMPLETED';
    } else {
      return 'MISSED';
    }
  }

  createCompletion(input: CompletionInput, habit: Habit): CompletionValidationResult {
    return this.validateCompletion(input, habit);
  }

  applyDuplicatePolicy(
    existing: HabitCompletion,
    newCompletion: HabitCompletion,
    habit: Habit
  ): HabitCompletion {
    if (!this.duplicatePolicy.allow) {
      throw new Error('Duplicate completion not allowed');
    }

    if (this.duplicatePolicy.replace) {
      return {
        ...newCompletion,
        id: existing.id,
        completedAt: new Date(),
      };
    }

    if (existing.value !== null && newCompletion.value !== null) {
      return {
        ...existing,
        value: existing.value + newCompletion.value,
        completedAt: new Date(),
      };
    }

    return existing;
  }

  markAsSkipped(habit: Habit, date: Date, userId: string, note?: string): HabitCompletion {
    const config = HabitSchedulingEngine.createConfigFromHabit(habit, this.schedulingEngine.getTimezone());
    const isScheduled = this.schedulingEngine.isHabitDueOnDate(config, date);

    if (!isScheduled) {
      throw new Error('Cannot skip a habit that is not scheduled for this date');
    }

    return {
      id: crypto.randomUUID(),
      habitId: habit.id,
      userId,
      date: startOfDay(utcToZonedTime(date, this.schedulingEngine.getTimezone())),
      completedAt: new Date(),
      value: 0,
      note: note ?? null,
      state: 'SKIPPED',
      scheduledValue: habit.targetValue ?? null,
      isManualOverride: true,
    };
  }

  markAsMissed(habit: Habit, date: Date, userId: string): HabitCompletion {
    const config = HabitSchedulingEngine.createConfigFromHabit(habit, this.schedulingEngine.getTimezone());
    const isScheduled = this.schedulingEngine.isHabitDueOnDate(config, date);

    if (!isScheduled) {
      throw new Error('Cannot mark a habit as missed if it was not scheduled');
    }

    return {
      id: crypto.randomUUID(),
      habitId: habit.id,
      userId,
      date: startOfDay(utcToZonedTime(date, this.schedulingEngine.getTimezone())),
      completedAt: new Date(),
      value: 0,
      note: null,
      state: 'MISSED',
      scheduledValue: habit.targetValue ?? null,
      isManualOverride: true,
    };
  }

  undoCompletion(habit: Habit, date: Date, userId: string): { success: boolean; previousState: CompletionState | null } {
    const config = HabitSchedulingEngine.createConfigFromHabit(habit, this.schedulingEngine.getTimezone());
    const isScheduled = this.schedulingEngine.isHabitDueOnDate(config, date);

    if (!isScheduled) {
      return { success: false, previousState: null };
    }

    return { success: true, previousState: 'SCHEDULED' };
  }

  getStateForDate(habit: Habit, date: Date, completion: HabitCompletion | null, asOfDate?: Date): CompletionState {
    const config = HabitSchedulingEngine.createConfigFromHabit(habit, this.schedulingEngine.getTimezone());
    const isScheduled = this.schedulingEngine.isHabitDueOnDate(config, date);

    if (!isScheduled) {
      return 'NOT_SCHEDULED';
    }

    if (completion) {
      return completion.state;
    }

    const now = asOfDate ? utcToZonedTime(asOfDate, this.schedulingEngine.getTimezone()) : utcToZonedTime(new Date(), this.schedulingEngine.getTimezone());
    const checkDate = utcToZonedTime(date, this.schedulingEngine.getTimezone());

    if (isBefore(checkDate, startOfDay(now))) {
      return 'MISSED';
    }

    return 'SCHEDULED';
  }
}

export function createCompletionEngine(
  timezone: string, 
  duplicatePolicy?: Partial<DuplicateCompletionPolicy>
): HabitCompletionEngine {
  return new HabitCompletionEngine(timezone, duplicatePolicy);
}