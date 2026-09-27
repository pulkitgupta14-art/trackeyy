export * from './types';
export * from './scheduling';
export * from './completion';
export * from './streak';
export * from './progress';
export * from './service';

import { HabitEngineService } from './service';
import type { DuplicateCompletionPolicy } from './types';

export function createHabitEngine(timezone: string = 'UTC', duplicatePolicy?: Partial<DuplicateCompletionPolicy>) {
  return new HabitEngineService(timezone, duplicatePolicy);
}

export const DEFAULT_TIMEZONE = 'UTC';
export const SUPPORTED_HABIT_TYPES = ['BOOLEAN', 'NUMBER', 'DURATION', 'DISTANCE', 'QUANTITY'] as const;
export const SUPPORTED_FREQUENCIES = ['DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM_DAYS', 'INTERVAL', 'MONTHLY', 'MULTI_DAILY'] as const;
export const COMPLETION_STATES = ['COMPLETED', 'PARTIALLY_COMPLETED', 'MISSED', 'SKIPPED', 'SCHEDULED', 'NOT_SCHEDULED'] as const;