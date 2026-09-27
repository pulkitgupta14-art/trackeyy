import { startOfDay, endOfDay, isSameDay, addDays, differenceInDays, getDay, isBefore, isAfter, format } from 'date-fns';
// @ts-ignore
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import type {
  HabitScheduleConfig,
  StreakResult,
  HabitCompletion,
  DailyScheduleResult,
  CompletionState,
} from './types';
import { HabitSchedulingEngine } from './scheduling';

export class HabitStreakEngine {
  private schedulingEngine: HabitSchedulingEngine;

  constructor(timezone: string = 'UTC') {
    this.schedulingEngine = new HabitSchedulingEngine(timezone);
  }

  setTimezone(timezone: string): void {
    this.schedulingEngine.setTimezone(timezone);
  }

  calculateStreak(
    completions: HabitCompletion[],
    config: HabitScheduleConfig,
    asOfDate: Date = new Date()
  ): StreakResult {
    if (completions.length === 0) {
      return this.emptyStreakResult();
    }

    const zonedCompletions = completions.map(c => ({
      ...c,
      date: utcToZonedTime(c.date, this.schedulingEngine.getTimezone()),
    }));

    const zonedAsOf = utcToZonedTime(asOfDate, this.schedulingEngine.getTimezone());
    const habitStart = utcToZonedTime(config.startDate, this.schedulingEngine.getTimezone());

    const completionMap = new Map<string, HabitCompletion>();
    for (const c of zonedCompletions) {
      const key = this.getDateKey(c.date);
      if (!completionMap.has(key) || this.isBetterCompletion(c, completionMap.get(key)!)) {
        completionMap.set(key, c);
      }
    }

    const dueDates = this.getDueDatesInRange(config, habitStart, zonedAsOf);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalScheduled = 0;
    let totalCompleted = 0;
    let totalPartiallyCompleted = 0;
    let totalMissed = 0;
    let totalSkipped = 0;

    for (const dueDate of dueDates) {
      const key = this.getDateKey(dueDate);
      const completion = completionMap.get(key);
      const isCompleted = completion && (
        completion.state === 'COMPLETED' || 
        completion.state === 'PARTIALLY_COMPLETED'
      );
      const isSkipped = completion?.state === 'SKIPPED';

      if (isCompleted) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        
        if (completion.state === 'COMPLETED') {
          totalCompleted++;
        } else {
          totalPartiallyCompleted++;
        }
      } else if (isSkipped) {
        totalSkipped++;
        tempStreak = 0;
      } else {
        totalMissed++;
        tempStreak = 0;
      }
      totalScheduled++;
    }

    currentStreak = tempStreak;

    const completionRate = totalScheduled > 0 
      ? (totalCompleted + totalPartiallyCompleted * 0.5) / totalScheduled 
      : 0;

    const weeklyConsistency = this.calculateWeeklyConsistency(
      zonedCompletions,
      config,
      zonedAsOf
    );

    const monthlyConsistency = this.calculateMonthlyConsistency(
      zonedCompletions,
      config,
      zonedAsOf
    );

