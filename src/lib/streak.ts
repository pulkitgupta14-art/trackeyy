import { differenceInDays, startOfDay, addDays, getDay, isSameDay } from "date-fns";
// @ts-ignore
import { utcToZonedTime } from "date-fns-tz";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
}

export interface HabitScheduleConfig {
  frequency: string;
  customDays: number[];
  intervalDays: number | null;
  timesPerDay: number | null;
  startDate: Date;
  endDate: Date | null;
}

function isHabitDueOnDate(
  config: HabitScheduleConfig,
  date: Date,
  timezone: string
): boolean {
  const checkDate = utcToZonedTime(date, timezone);
  const habitStart = utcToZonedTime(config.startDate, timezone);
  const habitEnd = config.endDate ? utcToZonedTime(config.endDate, timezone) : null;

  if (checkDate < habitStart) return false;
  if (habitEnd && checkDate > habitEnd) return false;

  const dayOfWeek = checkDate.getDay();

  switch (config.frequency) {
    case "DAILY":
      return true;
    case "WEEKDAYS":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "WEEKENDS":
      return dayOfWeek === 0 || dayOfWeek === 6;
    case "WEEKLY":
      return dayOfWeek === habitStart.getDay();
    case "CUSTOM_DAYS":
      return config.customDays.includes(dayOfWeek);
    case "INTERVAL":
      if (!config.intervalDays) return false;
      const daysDiff = differenceInDays(checkDate, habitStart);
      return daysDiff % config.intervalDays === 0;
    case "MONTHLY":
      return checkDate.getDate() === habitStart.getDate();
    case "MULTI_DAILY":
      return true;
    default:
      return false;
  }
}

function getDueDatesInRange(
  config: HabitScheduleConfig,
  start: Date,
  end: Date,
  timezone: string
): Date[] {
  const dueDates: Date[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    if (isHabitDueOnDate(config, current, timezone)) {
      dueDates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return dueDates;
}

export function calculateStreak(
  completions: Date[],
  config: HabitScheduleConfig,
  timezone: string,
  asOfDate: Date = new Date()
): StreakResult {
  if (completions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      weeklyConsistency: 0,
      monthlyConsistency: 0,
    };
  }

  const zonedCompletions = completions.map((c) => utcToZonedTime(c, timezone));
  const zonedAsOf = utcToZonedTime(asOfDate, timezone);
  const habitStart = utcToZonedTime(config.startDate, timezone);

  const completionDates = new Set(
    zonedCompletions.map((c) => formatDateKey(startOfDay(c)))
  );

  const dueDates = getDueDatesInRange(config, habitStart, zonedAsOf, timezone);
  const dueDateKeys = new Set(dueDates.map((d) => formatDateKey(startOfDay(d))));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const dueDate of dueDates) {
    const key = formatDateKey(startOfDay(dueDate));
    if (completionDates.has(key)) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  currentStreak = tempStreak;

  const totalDue = dueDateKeys.size;
  const totalCompleted = [...dueDateKeys].filter((k) => completionDates.has(k)).length;
  const completionRate = totalDue > 0 ? totalCompleted / totalDue : 0;

  const weeklyConsistency = calculateWeeklyConsistency(
    zonedCompletions,
    config,
    timezone,
    zonedAsOf
  );

  const monthlyConsistency = calculateMonthlyConsistency(
    zonedCompletions,
    config,
    timezone,
    zonedAsOf
  );

  return {
    currentStreak,
    longestStreak,
    completionRate,
    weeklyConsistency,
    monthlyConsistency,
  };
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calculateWeeklyConsistency(
  completions: Date[],
  config: HabitScheduleConfig,
  timezone: string,
  asOfDate: Date
): number {
  const habitStart = utcToZonedTime(config.startDate, timezone);
  const weeksDiff = Math.ceil(differenceInDays(asOfDate, habitStart) / 7);
  
  if (weeksDiff <= 0) return 0;

  let weeksWithCompletion = 0;
  let totalWeeks = 0;

  for (let i = 0; i < weeksDiff; i++) {
    const weekStart = addDays(habitStart, i * 7);
    const weekEnd = addDays(weekStart, 6);
    
    if (weekStart > asOfDate) break;
    
    const dueInWeek = getDueDatesInRange(config, weekStart, weekEnd, timezone);
    if (dueInWeek.length === 0) continue;
    
    totalWeeks++;
    const hasCompletion = dueInWeek.some((due) =>
      completions.some(
        (c) => isSameDay(startOfDay(c), startOfDay(due))
      )
    );
    
    if (hasCompletion) weeksWithCompletion++;
  }

  return totalWeeks > 0 ? weeksWithCompletion / totalWeeks : 0;
}

function calculateMonthlyConsistency(
  completions: Date[],
  config: HabitScheduleConfig,
  timezone: string,
  asOfDate: Date
): number {
  const habitStart = utcToZonedTime(config.startDate, timezone);
  const monthsDiff = (asOfDate.getFullYear() - habitStart.getFullYear()) * 12 + (asOfDate.getMonth() - habitStart.getMonth());
  
  if (monthsDiff < 0) return 0;

  let monthsWithCompletion = 0;
  let totalMonths = 0;

  for (let i = 0; i <= monthsDiff; i++) {
    const monthStart = new Date(habitStart.getFullYear(), habitStart.getMonth() + i, 1);
    const monthEnd = new Date(habitStart.getFullYear(), habitStart.getMonth() + i + 1, 0);
    
    if (monthStart > asOfDate) break;
    
    const dueInMonth = getDueDatesInRange(config, monthStart, monthEnd, timezone);
    if (dueInMonth.length === 0) continue;
    
    totalMonths++;
    const hasCompletion = dueInMonth.some((due) =>
      completions.some(
        (c) => isSameDay(startOfDay(c), startOfDay(due))
      )
    );
    
    if (hasCompletion) monthsWithCompletion++;
  }

  return totalMonths > 0 ? monthsWithCompletion / totalMonths : 0;
}

export function calculateQuantitativeProgress(
  completions: { date: Date; value: number }[],
  targetValue: number,
  date: Date,
  timezone: string
): { value: number; percentage: number; isComplete: boolean } {
  const zonedDate = utcToZonedTime(date, timezone);
  const dayKey = formatDateKey(startOfDay(zonedDate));
  
  const dayCompletion = completions.find(
    (c) => formatDateKey(startOfDay(utcToZonedTime(c.date, timezone))) === dayKey
  );
  
  const value = dayCompletion?.value || 0;
  const percentage = targetValue > 0 ? Math.min((value / targetValue) * 100, 100) : 0;
  
  return {
    value,
    percentage,
    isComplete: value >= targetValue,
  };
}