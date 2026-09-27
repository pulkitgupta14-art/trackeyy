import { auth } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStartOfDayUTC, getEndOfDayUTC } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const timezone = "UTC"; // TODO: Get from user preferences

    const startUTC = getStartOfDayUTC(startDate, timezone);
    const endUTC = getEndOfDayUTC(endDate, timezone);

    const [habits, completions, activities] = await Promise.all([
      prisma.habit.findMany({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
          startDate: { lte: endDate },
        },
        select: { id: true, name: true, color: true, frequency: true, customDays: true, startDate: true, endDate: true },
      }),
      prisma.habitCompletion.findMany({
        where: {
          habit: { userId: session.user.id },
          date: { gte: startUTC, lte: endUTC },
        },
        select: { habitId: true, date: true, value: true },
      }),
      prisma.activity.findMany({
        where: {
          userId: session.user.id,
          date: { gte: startUTC, lte: endUTC },
        },
        select: { id: true, type: true, name: true, startTime: true, duration: true, date: true },
      }),
    ]);

    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateKey = date.toISOString().split("T")[0];

      const dayCompletions = completions.filter((c) => c.date.toISOString().split("T")[0] === dateKey);
      const dayActivities = activities.filter((a) => a.date.toISOString().split("T")[0] === dateKey);

      calendarData.push({
        date: dateKey,
        day,
        habits: dayCompletions.map((c) => ({
          habitId: c.habitId,
          completed: true,
          value: c.value,
        })),
        activities: dayActivities.map((a) => ({
          id: a.id,
          type: a.type,
          name: a.name,
          startTime: a.startTime.toISOString(),
          duration: a.duration,
        })),
      });
    }

    return NextResponse.json({ year, month, days: calendarData });
  } catch (error) {
    console.error("Error fetching calendar:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}