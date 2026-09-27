import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStartOfDayUTC, getEndOfDayUTC } from "@/lib/date";
import { calculateStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";
    const timezone = "UTC"; // TODO: Get from user preferences

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const habits = await prisma.habit.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
        startDate: { lte: now },
      },
      include: {
        completions: {
          where: {
            date: { gte: startDate, lte: now },
          },
          orderBy: { date: "asc" },
        },
        category: true,
      },
    });

    const dailyCompletion: { date: string; completed: number; total: number; rate: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= now) {
      const dayKey = currentDate.toISOString().split("T")[0];
      const dueHabits = habits.filter((h) => {
        // Simplified: check if habit is due on this day
        return true; // TODO: Proper frequency check
      });
      const completedCount = dueHabits.filter((h) =>
        h.completions.some((c) => c.date.toISOString().split("T")[0] === dayKey)
      ).length;

      dailyCompletion.push({
        date: dayKey,
        completed: completedCount,
        total: dueHabits.length,
        rate: dueHabits.length > 0 ? completedCount / dueHabits.length : 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const habitConsistency = habits.map((habit) => {
      const completions = habit.completions.map((c) => c.date);
      let customDays: number[] = [];
      try {
        customDays = JSON.parse(habit.customDays || "[]");
      } catch {
        customDays = [];
      }
      const streak = calculateStreak(
        completions,
        {
          frequency: habit.frequency,
          customDays,
          intervalDays: habit.intervalDays,
          timesPerDay: habit.timesPerDay,
          startDate: habit.startDate,
          endDate: habit.endDate,
        },
        timezone
      );
      return {
        habitId: habit.id,
        name: habit.name,
        rate: streak.completionRate,
        streak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      };
    });

    const categoryBreakdown = await prisma.activity.groupBy({
      by: ["type"],
      where: {
        userId: session.user.id,
        date: { gte: startDate, lte: now },
      },
      _count: { id: true },
      _sum: { duration: true },
    });

    const categoryData = categoryBreakdown.map((c) => ({
      category: c.type,
      count: c._count.id,
      minutes: c._sum.duration || 0,
    }));

    const streakHistory = dailyCompletion.map((d) => ({
      date: d.date,
      streak: 0, // Would need more complex calculation
    }));

    return NextResponse.json({
      dailyCompletion,
      habitConsistency,
      categoryBreakdown: categoryData,
      streakHistory,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}