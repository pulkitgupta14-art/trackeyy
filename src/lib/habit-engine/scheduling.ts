import { 
  startOfDay, 
  endOfDay, 
  isSameDay, 
  addDays, 
  differenceInDays, 
  isBefore, 
  isAfter, 
  parseISO,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
// @ts-ignore
import { utcToZonedTime, zonedTimeToUtc, formatInTimeZone } from 'date-fns-tz';
import type {
  HabitScheduleConfig,
  DailyScheduleResult,
  ScheduleRangeResult,
  Habit,
  HabitCompletion,
  TimezoneContext,
  CompletionState,
} from './types';

export class HabitSchedulingEngine {
  private timezone: string;

  constructor(timezone: string = 'UTC') {
    this.timezone = timezone;
  }

  setTimezone(timezone: string): void {
    this.timezone = timezone;
  }

  getTimezone(): string {
    return this.timezone;
  }

  private toZonedTime(date: Date): Date {
    return utcToZonedTime(date, this.timezone);
  }

  private toUtcTime(date: Date): Date {
    return zonedTimeToUtc(date, this.timezone);
  }

  private getDayOfWeek(date: Date): number {
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // 'c' token = stand-alone local day of week (1=Monday, 7=Sunday in ISO)
    const dayStr = formatInTimeZone(date, this.timezone, 'c');
    const day = parseInt(dayStr, 10);
    if (isNaN(day)) {
      // Fallback: use day name
      const dayName = formatInTimeZone(date, this.timezone, 'EEEE');
      const dayMap: Record<string, number> = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6,
      };
      return dayMap[dayName] ?? 0;
    }
    // Convert ISO (1=Mon, 7=Sun) to 0=Sun, 1=Mon, ..., 6=Sat
    return day % 7;
  }

  private getDateOfMonth(date: Date): number {
    return parseInt(formatInTimeZone(date, this.timezone, 'd'), 10);
  }

  getStartOfDay(date: Date): Date {
    const zoned = this.toZonedTime(date);
    const year = parseInt(formatInTimeZone(zoned, this.timezone, 'yyyy'), 10);
    const month = parseInt(formatInTimeZone(zoned, this.timezone, 'M'), 10) - 1;
    const day = parseInt(formatInTimeZone(zoned, this.timezone, 'd'), 10);
    const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return this.toUtcTime(start);
  }

  getEndOfDay(date: Date): Date {
    const year = parseInt(formatInTimeZone(date, this.timezone, 'yyyy'), 10);
    const month = parseInt(formatInTimeZone(date, this.timezone, 'M'), 10) - 1;
    const day = parseInt(formatInTimeZone(date, this.timezone, 'd'), 10);
    const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    return this.toUtcTime(end);
  }

  isHabitDueOnDate(config: HabitScheduleConfig, date: Date): boolean {
    const checkDate = this.toZonedTime(date);
    const habitStart = this.toZonedTime(config.startDate);
    const habitEnd = config.endDate ? this.toZonedTime(config.endDate) : null;

    const startOfDayCheck = this.getStartOfDay(checkDate);
    const startOfDayHabitStart = this.getStartOfDay(habitStart);

    if (isBefore(date, startOfDayHabitStart)) return false;
    if (habitEnd) {
      const endOfDayHabitEnd = this.getEndOfDay(habitEnd);
      if (isAfter(date, endOfDayHabitEnd)) return false;
    }

    const dayOfWeek = this.getDayOfWeek(checkDate);

    switch (config.frequency) {
      case 'DAILY':
        return true;
      case 'WEEKDAYS':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'WEEKENDS':
        return dayOfWeek === 0 || dayOfWeek === 6;
      case 'WEEKLY':
        return dayOfWeek === this.getDayOfWeek(habitStart);
      case 'CUSTOM_DAYS':
        return config.customDays.includes(dayOfWeek);
      case 'INTERVAL':
        if (!config.intervalDays || config.intervalDays <= 0) return false;
        const daysDiff = differenceInDays(this.getStartOfDay(checkDate), this.getStartOfDay(habitStart));
        return daysDiff % config.intervalDays === 0;
      case 'MONTHLY':
        return this.getDateOfMonth(checkDate) === this.getDateOfMonth(habitStart);
      case 'MULTI_DAILY':
        return true;
      default:
        return false;
    }
  }

  getScheduledCountForDate(config: HabitScheduleConfig, date: Date): number {
    if (!this.isHabitDueOnDate(config, date)) return 0;
    
    if (config.frequency === 'MULTI_DAILY' && config.timesPerDay) {
      return config.timesPerDay;
    }
    return 1;
  }

  getScheduledValueForDate(config: HabitScheduleConfig, date: Date): number | null {
    const count = this.getScheduledCountForDate(config, date);
    if (count === 0) return null;
    
    if (config.targetValue !== null && config.targetValue !== undefined) {
      return config.targetValue;
    }
    return null;
  }

  getDailySchedule(config: HabitScheduleConfig, date: Date, completion: HabitCompletion | null, asOfDate?: Date): DailyScheduleResult {
    const isScheduled = this.isHabitDueOnDate(config, date);
    const scheduledCount = this.getScheduledCountForDate(config, date);
    const scheduledValue = this.getScheduledValueForDate(config, date);

    let state: CompletionState = 'NOT_SCHEDULED';

    if (isScheduled) {
      if (completion) {
        switch (completion.state) {
          case 'COMPLETED':
            state = 'COMPLETED';
            break;
          case 'PARTIALLY_COMPLETED':
            state = 'PARTIALLY_COMPLETED';
            break;
          case 'SKIPPED':
            state = 'SKIPPED';
            break;
          default:
            state = 'SCHEDULED';
        }
      } else {
        const now = asOfDate ? this.toZonedTime(asOfDate) : this.toZonedTime(new Date());
        const checkDate = this.toZonedTime(date);
        const startOfDayNow = this.getStartOfDay(now);
        const startOfDayCheck = this.getStartOfDay(checkDate);
        
        if (isBefore(date, startOfDayNow)) {
          state = 'MISSED';
        } else {
          state = 'SCHEDULED';
        }
      }
    }

    return {
      date: this.toZonedTime(date),
      habitId: '',
      isScheduled,
      scheduledCount,
      scheduledValue,
      completion,
      state,
    };
  }

  getScheduleRange(
    config: HabitScheduleConfig, 
    rangeStart: Date, 
    rangeEnd: Date,
    completions: Map<string, HabitCompletion>
  ): ScheduleRangeResult {
    const scheduledDays: DailyScheduleResult[] = [];
    let totalScheduled = 0;
    let totalCompleted = 0;
    let totalPartiallyCompleted = 0;
    let totalMissed = 0;
    let totalSkipped = 0;
    let totalNotScheduled = 0;

    let current = this.getStartOfDay(rangeStart);
    const end = this.getEndOfDay(rangeEnd);

    while (!isAfter(current, end)) {
      const dateKey = formatInTimeZone(current, this.timezone, 'yyyy-MM-dd');
      const completion = completions.get(dateKey) || null;
      const dailyResult = this.getDailySchedule(config, current, completion);
      
      scheduledDays.push(dailyResult);

      if (dailyResult.isScheduled) {
        totalScheduled++;
      }

      switch (dailyResult.state) {
        case 'COMPLETED':
          totalCompleted++;
          break;
        case 'PARTIALLY_COMPLETED':
          totalPartiallyCompleted++;
          break;
        case 'MISSED':
          totalMissed++;
          break;
        case 'SKIPPED':
          totalSkipped++;
          break;
        case 'SCHEDULED':
          break;
        case 'NOT_SCHEDULED':
          totalNotScheduled++;
          break;
      }

      current = addDays(current, 1);
    }

    return {
      habitId: '',
      rangeStart: this.toZonedTime(rangeStart),
      rangeEnd: this.toZonedTime(rangeEnd),
      scheduledDays,
      summary: {
        totalScheduled,
        totalCompleted,
        totalPartiallyCompleted,
        totalMissed,
        totalSkipped,
        totalNotScheduled,
      },
    };
  }

getNextScheduledDate(config: HabitScheduleConfig, fromDate: Date): Date | null {
    const current = this.getStartOfDay(fromDate);
    const maxDaysToCheck = 366;

    for (let i = 0; i < maxDaysToCheck; i++) {
      const checkDate = this.addDays(current, i + 1);
      if (this.isHabitDueOnDate(config, checkDate)) {
        return checkDate;
      }
    }
    return null;
  }

  getPreviousScheduledDate(config: HabitScheduleConfig, fromDate: Date): Date | null {
    const current = this.getStartOfDay(fromDate);
    const maxDaysToCheck = 366;

    for (let i = 0; i < maxDaysToCheck; i++) {
      const checkDate = this.addDays(current, -(i + 1));
      if (this.isHabitDueOnDate(config, checkDate)) {
        return checkDate;
      }
    }
    return null;
  }

  addDays(date: Date, days: number): Date {
    const zoned = this.toZonedTime(date);
    const year = parseInt(formatInTimeZone(zoned, this.timezone, 'yyyy'), 10);
    const month = parseInt(formatInTimeZone(zoned, this.timezone, 'M'), 10) - 1;
    const day = parseInt(formatInTimeZone(zoned, this.timezone, 'd'), 10);
    const newDate = new Date(Date.UTC(year, month, day + days, 12, 0, 0, 0)); // Use noon to avoid DST issues
    return this.toUtcTime(newDate);
  }

  getAllScheduledDatesInRange(config: HabitScheduleConfig, rangeStart: Date, rangeEnd: Date): Date[] {
    const dates: Date[] = [];
    let current = this.getStartOfDay(rangeStart);
    const end = this.getEndOfDay(rangeEnd);

    while (!isAfter(current, end)) {
      if (this.isHabitDueOnDate(config, current)) {
        dates.push(new Date(current));
      }
      current = this.addDays(current, 1);
    }

    return dates;
  }

  static createConfigFromHabit(habit: Habit, timezone: string): HabitScheduleConfig {
    return {
      frequency: habit.frequency as HabitScheduleConfig['frequency'],
      customDays: habit.customDays || [],
      intervalDays: habit.intervalDays,
      timesPerDay: habit.timesPerDay,
      targetValue: habit.targetValue,
      startDate: habit.startDate,
      endDate: habit.endDate,
      reminderTime: habit.reminderTime,
      reminderEnabled: habit.reminderEnabled,
      timezone,
    };
  }
}

export function createSchedulingEngine(timezone: string): HabitSchedulingEngine {
  return new HabitSchedulingEngine(timezone);
}