    return {
      currentStreak,
      longestStreak,
      completionRate: Math.round(completionRate * 10000) / 10000,
      weeklyConsistency: Math.round(weeklyConsistency * 10000) / 10000,
      monthlyConsistency: Math.round(monthlyConsistency * 10000) / 10000,
      totalScheduled,
      totalCompleted,
      totalPartiallyCompleted,
      totalMissed,
      totalSkipped,
    };
  }

  private calculateWeeklyConsistency(
    completions: HabitCompletion[],
    config: HabitScheduleConfig,
    asOfDate: Date
  ): number {
    const habitStart = utcToZonedTime(config.startDate, this.schedulingEngine.getTimezone());
    const weeksDiff = Math.ceil(differenceInDays(asOfDate, habitStart) / 7);
    
    if (weeksDiff <= 0) return 0;

    const completionMap = new Map<string, HabitCompletion>();
    for (const c of completions) {
      completionMap.set(this.getDateKey(c.date), c);
    }

    let weeksWithCompletion = 0;
    let totalWeeks = 0;

    for (let i = 0; i < weeksDiff; i++) {
      const weekStart = addDays(habitStart, i * 7);
      const weekEnd = addDays(weekStart, 6);
      
      if (isBefore(weekStart, startOfDay(habitStart))) continue;
      if (isAfter(weekStart, asOfDate)) break;
      
      const dueInWeek = this.getDueDatesInRange(config, weekStart, weekEnd);
      if (dueInWeek.length === 0) continue;
      
      totalWeeks++;
      const hasCompletion = dueInWeek.some((due) =>
        completionMap.has(this.getDateKey(due)) && 
        (completionMap.get(this.getDateKey(due))?.state === 'COMPLETED' ||
         completionMap.get(this.getDateKey(due))?.state === 'PARTIALLY_COMPLETED')
      );
      
      if (hasCompletion) weeksWithCompletion++;
    }

    return totalWeeks > 0 ? weeksWithCompletion / totalWeeks : 0;
  }

  private calculateMonthlyConsistency(
    completions: HabitCompletion[],
    config: HabitScheduleConfig,
    asOfDate: Date
  ): number {
    const habitStart = utcToZonedTime(config.startDate, this.schedulingEngine.getTimezone());
    const monthsDiff = (asOfDate.getFullYear() - habitStart.getFullYear()) * 12 + (asOfDate.getMonth() - habitStart.getMonth());
    
    if (monthsDiff < 0) return 0;

    const completionMap = new Map<string, HabitCompletion>();
    for (const c of completions) {
      completionMap.set(this.getDateKey(c.date), c);
    }

    let monthsWithCompletion = 0;
    let totalMonths = 0;

    for (let i = 0; i <= monthsDiff; i++) {
      const monthStart = new Date(habitStart.getFullYear(), habitStart.getMonth() + i, 1);
      const monthEnd = new Date(habitStart.getFullYear(), habitStart.getMonth() + i + 1, 0);
      
      if (isBefore(monthStart, startOfDay(habitStart))) continue;
      if (isAfter(monthStart, asOfDate)) break;
      
      const dueInMonth = this.getDueDatesInRange(config, monthStart, monthEnd);
      if (dueInMonth.length === 0) continue;
      
      totalMonths++;
      const hasCompletion = dueInMonth.some((due) =>
        completionMap.has(this.getDateKey(due)) && 
        (completionMap.get(this.getDateKey(due))?.state === 'COMPLETED' ||
         completionMap.get(this.getDateKey(due))?.state === 'PARTIALLY_COMPLETED')
      );
      
      if (hasCompletion) monthsWithCompletion++;
    }

    return totalMonths > 0 ? monthsWithCompletion / totalMonths : 0;
  }

  calculateStreakFromDailyResults(dailyResults: DailyScheduleResult[]): StreakResult {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalScheduled = 0;
    let totalCompleted = 0;
    let totalPartiallyCompleted = 0;
    let totalMissed = 0;
    let totalSkipped = 0;

    for (const result of dailyResults) {
      if (!result.isScheduled) continue;

      totalScheduled++;

      if (result.completion) {
        switch (result.completion.state) {
          case 'COMPLETED':
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
            totalCompleted++;
            break;
          case 'PARTIALLY_COMPLETED':
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
            totalPartiallyCompleted++;
            break;
          case 'SKIPPED':
            totalSkipped++;
            tempStreak = 0;
            break;
          default:
            totalMissed++;
            tempStreak = 0;
        }
      } else {
        totalMissed++;
        tempStreak = 0;
      }
    }

    currentStreak = tempStreak;
    const completionRate = totalScheduled > 0 
      ? (totalCompleted + totalPartiallyCompleted * 0.5) / totalScheduled 
      : 0;

    return {
      currentStreak,
      longestStreak,
      completionRate: Math.round(completionRate * 10000) / 10000,
      weeklyConsistency: 0,
      monthlyConsistency: 0,
      totalScheduled,
      totalCompleted,
      totalPartiallyCompleted,
      totalMissed,
      totalSkipped,
    };
  }

  getStreakAtDate(
    completions: HabitCompletion[],
    config: HabitScheduleConfig,
    checkDate: Date
  ): { currentStreak: number; longestStreak: number } {
    const zonedCheckDate = utcToZonedTime(checkDate, this.schedulingEngine.getTimezone());
    const result = this.calculateStreak(completions, config, zonedCheckDate);
    return {
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
    };
  }

  getStreakHistory(
    completions: HabitCompletion[],
    config: HabitScheduleConfig,
    rangeStart: Date,
    rangeEnd: Date
  ): Array<{ date: Date; currentStreak: number; longestStreak: number }> {
    const history: Array<{ date: Date; currentStreak: number; longestStreak: number }> = [];
    const current = startOfDay(utcToZonedTime(rangeStart, this.schedulingEngine.getTimezone()));
    const end = endOfDay(utcToZonedTime(rangeEnd, this.schedulingEngine.getTimezone()));

    while (!isAfter(current, end)) {
      const streak = this.getStreakAtDate(completions, config, current);
      history.push({
        date: new Date(current),
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      });
      current.setDate(current.getDate() + 1);
    }

    return history;
  }

  private getDueDatesInRange(
    config: HabitScheduleConfig,
    start: Date,
    end: Date
  ): Date[] {
    const dates: Date[] = [];
    let current = this.schedulingEngine.getStartOfDay(start);
    const endDay = this.schedulingEngine.getEndOfDay(end);

    while (!isAfter(current, endDay)) {
      if (this.schedulingEngine.isHabitDueOnDate(config, current)) {
        dates.push(new Date(current));
      }
      current = this.schedulingEngine.addDays(current, 1);
    }

    return dates;
  }

  private getDateKey(date: Date): string {
    return formatInTimeZone(date, this.schedulingEngine.getTimezone(), 'yyyy-MM-dd');
  }

  private isBetterCompletion(a: HabitCompletion, b: HabitCompletion): boolean {
    const priority: Record<CompletionState, number> = {
      'COMPLETED': 4,
      'PARTIALLY_COMPLETED': 3,
      'SKIPPED': 2,
      'MISSED': 1,
      'SCHEDULED': 0,
      'NOT_SCHEDULED': -1,
    };
    return (priority[a.state] || 0) > (priority[b.state] || 0);
  }

  private emptyStreakResult(): StreakResult {
    return {
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      weeklyConsistency: 0,
      monthlyConsistency: 0,
      totalScheduled: 0,
      totalCompleted: 0,
      totalPartiallyCompleted: 0,
      totalMissed: 0,
      totalSkipped: 0,
    };
  }
}

export function createStreakEngine(timezone: string): HabitStreakEngine {
  return new HabitStreakEngine(timezone);
}