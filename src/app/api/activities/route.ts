import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivitySchema, workoutSchema, studySessionSchema } from "@/lib/validation/activity";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    const where: {
      userId: string;
      type?: string;
      date?: { gte?: Date; lte?: Date };
    } = { userId: session.user.id };
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          workout: {
            include: {
              exercises: {
                include: { sets: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          studySession: true,
        },
        orderBy: { startTime: "desc" },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return NextResponse.json({
      data: activities,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
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
    const { workout, studySession, ...activityData } = body;

    const parsed = createActivitySchema.safeParse(activityData);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    let workoutData = null;
    let studyData = null;

    if (parsed.data.type === "GYM" && workout) {
      const workoutParsed = workoutSchema.safeParse(workout);
      if (!workoutParsed.success) {
        return NextResponse.json({ error: "Invalid workout data", details: workoutParsed.error.flatten() }, { status: 400 });
      }
      workoutData = workoutParsed.data;
    }

    if (parsed.data.type === "STUDYING" && studySession) {
      const studyParsed = studySessionSchema.safeParse(studySession);
      if (!studyParsed.success) {
        return NextResponse.json({ error: "Invalid study session data", details: studyParsed.error.flatten() }, { status: 400 });
      }
      studyData = studyParsed.data;
    }

    const activity = await prisma.activity.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
        startTime: new Date(parsed.data.startTime),
        endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : null,
        date: new Date(parsed.data.startTime),
        workout: workoutData
          ? {
              create: {
                name: workoutData.name,
                notes: workoutData.notes,
                exercises: {
                  create: workoutData.exercises.map((ex, i) => ({
                    name: ex.name,
                    sortOrder: ex.sortOrder ?? i,
                    notes: ex.notes,
                    sets: {
                      create: ex.sets.map((set) => ({
                        setNumber: set.setNumber,
                        weight: set.weight,
                        reps: set.reps,
                        duration: set.duration,
                        distance: set.distance,
                        isPR: set.isPR,
                        isWarmup: set.isWarmup,
                      })),
                    },
                  })),
                },
              },
            }
          : undefined,
        studySession: studyData
          ? {
              create: {
                subject: studyData.subject,
                topic: studyData.topic,
                goalMinutes: studyData.goalMinutes,
              },
            }
          : undefined,
      },
      include: {
        workout: {
          include: {
            exercises: { include: { sets: true } },
          },
        },
        studySession: true,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}