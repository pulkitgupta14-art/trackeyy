import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HabitSchedulingEngine,
  HabitCompletionEngine,
  HabitStreakEngine,
  HabitProgressEngine,
  HabitEngineService,
  createHabitEngine,
} from '../index';
import type {
  Habit,
  HabitCompletion,
  HabitScheduleConfig,
  CompletionState,
  HabitType,
  HabitFrequency,
} from '../types';

// Helper to create UTC dates for consistent timezone handling in tests
function utc(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

function utcTime(dateStr: string, timeStr: string): Date {
  return new Date(dateStr + 'T' + timeStr + 'Z');
}

function createMockHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    userId: 'user-1',
    categoryId: 'cat-1',
    name: 'Test Habit',
    description: null,
    icon: null,
    color: '#6366f1',
    type: 'BOOLEAN',
    frequency: 'DAILY',
    customDays: [],
    intervalDays: null,
    timesPerDay: null,
    targetValue: null,
    unit: null,
    startDate: utc('2024-01-01'),
    endDate: null,
    reminderTime: null,
    reminderEnabled: false,
    status: 'ACTIVE',
    sortOrder: 0,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockCompletion(overrides: Partial<HabitCompletion> = {}): HabitCompletion {
  return {
    id: 'comp-1',
    habitId: 'habit-1',
    userId: 'user-1',
    date: new Date(),
    completedAt: new Date(),
    value: null,
    note: null,
    state: 'COMPLETED',
    scheduledValue: null,
    isManualOverride: false,
    ...overrides,
  };
}

describe('HabitSchedulingEngine', () => {
  let engine: HabitSchedulingEngine;

  beforeEach(() => {
    engine = new HabitSchedulingEngine('UTC');
  });

  describe('DAILY frequency', () => {
    it('should schedule habit every day', () => {
      const config = createDailyConfig();
      const dates = [
        utc('2024-01-01'),
        utc('2024-01-02'),
        utc('2024-01-03'),
        utc('2024-01-04'),
        utc('2024-01-05'),
        utc('2024-01-06'),
        utc('2024-01-07'),
      ];

      for (const date of dates) {
        expect(engine.isHabitDueOnDate(config, date)).toBe(true);
      }
    });

    it('should return scheduled count of 1 for daily habits', () => {
      const config = createDailyConfig();
      expect(engine.getScheduledCountForDate(config, utc('2024-01-01'))).toBe(1);
    });
  });

  describe('WEEKDAYS frequency', () => {
    it('should schedule habit Monday through Friday', () => {
      const config = createWeekdaysConfig();
      
      expect(engine.isHabitDueOnDate(config, utc('2024-01-01'))).toBe(true); // Monday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-02'))).toBe(true); // Tuesday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-03'))).toBe(true); // Wednesday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-04'))).toBe(true); // Thursday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-05'))).toBe(true); // Friday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-06'))).toBe(false); // Saturday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-07'))).toBe(false); // Sunday
    });
  });

  describe('WEEKENDS frequency', () => {
    it('should schedule habit Saturday and Sunday only', () => {
      const config = createWeekendsConfig();
      
      expect(engine.isHabitDueOnDate(config, utc('2024-01-01'))).toBe(false); // Monday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-06'))).toBe(true);  // Saturday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-07'))).toBe(true);  // Sunday
    });
  });

  describe('WEEKLY frequency', () => {
    it('should schedule habit on same weekday as start date', () => {
      const config = createWeeklyConfig(utc('2024-01-03')); // Wednesday
      
      expect(engine.isHabitDueOnDate(config, utc('2024-01-03'))).toBe(true);  // Wednesday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-10'))).toBe(true);  // Wednesday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-04'))).toBe(false); // Thursday
    });
  });

  describe('CUSTOM_DAYS frequency', () => {
    it('should schedule habit on specified custom days', () => {
      const config = createCustomDaysConfig([1, 3, 5]); // Mon, Wed, Fri
      
      expect(engine.isHabitDueOnDate(config, utc('2024-01-01'))).toBe(true);  // Monday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-02'))).toBe(false); // Tuesday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-03'))).toBe(true);  // Wednesday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-04'))).toBe(false); // Thursday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-05'))).toBe(true);  // Friday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-06'))).toBe(false); // Saturday
      expect(engine.isHabitDueOnDate(config, utc('2024-01-07'))).toBe(false); // Sunday
    });
  });

  describe('INTERVAL frequency', () => {
    it('should schedule habit every N days', () => {
      const config = createIntervalConfig(3); // Every 3 days
      const start = utc('2024-01-01');
      
      expect(engine.isHabitDueOnDate(config, utc('2024-01-01'))).toBe(true);  // Day 0
      expect(engine.isHabitDueOnDate(config, utc('2024-01-02'))).toBe(false); // Day 1
      expect(engine.isHabitDueOnDate(config, utc('2024-01-03'))).toBe(false); // Day 2
      expect(engine.isHabitDueOnDate(config, utc('2024-01-04'))).toBe(true);  // Day 3
      expect(engine.isHabitDueOnDate(config, utc('2024-01-05'))).toBe(false); // Day 4
      expect(engine.isHabitDueOnDate(config, utc('2024-01-06'))).toBe(false); // Day 5
      expect(engine.isHabitDueOnDate(config, utc('2024-01-07'))).toBe(true);  // Day 6
    });
  });

  describe('MONTHLY frequency', () => {
    it('should schedule habit on same date each month', () => {
      const config = createMonthlyConfig(15); // 15th of each month
      
      expect(engine.isHabitDueOnDate(config, utc('2024-01-15'))).toBe(true);
      expect(engine.isHabitDueOnDate(config, utc('2024-02-15'))).toBe(true);
      expect(engine.isHabitDueOnDate(config, utc('2024-01-14'))).toBe(false);
      expect(engine.isHabitDueOnDate(config, utc('2024-01-16'))).toBe(false);
    });
  });

  describe('MULTI_DAILY frequency', () => {
    it('should schedule habit multiple times per day', () => {
      const config = createMultiDailyConfig(3);
      
      expect(engine.isHabitDueOnDate(config, utc('2024-01-01'))).toBe(true);
      expect(engine.getScheduledCountForDate(config, utc('2024-01-01'))).toBe(3);
    });
  });

  describe('Date boundaries', () => {
    it('should not schedule before start date', () => {
      const config = createDailyConfig(utc('2024-01-10'));
      
      expect(engine.isHabitDueOnDate(config, utc('2024-01-09'))).toBe(false);
      expect(engine.isHabitDueOnDate(config, utc('2024-01-10'))).toBe(true);
    });

    it('should not schedule after end date', () => {
      const config = createDailyConfig(utc('2024-01-01'), utc('2024-01-10'));
      
      expect(engine.isHabitDueOnDate(config, utc('2024-01-10'))).toBe(true);
      expect(engine.isHabitDueOnDate(config, utc('2024-01-11'))).toBe(false);
    });
  });

  describe('Timezone handling', () => {
    it('should respect timezone for date boundaries', () => {
      const utcEngine = new HabitSchedulingEngine('UTC');
      const tokyoEngine = new HabitSchedulingEngine('Asia/Tokyo');
      
      const config = createDailyConfig(utcTime('2024-01-01', '00:00:00'));
      
      const utcDate = utcTime('2024-01-01', '12:00:00');
      const tokyoDate = utcTime('2024-01-01', '12:00:00');
      
      expect(utcEngine.isHabitDueOnDate(config, utcDate)).toBe(true);
      expect(tokyoEngine.isHabitDueOnDate(config, tokyoDate)).toBe(true);
    });
  });

  describe('getScheduleRange', () => {
    it('should return correct schedule summary for a range', () => {
      const config = createWeekdaysConfig();
      const completions = new Map();
      
      // Add completions for Mon, Tue, Wed
      completions.set('2024-01-01', createMockCompletion({ state: 'COMPLETED', date: utc('2024-01-01') }));
      completions.set('2024-01-02', createMockCompletion({ state: 'COMPLETED', date: utc('2024-01-02') }));
      completions.set('2024-01-03', createMockCompletion({ state: 'PARTIALLY_COMPLETED', date: utc('2024-01-03') }));
      completions.set('2024-01-04', createMockCompletion({ state: 'SKIPPED', date: utc('2024-01-04') }));
      completions.set('2024-01-05', createMockCompletion({ state: 'MISSED', date: utc('2024-01-05') }));

      const result = engine.getScheduleRange(config, utc('2024-01-01'), utc('2024-01-07'), completions);
      
      expect(result.summary.totalScheduled).toBe(5); // Mon-Fri
      expect(result.summary.totalCompleted).toBe(2);
      expect(result.summary.totalPartiallyCompleted).toBe(1);
      expect(result.summary.totalSkipped).toBe(1);
      expect(result.summary.totalMissed).toBe(1);
    });
  });
});

describe('HabitCompletionEngine', () => {
  let engine: HabitCompletionEngine;

  beforeEach(() => {
    engine = new HabitCompletionEngine('UTC');
  });

  describe('Completion states', () => {
    it('should return COMPLETED for boolean habit with value 1', () => {
      const habit = createMockHabit({ type: 'BOOLEAN' });
      const result = engine.createCompletion({ habitId: '1', userId: '1', date: new Date(), value: 1 }, habit);
      
      expect(result.valid).toBe(true);
      expect(result.completion?.state).toBe('COMPLETED');
    });

    it('should return PARTIALLY_COMPLETED for quantitative habit below target', () => {
      const habit = createMockHabit({ type: 'DURATION', targetValue: 120 });
      const result = engine.createCompletion({ habitId: '1', userId: '1', date: new Date(), value: 75 }, habit);
      
      expect(result.valid).toBe(true);
      expect(result.completion?.state).toBe('PARTIALLY_COMPLETED');
    });

    it('should return COMPLETED for quantitative habit at target', () => {
      const habit = createMockHabit({ type: 'NUMBER', targetValue: 10 });
      const result = engine.createCompletion({ habitId: '1', userId: '1', date: new Date(), value: 10 }, habit);
      
      expect(result.valid).toBe(true);
      expect(result.completion?.state).toBe('COMPLETED');
    });

    it('should return COMPLETED for quantitative habit above target', () => {
      const habit = createMockHabit({ type: 'DISTANCE', targetValue: 5 });
      const result = engine.createCompletion({ habitId: '1', userId: '1', date: new Date(), value: 7 }, habit);
      
      expect(result.valid).toBe(true);
      expect(result.completion?.state).toBe('COMPLETED');
    });
  });

  describe('Validation', () => {
    it('should reject completion for inactive habit', () => {
      const habit = createMockHabit({ status: 'INACTIVE' });
      const result = engine.createCompletion({ habitId: '1', userId: '1', date: new Date() }, habit);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot complete inactive or archived habit');
    });

    it('should reject completion for archived habit', () => {
      const habit = createMockHabit({ status: 'ARCHIVED' });
      const result = engine.createCompletion({ habitId: '1', userId: '1', date: new Date() }, habit);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot complete inactive or archived habit');
    });

    it('should reject completion for unscheduled date', () => {
      const habit = createMockHabit({ frequency: 'WEEKDAYS' });
      const saturday = utc('2024-01-06'); // Saturday
      const result = engine.createCompletion({ habitId: '1', userId: '1', date: saturday }, habit);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Habit is not scheduled for this date');
    });

    it('should reject negative values', () => {
      const habit = createMockHabit({ type: 'NUMBER', targetValue: 10 });
      const result = engine.createCompletion({ habitId: '1', userId: '1', date: new Date(), value: -5 }, habit);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Completion value cannot be negative');
    });

    it('should accept positive boolean values', () => {
      const habit = createMockHabit({ type: 'BOOLEAN' });
      const result = engine.createCompletion({ habitId: '1', userId: '1', date: new Date(), value: 2 }, habit);
      
      expect(result.valid).toBe(true);
      expect(result.completion?.state).toBe('COMPLETED');
    });
  });

  describe('Skip and Miss', () => {
    it('should create SKIPPED completion', () => {
      const habit = createMockHabit({ frequency: 'DAILY' });
      const completion = engine.markAsSkipped(habit, utc('2024-01-01'), 'user-1', 'Busy day');
      
      expect(completion.state).toBe('SKIPPED');
      expect(completion.value).toBe(0);
      expect(completion.note).toBe('Busy day');
      expect(completion.isManualOverride).toBe(true);
    });

    it('should create MISSED completion', () => {
      const habit = createMockHabit({ frequency: 'DAILY' });
      const completion = engine.markAsMissed(habit, utc('2024-01-01'), 'user-1');
      
      expect(completion.state).toBe('MISSED');
      expect(completion.value).toBe(0);
      expect(completion.isManualOverride).toBe(true);
    });

    it('should throw when skipping unscheduled habit', () => {
      const habit = createMockHabit({ frequency: 'WEEKDAYS' });
      const saturday = utc('2024-01-06');
      
      expect(() => engine.markAsSkipped(habit, saturday, 'user-1')).toThrow();
    });
  });

  describe('State determination', () => {
    it('should return NOT_SCHEDULED for unscheduled dates', () => {
      const habit = createMockHabit({ frequency: 'WEEKDAYS' });
      const saturday = utc('2024-01-06');
      
      const state = engine.getStateForDate(habit, saturday, null);
      expect(state).toBe('NOT_SCHEDULED');
    });

    it('should return SCHEDULED for future scheduled dates', () => {
      const habit = createMockHabit({ frequency: 'DAILY' });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const state = engine.getStateForDate(habit, tomorrow, null);
      expect(state).toBe('SCHEDULED');
    });

    it('should return MISSED for past unscheduled dates', () => {
      const habit = createMockHabit({ frequency: 'DAILY' });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const state = engine.getStateForDate(habit, yesterday, null);
      expect(state).toBe('MISSED');
    });

    it('should return completion state when completion exists', () => {
      const habit = createMockHabit({ frequency: 'DAILY' });
      const completion = createMockCompletion({ state: 'PARTIALLY_COMPLETED' });
      
      const state = engine.getStateForDate(habit, new Date(), completion);
      expect(state).toBe('PARTIALLY_COMPLETED');
    });
  });
});

describe('HabitStreakEngine', () => {
  let engine: HabitStreakEngine;

  beforeEach(() => {
    engine = new HabitStreakEngine('UTC');
  });

  describe('Daily habit streak', () => {
    it('should calculate correct streak for consecutive daily completions', () => {
      const habit = createMockHabit({ frequency: 'DAILY' });
      const config = createDailyConfig();
      
      const completions = [
        createMockCompletion({ date: utc('2024-01-01'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-02'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-03'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-04'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-05'), state: 'COMPLETED' }),
      ];

      const result = engine.calculateStreak(completions, config, utc('2024-01-05'));
      
      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(5);
      expect(result.completionRate).toBe(1);
    });

    it('should reset streak on missed day', () => {
      const config = createDailyConfig();
      
      const completions = [
        createMockCompletion({ date: utc('2024-01-01'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-02'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-04'), state: 'COMPLETED' }), // Missed 01-03
        createMockCompletion({ date: utc('2024-01-05'), state: 'COMPLETED' }),
      ];

      const result = engine.calculateStreak(completions, config, utc('2024-01-05'));
      
      expect(result.currentStreak).toBe(2); // Only 01-04, 01-05
      expect(result.longestStreak).toBe(2);
      expect(result.totalMissed).toBe(1);
    });

    it('should not count partial completions as breaking streak', () => {
      const config = createDailyConfig();
      
      const completions = [
        createMockCompletion({ date: utc('2024-01-01'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-02'), state: 'PARTIALLY_COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-03'), state: 'COMPLETED' }),
      ];

      const result = engine.calculateStreak(completions, config, utc('2024-01-03'));
      
      expect(result.currentStreak).toBe(3);
      expect(result.totalCompleted).toBe(2);
      expect(result.totalPartiallyCompleted).toBe(1);
    });
  });

  describe('Weekly habit streak (Mon/Wed/Fri)', () => {
    it('should not break streak on unscheduled days', () => {
      const habit = createMockHabit({ frequency: 'CUSTOM_DAYS', customDays: [1, 3, 5] }); // Mon, Wed, Fri
      const config = createCustomDaysConfig([1, 3, 5]);
      
      const completions = [
        createMockCompletion({ date: utc('2024-01-01'), state: 'COMPLETED' }), // Mon
        createMockCompletion({ date: utc('2024-01-03'), state: 'COMPLETED' }), // Wed
        createMockCompletion({ date: utc('2024-01-05'), state: 'COMPLETED' }), // Fri
        createMockCompletion({ date: utc('2024-01-08'), state: 'COMPLETED' }), // Mon
        createMockCompletion({ date: utc('2024-01-10'), state: 'COMPLETED' }), // Wed
      ];

      const result = engine.calculateStreak(completions, config, utc('2024-01-10'));
      
      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(5);
    });

    it('should reset streak when missing a scheduled day', () => {
      const config = createCustomDaysConfig([1, 3, 5]);
      
      const completions = [
        createMockCompletion({ date: utc('2024-01-01'), state: 'COMPLETED' }), // Mon
        createMockCompletion({ date: utc('2024-01-03'), state: 'COMPLETED' }), // Wed
        // Missed Friday 01-05
        createMockCompletion({ date: utc('2024-01-08'), state: 'COMPLETED' }), // Mon
      ];

      const result = engine.calculateStreak(completions, config, utc('2024-01-08'));
      
      expect(result.currentStreak).toBe(1); // Only the last Monday
      expect(result.longestStreak).toBe(2); // Mon-Wed was 2
      expect(result.totalMissed).toBe(1);
    });
  });

  describe('Weekday-specific habit (Mon-Fri)', () => {
    it('should only count weekdays in streak', () => {
      const config = createWeekdaysConfig();
      
      const completions = [
        createMockCompletion({ date: utc('2024-01-01'), state: 'COMPLETED' }), // Mon
        createMockCompletion({ date: utc('2024-01-02'), state: 'COMPLETED' }), // Tue
        createMockCompletion({ date: utc('2024-01-03'), state: 'COMPLETED' }), // Wed
        createMockCompletion({ date: utc('2024-01-04'), state: 'COMPLETED' }), // Thu
        createMockCompletion({ date: utc('2024-01-05'), state: 'COMPLETED' }), // Fri
        // Weekend not scheduled
        createMockCompletion({ date: utc('2024-01-08'), state: 'COMPLETED' }), // Mon
      ];

      const result = engine.calculateStreak(completions, config, utc('2024-01-08'));
      
      expect(result.currentStreak).toBe(6);
      expect(result.totalScheduled).toBe(6); // 5 weekdays + 1 Monday
    });
  });

  describe('INTERVAL frequency streak', () => {
    it('should calculate streak for every 2 days', () => {
      const config = createIntervalConfig(2);
      
      const completions = [
        createMockCompletion({ date: utc('2024-01-01'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-03'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-05'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-07'), state: 'COMPLETED' }),
      ];

      const result = engine.calculateStreak(completions, config, utc('2024-01-07'));
      
      expect(result.currentStreak).toBe(4);
      expect(result.totalScheduled).toBe(4);
    });
  });

  describe('MONTHLY frequency streak', () => {
    it('should calculate monthly streak correctly', () => {
      const config = createMonthlyConfig(15, utc('2023-11-15'));
      
      const completions = [
        createMockCompletion({ date: utc('2023-11-15'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2023-12-15'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-15'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-02-15'), state: 'COMPLETED' }),
      ];

      const result = engine.calculateStreak(completions, config, utc('2024-02-15'));
      
      expect(result.currentStreak).toBe(4);
      expect(result.totalScheduled).toBe(4);
    });
  });

  describe('Skipped habits', () => {
    it('should reset streak when skipped but not count as missed', () => {
      const config = createDailyConfig();
      
      const completions = [
        createMockCompletion({ date: utc('2024-01-01'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-02'), state: 'COMPLETED' }),
        createMockCompletion({ date: utc('2024-01-03'), state: 'SKIPPED' }),
        createMockCompletion({ date: utc('2024-01-04'), state: 'COMPLETED' }),
      ];

      const result = engine.calculateStreak(completions, config, utc('2024-01-04'));
      
      expect(result.currentStreak).toBe(1); // Reset by skip
      expect(result.totalSkipped).toBe(1);
      expect(result.totalMissed).toBe(0);
    });
  });
});

describe('HabitProgressEngine', () => {
  let engine: HabitProgressEngine;

  beforeEach(() => {
    engine = new HabitProgressEngine('UTC');
  });

  describe('Boolean habit progress', () => {
    it('should show 100% when completed', () => {
      const habit = createMockHabit({ type: 'BOOLEAN' });
      const completion = createMockCompletion({ state: 'COMPLETED' });
      
      const result = engine.calculateProgress(habit, completion, new Date());
      
      expect(result.percentage).toBe(100);
      expect(result.isComplete).toBe(true);
      expect(result.value).toBe(1);
    });

    it('should show 0% when not completed', () => {
      const habit = createMockHabit({ type: 'BOOLEAN' });
      
      const result = engine.calculateProgress(habit, null, new Date());
      
      expect(result.percentage).toBe(0);
      expect(result.isComplete).toBe(false);
    });
  });

  describe('Numeric habit progress', () => {
    it('should calculate percentage correctly', () => {
      const habit = createMockHabit({ type: 'NUMBER', targetValue: 100 });
      const completion = createMockCompletion({ value: 75, state: 'PARTIALLY_COMPLETED' });
      
      const result = engine.calculateProgress(habit, completion, new Date());
      
      expect(result.value).toBe(75);
      expect(result.target).toBe(100);
      expect(result.percentage).toBe(75);
      expect(result.isComplete).toBe(false);
      expect(result.remaining).toBe(25);
    });

    it('should show 100% when target reached', () => {
      const habit = createMockHabit({ type: 'NUMBER', targetValue: 50 });
      const completion = createMockCompletion({ value: 50, state: 'COMPLETED' });
      
      const result = engine.calculateProgress(habit, completion, new Date());
      
      expect(result.percentage).toBe(100);
      expect(result.isComplete).toBe(true);
    });

    it('should cap percentage at 100%', () => {
      const habit = createMockHabit({ type: 'NUMBER', targetValue: 10 });
      const completion = createMockCompletion({ value: 15, state: 'COMPLETED' });
      
      const result = engine.calculateProgress(habit, completion, new Date());
      
      expect(result.percentage).toBe(100);
      expect(result.isComplete).toBe(true);
    });
  });

  describe('Duration habit progress', () => {
    it('should calculate duration progress in minutes', () => {
      const habit = createMockHabit({ type: 'DURATION', targetValue: 120, unit: 'minutes' });
      const completion = createMockCompletion({ value: 75, state: 'PARTIALLY_COMPLETED' });
      
      const result = engine.calculateProgress(habit, completion, new Date());
      
      expect(result.value).toBe(75);
      expect(result.target).toBe(120);
      expect(result.percentage).toBe(62.5);
    });
  });

  describe('Distance habit progress', () => {
    it('should calculate distance progress', () => {
      const habit = createMockHabit({ type: 'DISTANCE', targetValue: 10, unit: 'km' });
      const completion = createMockCompletion({ value: 5, state: 'PARTIALLY_COMPLETED' });
      
      const result = engine.calculateProgress(habit, completion, new Date());
      
      expect(result.value).toBe(5);
      expect(result.target).toBe(10);
      expect(result.percentage).toBe(50);
    });
  });

  describe('Quantity habit progress', () => {
    it('should calculate quantity progress', () => {
      const habit = createMockHabit({ type: 'QUANTITY', targetValue: 20, unit: 'pages' });
      const completion = createMockCompletion({ value: 10, state: 'PARTIALLY_COMPLETED' });
      
      const result = engine.calculateProgress(habit, completion, new Date());
      
      expect(result.value).toBe(10);
      expect(result.target).toBe(20);
      expect(result.percentage).toBe(50);
    });
  });

  describe('Unscheduled dates', () => {
    it('should return NOT_SCHEDULED for unscheduled dates', () => {
      const habit = createMockHabit({ frequency: 'WEEKDAYS' });
      const saturday = utc('2024-01-06');
      
      const result = engine.calculateProgress(habit, null, saturday);
      
      expect(result.state).toBe('NOT_SCHEDULED');
      expect(result.percentage).toBe(0);
    });
  });
});

describe('HabitEngineService (Integration)', () => {
  let service: HabitEngineService;

  beforeEach(() => {
    service = createHabitEngine('UTC');
  });

  describe('Daily habit complete workflow', () => {
    it('should handle complete daily habit workflow', () => {
      const habit = createMockHabit({ 
        frequency: 'DAILY', 
        type: 'BOOLEAN',
        startDate: utc('2024-01-01'),
      });

      const today = utc('2024-01-05');
      
      // Check if due
      expect(service.isHabitDueOnDate(habit, today)).toBe(true);
      
      // Get daily schedule
      const schedule = service.getDailySchedule(habit, today, null, today);
      expect(schedule.isScheduled).toBe(true);
      expect(schedule.state).toBe('SCHEDULED');
      
      // Create completion
      const validation = service.validateCompletion({ habitId: habit.id, userId: 'user-1', date: today }, habit);
      expect(validation.valid).toBe(true);
      
      // Calculate progress
      const progress = service.calculateProgress(habit, validation.completion!, today);
      expect(progress.isComplete).toBe(true);
      expect(progress.percentage).toBe(100);
      
      // Calculate streak
      const streak = service.calculateStreak([validation.completion!], habit, today);
      expect(streak.currentStreak).toBe(1);
    });
  });

  describe('Weekday habit (Mon/Wed/Fri) workflow', () => {
    it('should not break streak on Tue/Thu', () => {
      const habit = createMockHabit({ 
        frequency: 'CUSTOM_DAYS', 
        customDays: [1, 3, 5], // Mon, Wed, Fri
        startDate: utc('2024-01-01'), // Monday
      });

      const completions = [
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-01'), value: 1 }, habit).completion!,
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-03'), value: 1 }, habit).completion!,
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-05'), value: 1 }, habit).completion!,
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-08'), value: 1 }, habit).completion!,
      ];

      const streak = service.calculateStreak(completions, habit, utc('2024-01-08'));
      
      expect(streak.currentStreak).toBe(4);
      expect(streak.totalScheduled).toBe(4);
    });
  });

  describe('Quantitative habit (120 min study)', () => {
    it('should calculate 62.5% for 75/120 minutes', () => {
      const habit = createMockHabit({ 
        type: 'DURATION', 
        targetValue: 120, 
        unit: 'minutes',
        frequency: 'DAILY',
      });

      const completion = service.createCompletion({ 
        habitId: habit.id, 
        userId: 'user-1', 
        date: new Date(), 
        value: 75 
      }, habit).completion!;
      
      const progress = service.calculateProgress(habit, completion, new Date());
      
      expect(progress.value).toBe(75);
      expect(progress.target).toBe(120);
      expect(progress.percentage).toBe(62.5);
      expect(progress.state).toBe('PARTIALLY_COMPLETED');
      expect(progress.isComplete).toBe(false);
    });
  });

  describe('Partial completion workflow', () => {
    it('should track partial progress correctly', () => {
      const habit = createMockHabit({ 
        type: 'QUANTITY', 
        targetValue: 20, 
        unit: 'pages',
        frequency: 'DAILY',
      });

      const completion = service.createCompletion({ 
        habitId: habit.id, 
        userId: 'user-1', 
        date: new Date(), 
        value: 10 
      }, habit).completion!;
      
      expect(completion.state).toBe('PARTIALLY_COMPLETED');
      
      const progress = service.calculateProgress(habit, completion, new Date());
      expect(progress.percentage).toBe(50);
    });
  });

  describe('Missed habit', () => {
    it('should mark habit as missed for past dates', () => {
      const habit = createMockHabit({ frequency: 'DAILY' });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const state = service.getStateForDate(habit, yesterday, null);
      expect(state).toBe('MISSED');
      
      const missedCompletion = service.markAsMissed(habit, yesterday, 'user-1');
      expect(missedCompletion.state).toBe('MISSED');
    });
  });

  describe('Skipped habit', () => {
    it('should mark habit as skipped', () => {
      const habit = createMockHabit({ frequency: 'DAILY' });
      
      const skippedCompletion = service.markAsSkipped(habit, new Date(), 'user-1', 'Not feeling well');
      expect(skippedCompletion.state).toBe('SKIPPED');
      expect(skippedCompletion.note).toBe('Not feeling well');
    });

    it('should reset streak when skipped', () => {
      const habit = createMockHabit({ frequency: 'DAILY', startDate: utc('2024-01-01') });
      
      const completions = [
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-01'), value: 1 }, habit).completion!,
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-02'), value: 1 }, habit).completion!,
        service.markAsSkipped(habit, utc('2024-01-03'), 'user-1'),
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-04'), value: 1 }, habit).completion!,
      ];

      const streak = service.calculateStreak(completions, habit, utc('2024-01-04'));
      
      expect(streak.currentStreak).toBe(1);
      expect(streak.totalSkipped).toBe(1);
      expect(streak.totalMissed).toBe(0);
    });
  });

  describe('Habit schedule change', () => {
    it('should handle frequency change correctly', () => {
      const habit = createMockHabit({ frequency: 'DAILY', startDate: utc('2024-01-01') });
      
      // Complete for a week
      const completions: HabitCompletion[] = [];
      for (let i = 0; i < 7; i++) {
        const date = utc('2024-01-01');
        date.setDate(date.getDate() + i);
        completions.push(
          service.createCompletion({ habitId: habit.id, userId: 'user-1', date, value: 1 }, habit).completion!
        );
      }
      
      // Change to weekdays only
      const newHabit = { ...habit, frequency: 'WEEKDAYS' as const, customDays: [] };
      
      const streak = service.calculateStreak(completions, newHabit, utc('2024-01-07'));
      
      // Should only count weekdays (5 days)
      expect(streak.totalScheduled).toBe(5);
      expect(streak.currentStreak).toBe(5);
    });
  });

  describe('Duplicate completion handling', () => {
    it('should replace existing completion by default', () => {
      const habit = createMockHabit({ frequency: 'DAILY' });
      const date = utc('2024-01-01');
      
      const first = service.createCompletion({ habitId: habit.id, userId: 'user-1', date, value: 50 }, habit);
      expect(first.valid).toBe(true);
      
      const second = service.createCompletion({ habitId: habit.id, userId: 'user-1', date, value: 75 }, habit);
      expect(second.valid).toBe(true);
      
      const applied = service.applyDuplicatePolicy(first.completion!, second.completion!, habit);
      expect(applied.value).toBe(75);
    });

    it('should add values when replace is false', () => {
      const serviceNoReplace = createHabitEngine('UTC', { allow: true, replace: false });
      const habit = createMockHabit({ frequency: 'DAILY', type: 'NUMBER', targetValue: 100 });
      const date = utc('2024-01-01');
      
      const first = serviceNoReplace.createCompletion({ habitId: habit.id, userId: 'user-1', date, value: 30 }, habit);
      const second = serviceNoReplace.createCompletion({ habitId: habit.id, userId: 'user-1', date, value: 40 }, habit);
      
      const applied = serviceNoReplace.applyDuplicatePolicy(first.completion!, second.completion!, habit);
      expect(applied.value).toBe(70);
    });
  });

  describe('Timezone boundary', () => {
    it('should handle different timezones correctly', () => {
      const utcService = createHabitEngine('UTC');
      const tokyoService = createHabitEngine('Asia/Tokyo');
      
      const habit = createMockHabit({ frequency: 'DAILY', startDate: utcTime('2024-01-01', '00:00:00') });
      
      const utcDate = utcTime('2024-01-01', '12:00:00');
      const tokyoDate = utcTime('2024-01-01', '12:00:00');
      
      expect(utcService.isHabitDueOnDate(habit, utcDate)).toBe(true);
      expect(tokyoService.isHabitDueOnDate(habit, tokyoDate)).toBe(true);
    });

    it('should calculate streak correctly across timezone boundaries', () => {
      const tokyoService = createHabitEngine('Asia/Tokyo');
      const habit = createMockHabit({ 
        frequency: 'DAILY', 
        startDate: utcTime('2024-01-01', '00:00:00') 
      });
      
      const completions = [
        tokyoService.createCompletion({ habitId: habit.id, userId: 'user-1', date: utcTime('2024-01-01', '00:00:00'), value: 1 }, habit).completion!,
        tokyoService.createCompletion({ habitId: habit.id, userId: 'user-1', date: utcTime('2024-01-02', '00:00:00'), value: 1 }, habit).completion!,
      ];
      
      const streak = tokyoService.calculateStreak(completions, habit, utcTime('2024-01-02', '12:00:00'));
      expect(streak.currentStreak).toBe(2);
    });
  });

  describe('Historical completion records', () => {
    it('should preserve historical completions when habit is edited', () => {
      const habit = createMockHabit({ frequency: 'DAILY', startDate: utc('2024-01-01') });
      const date = utc('2024-01-15');
      
      const completion = service.createCompletion({ habitId: habit.id, userId: 'user-1', date, value: 1 }, habit).completion!;
      expect(completion.date.getTime()).toBe(date.getTime());
      
      // Edit habit (e.g., change target)
      const editedHabit = { ...habit, targetValue: 200 };
      
      // Historical completion should still be valid
      const progress = service.calculateProgress(editedHabit, completion, date);
      expect(progress.value).toBe(1); // Boolean completion
    });

    it('should maintain streak across schedule changes', () => {
      const habit = createMockHabit({ 
        frequency: 'DAILY', 
        startDate: utc('2024-01-01') 
      });
      
      const completions = [
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-01'), value: 1 }, habit).completion!,
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-02'), value: 1 }, habit).completion!,
      ];
      
      // Change to weekdays
      const newHabit = { ...habit, frequency: 'WEEKDAYS' as const };
      
      const streak = service.calculateStreak(completions, newHabit, utc('2024-01-02'));
      expect(streak.currentStreak).toBe(2); // Both were weekdays
    });
  });

  describe('Validation', () => {
    it('should validate habit correctly', () => {
      const validHabit = createMockHabit();
      const result = service.validateHabit(validHabit);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject habit without name', () => {
      const habit = createMockHabit({ name: '' });
      const result = service.validateHabit(habit);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Habit name is required');
    });

    it('should reject custom days without days specified', () => {
      const habit = createMockHabit({ frequency: 'CUSTOM_DAYS', customDays: [] });
      const result = service.validateHabit(habit);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Custom days must be specified for CUSTOM_DAYS frequency');
    });

    it('should warn for quantitative habit without target', () => {
      const habit = createMockHabit({ type: 'NUMBER', targetValue: null });
      const result = service.validateHabit(habit);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Quantitative habits should have a positive target value');
    });
  });

  describe('Projected completion', () => {
    it('should project completion based on current rate', () => {
      const habit = createMockHabit({ 
        type: 'DURATION', 
        targetValue: 1000, 
        unit: 'minutes',
        frequency: 'DAILY',
        startDate: utc('2024-01-01'),
      });

      const completions = [
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-01'), value: 50 }, habit).completion!,
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-02'), value: 50 }, habit).completion!,
      ];

      const projection = service.getProjectedCompletion(habit, completions, utc('2024-01-31'));
      
      expect(projection.projectedValue).toBeGreaterThan(0);
      expect(projection.requiredDailyRate).toBeGreaterThan(0);
    });
  });

  describe('Range progress', () => {
    it('should calculate progress for a date range', () => {
      const habit = createMockHabit({ 
        type: 'NUMBER', 
        targetValue: 10, 
        frequency: 'DAILY',
        startDate: utc('2024-01-01'),
      });

      const completions = [
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-01'), value: 8 }, habit).completion!,
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-02'), value: 10 }, habit).completion!,
        service.createCompletion({ habitId: habit.id, userId: 'user-1', date: utc('2024-01-03'), value: 5 }, habit).completion!,
      ];

      const result = service.calculateRangeProgress(habit, completions, utc('2024-01-01'), utc('2024-01-03'));
      
      expect(result.summary.totalScheduled).toBe(3);
      expect(result.summary.totalCompleted).toBe(1);
      expect(result.summary.totalPartiallyCompleted).toBe(2);
      expect(result.summary.averagePercentage).toBe(76.67);
    });
  });
});

// Helper functions for test configurations
function createDailyConfig(startDate = utc('2024-01-01'), endDate: Date | null = null): HabitScheduleConfig {
  return {
    frequency: 'DAILY',
    customDays: [],
    intervalDays: null,
    timesPerDay: null,
    targetValue: null,
    startDate,
    endDate,
    reminderTime: null,
    reminderEnabled: false,
    timezone: 'UTC',
  };
}

function createWeekdaysConfig(startDate = utc('2024-01-01'), endDate: Date | null = null): HabitScheduleConfig {
  return {
    frequency: 'WEEKDAYS',
    customDays: [],
    intervalDays: null,
    timesPerDay: null,
    targetValue: null,
    startDate,
    endDate,
    reminderTime: null,
    reminderEnabled: false,
    timezone: 'UTC',
  };
}

function createWeekendsConfig(startDate = utc('2024-01-01'), endDate: Date | null = null): HabitScheduleConfig {
  return {
    frequency: 'WEEKENDS',
    customDays: [],
    intervalDays: null,
    timesPerDay: null,
    targetValue: null,
    startDate,
    endDate,
    reminderTime: null,
    reminderEnabled: false,
    timezone: 'UTC',
  };
}

function createWeeklyConfig(startDate = utc('2024-01-01'), endDate: Date | null = null): HabitScheduleConfig {
  return {
    frequency: 'WEEKLY',
    customDays: [],
    intervalDays: null,
    timesPerDay: null,
    targetValue: null,
    startDate,
    endDate,
    reminderTime: null,
    reminderEnabled: false,
    timezone: 'UTC',
  };
}

function createCustomDaysConfig(customDays: number[], startDate = utc('2024-01-01'), endDate: Date | null = null): HabitScheduleConfig {
  return {
    frequency: 'CUSTOM_DAYS',
    customDays,
    intervalDays: null,
    timesPerDay: null,
    targetValue: null,
    startDate,
    endDate,
    reminderTime: null,
    reminderEnabled: false,
    timezone: 'UTC',
  };
}

function createIntervalConfig(intervalDays: number, startDate = utc('2024-01-01'), endDate: Date | null = null): HabitScheduleConfig {
  return {
    frequency: 'INTERVAL',
    customDays: [],
    intervalDays,
    timesPerDay: null,
    targetValue: null,
    startDate,
    endDate,
    reminderTime: null,
    reminderEnabled: false,
    timezone: 'UTC',
  };
}

function createMonthlyConfig(dayOfMonth: number, startDate = utc('2024-01-01'), endDate: Date | null = null): HabitScheduleConfig {
  const adjustedStartDate = new Date(startDate);
  adjustedStartDate.setDate(dayOfMonth);
  return {
    frequency: 'MONTHLY',
    customDays: [],
    intervalDays: null,
    timesPerDay: null,
    targetValue: null,
    startDate: adjustedStartDate,
    endDate,
    reminderTime: null,
    reminderEnabled: false,
    timezone: 'UTC',
  };
}

function createMultiDailyConfig(timesPerDay: number, startDate = utc('2024-01-01'), endDate: Date | null = null): HabitScheduleConfig {
  return {
    frequency: 'MULTI_DAILY',
    customDays: [],
    intervalDays: null,
    timesPerDay,
    targetValue: null,
    startDate,
    endDate,
    reminderTime: null,
    reminderEnabled: false,
    timezone: 'UTC',
  };
}