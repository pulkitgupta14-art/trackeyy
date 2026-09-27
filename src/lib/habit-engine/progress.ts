import { startOfDay, isSameDay, endOfDay } from 'date-fns';
// @ts-ignore
import { utcToZonedTime } from 'date-fns-tz';
import type {
  Habit,
  HabitCompletion,
  ProgressResult,
  HabitScheduleConfig,
  CompletionState,
} from './types';
import { HabitSchedulingEngine } from './scheduling';

export class HabitProgressEngine {
  private schedulingEngine: HabitSchedulingEngine;

  constructor(timezone: string = 'UTC') {
    this.schedulingEngine = new HabitSchedulingEngine(timezone);
  }

  setTimezone(timezone: string): void {
    this.schedulingEngine.setTimezone(timezone);
  }

  calculateProgress(
    habit: Habit,
    completion: HabitCompletion | null,
    date: Date = new Date()
  ): ProgressResult {
    const config = HabitSchedulingEngine.createConfigFromHabit(habit, this.schedulingEngine.getTimezone());
    const isScheduled = this.schedulingEngine.isHabitDueOnDate(config, date);

    if (!isScheduled) {
      return this.createNotScheduledResult(habit);
    }

    const target = habit.targetValue ?? this.getDefaultTarget(habit.type);
    const value = completion?.value ?? (completion ? 1 : 0);
    
    const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;
    const remaining = Math.max(target - value, 0);

    let state: CompletionState;
    let isComplete = false;

    if (!completion) {
      const now = utcToZonedTime(new Date(), this.schedulingEngine.getTimezone());
      const checkDate = utcToZonedTime(date, this.schedulingEngine.getTimezone());
      state = checkDate < startOfDay(now) ? 'MISSED' : 'SCHEDULED';
    } else {
      state = completion.state;
    }

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

  calculateDailyProgress(
    habit: Habit,
    completion: HabitCompletion | null
  ): ProgressResult {
    return this.calculateProgress(habit, completion, new Date());
  }

  calculateProgressForDate(
    habit: Habit,
    completions: Map<string, HabitCompletion>,
    date: Date
  ): ProgressResult {
    const key = this.getDateKey(date);
    const completion = completions.get(key) || null;
    return this.calculateProgress(habit, completion, date);
  }

  calculateRangeProgress(
    habit: Habit,
    completions: HabitCompletion[],
    rangeStart: Date,
    rangeEnd: Date
  ): {
    dailyProgress: Array<{ date: Date; progress: ProgressResult }>;
    summary: {
      totalScheduled: number;
      totalCompleted: number;
      totalPartiallyCompleted: number;
      totalMissed: number;
      totalSkipped: number;
      averagePercentage: number;
      totalValue: number;
      totalTarget: number;
    };
  } {
    const config = HabitSchedulingEngine.createConfigFromHabit(habit, this.schedulingEngine.getTimezone());
    const completionMap = new Map<string, HabitCompletion>();
    
    for (const c of completions) {
      const key = this.getDateKey(c.date);
      if (!completionMap.has(key) || this.isBetterCompletion(c, completionMap.get(key)!)) {
        completionMap.set(key, c);
      }
    }

    const dailyProgress: Array<{ date: Date; progress: ProgressResult }> = [];
    let totalScheduled = 0;
    let totalCompleted = 0;
    let totalPartiallyCompleted = 0;
    let totalMissed = 0;
    let totalSkipped = 0;
    let totalPercentage = 0;
    let totalValue = 0;
    let totalTarget = 0;
    let scheduledCount = 0;

    const current = startOfDay(utcToZonedTime(rangeStart, this.schedulingEngine.getTimezone()));
    const end = endOfDay(utcToZonedTime(rangeEnd, this.schedulingEngine.getTimezone()));

    while (!this.isAfter(current, end)) {
      const isScheduled = this.schedulingEngine.isHabitDueOnDate(config, current);
      
      if (isScheduled) {
        totalScheduled++;
        scheduledCount++;
        totalTarget += habit.targetValue ?? this.getDefaultTarget(habit.type);
        
        const key = this.getDateKey(current);
        const completion = completionMap.get(key) || null;
        const progress = this.calculateProgress(habit, completion, current);
        
        dailyProgress.push({ date: new Date(current), progress });
        
        totalValue += progress.value;
        totalPercentage += progress.percentage;

        if (completion) {
          switch (completion.state) {
            case 'COMPLETED':
              totalCompleted++;
              break;
            case 'PARTIALLY_COMPLETED':
              totalPartiallyCompleted++;
              break;
            case 'SKIPPED':
              totalSkipped++;
              break;
            case 'MISSED':
              totalMissed++;
              break;
          }
        } else {
          const now = utcToZonedTime(new Date(), this.schedulingEngine.getTimezone());
          if (current < startOfDay(now)) {
            totalMissed++;
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      dailyProgress,
      summary: {
        totalScheduled,
        totalCompleted,
        totalPartiallyCompleted,
        totalMissed,
        totalSkipped,
        averagePercentage: scheduledCount > 0 ? Math.round((totalPercentage / scheduledCount) * 100) / 100 : 0,
        totalValue,
        totalTarget,
      },
    };
  }

  getProjectedCompletion(
    habit: Habit,
    completions: HabitCompletion[],
    targetDate: Date
  ): {
    projectedValue: number;
    projectedPercentage: number;
    onTrack: boolean;
    requiredDailyRate: number;
  } {
    const config = HabitSchedulingEngine.createConfigFromHabit(habit, this.schedulingEngine.getTimezone());
    const target = habit.targetValue ?? this.getDefaultTarget(habit.type);
    
    if (target <= 0) {
      return {
        projectedValue: 0,
        projectedPercentage: 0,
        onTrack: false,
        requiredDailyRate: 0,
      };
    }

    const now = utcToZonedTime(new Date(), this.schedulingEngine.getTimezone());
    const zonedTarget = utcToZonedTime(targetDate, this.schedulingEngine.getTimezone());
    
    if (zonedTarget <= now) {
      const finalProgress = this.calculateRangeProgress(habit, completions, habit.startDate, zonedTarget);
      return {
        projectedValue: finalProgress.summary.totalValue,
        projectedPercentage: finalProgress.summary.averagePercentage,
        onTrack: finalProgress.summary.averagePercentage >= 100,
        requiredDailyRate: 0,
      };
    }

    const daysRemaining = Math.ceil((zonedTarget.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const scheduledRemaining = this.getScheduledDaysInRange(config, now, zonedTarget);
    
    if (scheduledRemaining === 0) {
      return {
        projectedValue: 0,
        projectedPercentage: 0,
        onTrack: false,
        requiredDailyRate: 0,
      };
    }

    const currentProgress = this.calculateRangeProgress(habit, completions, habit.startDate, now);
    const currentValue = currentProgress.summary.totalValue;
    const remainingTarget = target - currentValue;
    const requiredDailyRate = remainingTarget / scheduledRemaining;
    
    const projectedValue = currentValue + (requiredDailyRate * scheduledRemaining);
    const projectedPercentage = Math.min((projectedValue / target) * 100, 100);

    return {
      projectedValue: Math.round(projectedValue * 100) / 100,
      projectedPercentage: Math.round(projectedPercentage * 100) / 100,
      onTrack: projectedPercentage >= 100,
      requiredDailyRate: Math.round(requiredDailyRate * 100) / 100,
    };
  }

  private getDefaultTarget(type: Habit['type']): number {
    switch (type) {
      case 'BOOLEAN': return 1;
      case 'NUMBER': return 1;
      case 'DURATION': return 60;
      case 'DISTANCE': return 5;
      case 'QUANTITY': return 10;
      default: return 1;
    }
  }

  private getScheduledDaysInRange(config: HabitScheduleConfig, start: Date, end: Date): number {
    let count = 0;
    const current = startOfDay(start);
    const endDay = endOfDay(end);

    while (!this.isAfter(current, endDay)) {
      if (this.schedulingEngine.isHabitDueOnDate(config, current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  private getDateKey(date: Date): string {
    const zoned = utcToZonedTime(date, this.schedulingEngine.getTimezone());
    return `${zoned.getFullYear()}-${String(zoned.getMonth() + 1).padStart(2, '0')}-${String(zoned.getDate()).padStart(2, '0')}`;
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

  private createNotScheduledResult(habit: Habit): ProgressResult {
    return {
      value: 0,
      target: habit.targetValue ?? this.getDefaultTarget(habit.type),
      percentage: 0,
      state: 'NOT_SCHEDULED',
      isComplete: false,
      remaining: habit.targetValue ?? this.getDefaultTarget(habit.type),
    };
  }

  private isAfter(a: Date, b: Date): boolean {
    return a.getTime() > b.getTime();
  }
}

export function createProgressEngine(timezone: string): HabitProgressEngine {
  return new HabitProgressEngine(timezone);
}