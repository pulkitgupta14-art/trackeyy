import { auth } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStartOfDayUTC, getEndOfDayUTC } from "@/lib/date";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; date: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, date } = await params;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const completionDate = new Date(date);
    const userTimezone = "UTC"; // TODO: Get from user preferences

    const startOfDay = getStartOfDayUTC(completionDate, userTimezone);
    const endOfDay = getEndOfDayUTC(completionDate, userTimezone);

    const completion = await prisma.habitCompletion.findFirst({
      where: {
        habitId: id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (!completion) {
      return NextResponse.json({ error: "Completion not found" }, { status: 404 });
    }

    await prisma.habitCompletion.delete({ where: { id: completion.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting completion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}