import type {
  Habit,
  HabitCompletion,
  HabitScheduleConfig,
  CompletionInput,
  ProgressResult,
  StreakResult,
  DailyScheduleResult,
  ScheduleRangeResult,
  CompletionState,
  TimezoneContext,
  HabitValidationResult,
  CompletionValidationResult,
  DuplicateCompletionPolicy,
} from './types';
import { HabitSchedulingEngine } from './scheduling';
import { HabitCompletionEngine } from './completion';
import { HabitStreakEngine } from './streak';
import { HabitProgressEngine } from './progress';

export class HabitEngineService {
  private schedulingEngine: HabitSchedulingEngine;
  private completionEngine: HabitCompletionEngine;
  private streakEngine: HabitStreakEngine;
  private progressEngine: HabitProgressEngine;
  private timezone: string;

  constructor(timezone: string = 'UTC', duplicatePolicy?: Partial<DuplicateCompletionPolicy>) {
    this.timezone = timezone;
    this.schedulingEngine = new HabitSchedulingEngine(timezone);
    this.completionEngine = new HabitCompletionEngine(timezone, duplicatePolicy);
    this.streakEngine = new HabitStreakEngine(timezone);
    this.progressEngine = new HabitProgressEngine(timezone);
  }

  setTimezone(timezone: string): void {
    this.timezone = timezone;
    this.schedulingEngine.setTimezone(timezone);
    this.completionEngine.setTimezone(timezone);
    this.streakEngine.setTimezone(timezone);
    this.progressEngine.setTimezone(timezone);
  }

  getTimezone(): string {
    return this.timezone;
  }

  getSchedulingEngine(): HabitSchedulingEngine {
    return this.schedulingEngine;
  }

  getCompletionEngine(): HabitCompletionEngine {
    return this.completionEngine;
  }

  getStreakEngine(): HabitStreakEngine {
    return this.streakEngine;
  }

  getProgressEngine(): HabitProgressEngine {
    return this.progressEngine;
  }

  createScheduleConfig(habit: Habit): HabitScheduleConfig {
    return HabitSchedulingEngine.createConfigFromHabit(habit, this.timezone);
  }

  isHabitDueOnDate(habit: Habit, date: Date): boolean {
    const config = this.createScheduleConfig(habit);
    return this.schedulingEngine.isHabitDueOnDate(config, date);
  }

  getDailySchedule(habit: Habit, date: Date, completion: HabitCompletion | null, asOfDate?: Date): DailyScheduleResult {
    const config = this.createScheduleConfig(habit);
    const result = this.schedulingEngine.getDailySchedule(config, date, completion, asOfDate);
    return { ...result, habitId: habit.id };
  }

  getScheduleRange(
    habit: Habit, 
    rangeStart: Date, 
    rangeEnd: Date,
    completions: Map<string, HabitCompletion>
  ): ScheduleRangeResult {
    const config = this.createScheduleConfig(habit);
    const result = this.schedulingEngine.getScheduleRange(config, rangeStart, rangeEnd, completions);
    return { ...result, habitId: habit.id };
  }

  getNextScheduledDate(habit: Habit, fromDate: Date): Date | null {
    const config = this.createScheduleConfig(habit);
    return this.schedulingEngine.getNextScheduledDate(config, fromDate);
  }

  getPreviousScheduledDate(habit: Habit, fromDate: Date): Date | null {
    const config = this.createScheduleConfig(habit);
    return this.schedulingEngine.getPreviousScheduledDate(config, fromDate);
  }

  getAllScheduledDatesInRange(habit: Habit, rangeStart: Date, rangeEnd: Date): Date[] {
    const config = this.createScheduleConfig(habit);
    return this.schedulingEngine.getAllScheduledDatesInRange(config, rangeStart, rangeEnd);
  }

