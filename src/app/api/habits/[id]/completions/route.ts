import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { habitCompletionSchema } from "@/lib/validation/habit";
import { NextResponse } from "next/server";
import { getStartOfDayUTC, getEndOfDayUTC } from "@/lib/date";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const habit = await prisma.habit.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const where: {
      habitId: string;
      date?: { gte?: Date; lte?: Date };
    } = { habitId: id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const completions = await prisma.habitCompletion.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(completions);
  } catch (error) {
    console.error("Error fetching completions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = habitCompletionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const habit = await prisma.habit.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const completionDate = new Date(parsed.data.date);
    const userTimezone = "UTC"; // TODO: Get from user preferences

    const startOfDay = getStartOfDayUTC(completionDate, userTimezone);
    const endOfDay = getEndOfDayUTC(completionDate, userTimezone);

    const existingCompletion = await prisma.habitCompletion.findFirst({
      where: {
        habitId: id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingCompletion) {
      const updated = await prisma.habitCompletion.update({
        where: { id: existingCompletion.id },
        data: {
          value: parsed.data.value,
          note: parsed.data.note,
          completedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    const completion = await prisma.habitCompletion.create({
      data: {
        habitId: id,
        userId: session.user.id,
        date: startOfDay,
        value: parsed.data.value,
        note: parsed.data.note,
      },
    });

    return NextResponse.json(completion, { status: 201 });
  } catch (error) {
    console.error("Error creating completion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}