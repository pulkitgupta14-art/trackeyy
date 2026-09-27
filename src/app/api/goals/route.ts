import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoalSchema } from "@/lib/validation/goal";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ACTIVE";

    const where: Record<string, unknown> = { userId: session.user.id };
    if (status !== "ALL") where.status = status;

    const goals = await prisma.goal.findMany({
      where,
      include: {
        habitLinks: { include: { habit: true } },
        activityLinks: { include: { activity: true } },
      },
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
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
    const { habitLinks, activityLinks, ...goalData } = body;

    const parsed = createGoalSchema.safeParse(goalData);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
        deadline: new Date(parsed.data.deadline),
        habitLinks: habitLinks?.length
          ? { create: habitLinks.map((h: { habitId: string; weight: number }) => ({ habitId: h.habitId, weight: h.weight })) }
          : undefined,
        activityLinks: activityLinks?.length
          ? { create: activityLinks.map((a: { activityId: string; weight: number }) => ({ activityId: a.activityId, weight: a.weight })) }
          : undefined,
      },
      include: {
        habitLinks: { include: { habit: true } },
        activityLinks: { include: { activity: true } },
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}