  validateHabit(habit: Partial<Habit>): HabitValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!habit.name || habit.name.trim().length === 0) {
      errors.push('Habit name is required');
    } else if (habit.name.length > 100) {
      errors.push('Habit name must be 100 characters or less');
    }

    if (!habit.type) {
      errors.push('Habit type is required');
    }

    if (!habit.frequency) {
      errors.push('Habit frequency is required');
    }

    if (habit.frequency === 'CUSTOM_DAYS' && (!habit.customDays || habit.customDays.length === 0)) {
      errors.push('Custom days must be specified for CUSTOM_DAYS frequency');
    }

    if (habit.frequency === 'INTERVAL' && (!habit.intervalDays || habit.intervalDays <= 0)) {
      errors.push('Interval days must be a positive number for INTERVAL frequency');
    }

    if (habit.frequency === 'MULTI_DAILY' && (!habit.timesPerDay || habit.timesPerDay <= 0)) {
      errors.push('Times per day must be a positive number for MULTI_DAILY frequency');
    }

    if (habit.type !== 'BOOLEAN') {
      if (habit.targetValue === null || habit.targetValue === undefined || habit.targetValue <= 0) {
        warnings.push('Quantitative habits should have a positive target value');
      }
      
      if (!habit.unit) {
        warnings.push('Quantitative habits should have a unit specified');
      }
    }

    if (habit.startDate && habit.endDate && habit.startDate > habit.endDate) {
      errors.push('Start date must be before end date');
    }

    if (habit.color && !/^#[0-9A-Fa-f]{6}$/.test(habit.color)) {
      errors.push('Color must be a valid hex color code');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateCompletion(input: CompletionInput, habit: Habit): CompletionValidationResult {
    return this.completionEngine.validateCompletion(input, habit);
  }

  createCompletion(input: CompletionInput, habit: Habit): CompletionValidationResult {
    return this.completionEngine.createCompletion(input, habit);
  }

  applyDuplicatePolicy(
    existing: HabitCompletion, 
    newCompletion: HabitCompletion, 
    habit: Habit
  ): HabitCompletion {
    return this.completionEngine.applyDuplicatePolicy(existing, newCompletion, habit);
  }

  markAsSkipped(habit: Habit, date: Date, userId: string, note?: string): HabitCompletion {
    return this.completionEngine.markAsSkipped(habit, date, userId, note);
  }

  markAsMissed(habit: Habit, date: Date, userId: string): HabitCompletion {
    return this.completionEngine.markAsMissed(habit, date, userId);
  }

  undoCompletion(habit: Habit, date: Date, userId: string): { success: boolean; previousState: CompletionState | null } {
    return this.completionEngine.undoCompletion(habit, date, userId);
  }

  getStateForDate(habit: Habit, date: Date, completion: HabitCompletion | null, asOfDate?: Date): CompletionState {
    return this.completionEngine.getStateForDate(habit, date, completion, asOfDate);
  }

  calculateProgress(habit: Habit, completion: HabitCompletion | null, date: Date = new Date()): ProgressResult {
    return this.progressEngine.calculateProgress(habit, completion, date);
  }

  calculateDailyProgress(habit: Habit, completion: HabitCompletion | null): ProgressResult {
    return this.progressEngine.calculateDailyProgress(habit, completion);
  }

  calculateProgressForDate(habit: Habit, completions: Map<string, HabitCompletion>, date: Date): ProgressResult {
    return this.progressEngine.calculateProgressForDate(habit, completions, date);
  }

  calculateRangeProgress(
    habit: Habit, 
    completions: HabitCompletion[], 
    rangeStart: Date, 
    rangeEnd: Date
  ) {
    return this.progressEngine.calculateRangeProgress(habit, completions, rangeStart, rangeEnd);
  }

  getProjectedCompletion(
    habit: Habit, 
    completions: HabitCompletion[], 
    targetDate: Date
  ) {
    return this.progressEngine.getProjectedCompletion(habit, completions, targetDate);
  }

  calculateStreak(
    completions: HabitCompletion[], 
    habit: Habit, 
    asOfDate: Date = new Date()
  ): StreakResult {
    const config = this.createScheduleConfig(habit);
    return this.streakEngine.calculateStreak(completions, config, asOfDate);
  }

  calculateStreakFromDailyResults(dailyResults: DailyScheduleResult[]): StreakResult {
    return this.streakEngine.calculateStreakFromDailyResults(dailyResults);
  }

  getStreakAtDate(
    completions: HabitCompletion[], 
    habit: Habit, 
    checkDate: Date
  ): { currentStreak: number; longestStreak: number } {
    const config = this.createScheduleConfig(habit);
    return this.streakEngine.getStreakAtDate(completions, config, checkDate);
  }

  getStreakHistory(
    completions: HabitCompletion[], 
    habit: Habit, 
    rangeStart: Date, 
    rangeEnd: Date
  ) {
    const config = this.createScheduleConfig(habit);
    return this.streakEngine.getStreakHistory(completions, config, rangeStart, rangeEnd);
  }
}

export function createHabitEngineService(
  timezone: string, 
  duplicatePolicy?: Partial<DuplicateCompletionPolicy>
): HabitEngineService {
  return new HabitEngineService(timezone, duplicatePolicy);
}