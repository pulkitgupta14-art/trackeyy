import { format, parseISO, startOfDay, endOfDay, isSameDay, addDays, differenceInDays, getDay, setHours, setMinutes } from "date-fns";
// @ts-ignore
import { utcToZonedTime, zonedTimeToUtc, formatInTimeZone } from "date-fns-tz";

export function getUserTimezone(timezone?: string): string {
  return timezone || "UTC";
}

export function getTodayInTimezone(timezone: string): Date {
  return utcToZonedTime(new Date(), timezone);
}

export function getDateInTimezone(date: Date, timezone: string): Date {
  return utcToZonedTime(date, timezone);
}

export function startOfDayInTimezone(date: Date, timezone: string): Date {
  const zoned = utcToZonedTime(date, timezone);
  return startOfDay(zoned);
}

export function endOfDayInTimezone(date: Date, timezone: string): Date {
  const zoned = utcToZonedTime(date, timezone);
  return endOfDay(zoned);
}

export function formatDateInTimezone(date: Date, timezone: string, formatStr: string = "yyyy-MM-dd"): string {
  return formatInTimeZone(date, timezone, formatStr);
}

export function formatTimeInTimezone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "HH:mm");
}

export function parseDateInTimezone(dateStr: string, timezone: string): Date {
  const zoned = zonedTimeToUtc(dateStr, timezone);
  return startOfDay(zoned);
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getWeekStart(date: Date, timezone: string): Date {
  const zoned = utcToZonedTime(date, timezone);
  const day = zoned.getDay();
  const diff = zoned.getDate() - day;
  return startOfDay(new Date(zoned.setDate(diff)));
}

export function getWeekEnd(date: Date, timezone: string): Date {
  const start = getWeekStart(date, timezone);
  return addDays(start, 6);
}

export function addTimezoneOffset(date: Date, timezone: string): Date {
  return zonedTimeToUtc(date, timezone);
}

export function removeTimezoneOffset(date: Date, timezone: string): Date {
  return utcToZonedTime(date, timezone);
}

export function getStartOfDayUTC(date: Date, timezone: string): Date {
  const zoned = utcToZonedTime(date, timezone);
  const start = startOfDay(zoned);
  return zonedTimeToUtc(start, timezone);
}

export function getEndOfDayUTC(date: Date, timezone: string): Date {
  const zoned = utcToZonedTime(date, timezone);
  const end = endOfDay(zoned);
  return zonedTimeToUtc(end, timezone);
}

export function isHabitDueOnDate(
  habit: {
    frequency: string;
    customDays: number[];
    intervalDays: number | null;
    timesPerDay: number | null;
    startDate: Date;
    endDate: Date | null;
  },
  date: Date,
  timezone: string
): boolean {
  const checkDate = utcToZonedTime(date, timezone);
  const habitStart = utcToZonedTime(habit.startDate, timezone);
  const habitEnd = habit.endDate ? utcToZonedTime(habit.endDate, timezone) : null;

  if (checkDate < habitStart) return false;
  if (habitEnd && checkDate > habitEnd) return false;

  const dayOfWeek = checkDate.getDay(); // 0 = Sunday

  switch (habit.frequency) {
    case "DAILY":
      return true;
    case "WEEKDAYS":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "WEEKENDS":
      return dayOfWeek === 0 || dayOfWeek === 6;
    case "WEEKLY":
      // Same weekday as start date
      return dayOfWeek === habitStart.getDay();
    case "CUSTOM_DAYS":
      return habit.customDays.includes(dayOfWeek);
    case "INTERVAL":
      if (!habit.intervalDays) return false;
      const daysDiff = differenceInDays(checkDate, habitStart);
      return daysDiff % habit.intervalDays === 0;
    case "MONTHLY":
      return checkDate.getDate() === habitStart.getDate();
    case "MULTI_DAILY":
      return true;
    default:
      return false;
  }
}

export function getHabitTimesPerDay(
  habit: { frequency: string; timesPerDay: number | null },
  date: Date,
  timezone: string
): number {
  if (habit.frequency === "MULTI_DAILY" && habit.timesPerDay) {
    return habit.timesPerDay;
  }
  return 1;
}