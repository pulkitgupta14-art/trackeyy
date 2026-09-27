import { auth } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createReminderSchema = z.object({
  habitId: z.string().cuid().optional(),
  title: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  frequency: z.enum(["DAILY", "WEEKLY", "CUSTOM"]).default("DAILY"),
  customDays: z.array(z.number().min(0).max(6)).default([]),
  isEnabled: z.boolean().default(true),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

const updateReminderSchema = createReminderSchema.partial();

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId: session.user.id },
      include: { habit: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createReminderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    if (data.habitId) {
      const habit = await prisma.habit.findFirst({
        where: { id: data.habitId, userId: session.user.id },
      });
      if (!habit) {
        return NextResponse.json({ error: "Habit not found" }, { status: 404 });
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        ...data,
        customDays: JSON.stringify(data.customDays || []),
        userId: session.user.id,
      },
      include: { habit: true },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}