import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "pulkit@example.com" },
    update: {},
    create: {
      email: "pulkit@example.com",
      name: "Pulkit",
      passwordHash,
      timezone: "Asia/Kolkata",
    },
  });

  console.log("Created user:", user.email);

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Fitness" } },
      update: {},
      create: { userId: user.id, name: "Fitness", icon: "dumbbell", color: "#ef4444", isDefault: true, sortOrder: 0 },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Study" } },
      update: {},
      create: { userId: user.id, name: "Study", icon: "book-open", color: "#3b82f6", isDefault: true, sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Health" } },
      update: {},
      create: { userId: user.id, name: "Health", icon: "heart", color: "#10b981", isDefault: true, sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Sports" } },
      update: {},
      create: { userId: user.id, name: "Sports", icon: "trophy", color: "#f97316", isDefault: true, sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Learning" } },
      update: {},
      create: { userId: user.id, name: "Learning", icon: "graduation-cap", color: "#06b6d4", isDefault: true, sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Personal" } },
      update: {},
      create: { userId: user.id, name: "Personal", icon: "user", color: "#ec4899", isDefault: true, sortOrder: 5 },
    }),
  ]);

  const [fitnessCat, studyCat, healthCat, sportsCat, learningCat] = categories;

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const habits = await Promise.all([
    prisma.habit.upsert({
      where: { id: "habit-gym" },
      update: {},
      create: {
        id: "habit-gym",
        userId: user.id,
        categoryId: fitnessCat.id,
        name: "Gym",
        description: "Strength training workout",
        icon: "dumbbell",
        color: "#ef4444",
        type: "BOOLEAN",
        frequency: "WEEKLY",
        customDays: JSON.stringify([1, 3, 5]),
        targetValue: 3,
        unit: "sessions",
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        status: "ACTIVE",
        sortOrder: 0,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-study" },
      update: {},
      create: {
        id: "habit-study",
        userId: user.id,
        categoryId: studyCat.id,
        name: "Study DSA",
        description: "Data Structures and Algorithms practice",
        icon: "code",
        color: "#3b82f6",
        type: "DURATION",
        frequency: "WEEKDAYS",
        customDays: JSON.stringify([]),
        targetValue: 90,
        unit: "minutes",
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        status: "ACTIVE",
        sortOrder: 1,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-badminton" },
      update: {},
      create: {
        id: "habit-badminton",
        userId: user.id,
        categoryId: sportsCat.id,
        name: "Badminton",
        description: "Play badminton",
        icon: "trophy",
        color: "#f97316",
        type: "BOOLEAN",
        frequency: "WEEKENDS",
        customDays: JSON.stringify([]),
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        status: "ACTIVE",
        sortOrder: 2,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-reading" },
      update: {},
      create: {
        id: "habit-reading",
        userId: user.id,
        categoryId: learningCat.id,
        name: "Read 20 pages",
        description: "Read at least 20 pages daily",
        icon: "book",
        color: "#06b6d4",
        type: "QUANTITY",
        frequency: "DAILY",
        customDays: JSON.stringify([]),
        targetValue: 20,
        unit: "pages",
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        status: "ACTIVE",
        sortOrder: 3,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-water" },
      update: {},
      create: {
        id: "habit-water",
        userId: user.id,
        categoryId: healthCat.id,
        name: "Drink 3L water",
        description: "Stay hydrated",
        icon: "droplet",
        color: "#10b981",
        type: "QUANTITY",
        frequency: "DAILY",
        customDays: JSON.stringify([]),
        targetValue: 3,
        unit: "L",
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        status: "ACTIVE",
        sortOrder: 4,
      },
    }),
    prisma.habit.upsert({
      where: { id: "habit-coding" },
      update: {},
      create: {
        id: "habit-coding",
        userId: user.id,
        categoryId: studyCat.id,
        name: "Code for 90 minutes",
        description: "Deep work coding session",
        icon: "code",
        color: "#8b5cf6",
        type: "DURATION",
        frequency: "WEEKDAYS",
        customDays: JSON.stringify([]),
        targetValue: 90,
        unit: "minutes",
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        status: "ACTIVE",
        sortOrder: 5,
      },
    }),
  ]);

  console.log("Created habits");

  const habitCompletions = [];
  const habitMap = Object.fromEntries(habits.map((h) => [h.name, h.id]));

  for (let i = 0; i < 30; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    for (const habit of habits) {
      let shouldComplete = false;
      let value: number | undefined;

      switch (habit.name) {
        case "Gym":
          shouldComplete = [1, 3, 5].includes(date.getDay());
          break;
        case "Study DSA":
        case "Code for 90 minutes":
          shouldComplete = date.getDay() >= 1 && date.getDay() <= 5;
          value = shouldComplete ? habit.targetValue ?? undefined : undefined;
          break;
        case "Badminton":
          shouldComplete = date.getDay() === 0 || date.getDay() === 6;
          break;
        case "Read 20 pages":
        case "Drink 3L water":
          shouldComplete = Math.random() > 0.2;
          value = shouldComplete ? habit.targetValue ?? undefined : undefined;
          break;
      }

      if (shouldComplete && date <= today) {
        habitCompletions.push(
          prisma.habitCompletion.upsert({
            where: { habitId_date: { habitId: habit.id, date } },
            update: { value, completedAt: new Date() },
            create: {
              habitId: habit.id,
              userId: user.id,
              date,
              value,
              completedAt: new Date(),
            },
          })
        );
      }
    }
  }

  await Promise.all(habitCompletions);
  console.log("Created habit completions");

  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        userId: user.id,
        type: "GYM",
        name: "Push Day",
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 18, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 19, 30),
        duration: 90,
        notes: "Chest, shoulders, triceps",
        rating: 5,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
        workout: {
          create: {
            name: "Push Day",
            notes: "Chest, shoulders, triceps",
            exercises: {
              create: [
                {
                  name: "Bench Press",
                  sortOrder: 0,
                  sets: {
                    create: [
                      { setNumber: 1, weight: 40, reps: 10, isWarmup: true },
                      { setNumber: 2, weight: 60, reps: 8 },
                      { setNumber: 3, weight: 70, reps: 6 },
                      { setNumber: 4, weight: 70, reps: 5 },
                    ],
                  },
                },
                {
                  name: "Overhead Press",
                  sortOrder: 1,
                  sets: {
                    create: [
                      { setNumber: 1, weight: 30, reps: 10, isWarmup: true },
                      { setNumber: 2, weight: 45, reps: 8 },
                      { setNumber: 3, weight: 50, reps: 6 },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    }),
    prisma.activity.create({
      data: {
        userId: user.id,
        type: "STUDYING",
        name: "DSA Practice",
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 19, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 20, 30),
        duration: 90,
        notes: "LeetCode medium problems",
        rating: 4,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
        studySession: {
          create: { subject: "DSA", topic: "Binary Trees", goalMinutes: 90 },
        },
      },
    }),
    prisma.activity.create({
      data: {
        userId: user.id,
        type: "RUNNING",
        name: "Morning Run",
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 6, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 6, 45),
        duration: 45,
        distance: 5.2,
        notes: "Easy pace",
        rating: 4,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
      },
    }),
    prisma.activity.create({
      data: {
        userId: user.id,
        type: "READING",
        name: "Atomic Habits",
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4, 21, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4, 21, 45),
        duration: 45,
        quantity: 30,
        unit: "pages",
        notes: "Chapters 3-5",
        rating: 5,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4),
      },
    }),
  ]);

  console.log("Created activities");

  const goals = await Promise.all([
    prisma.goal.create({
      data: {
        userId: user.id,
        name: "Run 50km this month",
        description: "Build running endurance",
        targetValue: 50,
        currentValue: 23.5,
        unit: "km",
        deadline: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        status: "ACTIVE",
        autoCalculate: true,
        activityLinks: {
          create: [{ activityId: activities.find((a) => a.type === "RUNNING")!.id, weight: 1 }],
        },
      },
    }),
    prisma.goal.create({
      data: {
        userId: user.id,
        name: "Study 100 hours this month",
        description: "Consistent DSA practice",
        targetValue: 100,
        currentValue: 42,
        unit: "hours",
        deadline: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        status: "ACTIVE",
        autoCalculate: true,
        habitLinks: {
          create: [
            { habitId: habitMap["Study DSA"], weight: 1 },
            { habitId: habitMap["Code for 90 minutes"], weight: 1 },
          ],
        },
      },
    }),
    prisma.goal.create({
      data: {
        userId: user.id,
        name: "Gym 20 sessions this month",
        description: "Consistent strength training",
        targetValue: 20,
        currentValue: 14,
        unit: "sessions",
        deadline: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        status: "ACTIVE",
        autoCalculate: true,
        habitLinks: {
          create: [{ habitId: habitMap["Gym"], weight: 1 }],
        },
      },
    }),
  ]);

  console.log("Created goals");

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      emailEnabled: true,
      pushEnabled: true,
      reminderEnabled: true,
      goalEnabled: true,
      streakEnabled: true,
      weeklyReport: true,
      timezone: "Asia/Kolkata",
    },
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });