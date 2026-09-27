import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { confirmPassword, ...data } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    await prisma.notificationPreference.create({
      data: {
        userId: (await prisma.user.findUnique({ where: { email: data.email } }))!.id,
        emailEnabled: true,
        pushEnabled: true,
        reminderEnabled: true,
        goalEnabled: true,
        streakEnabled: true,
        weeklyReport: true,
        timezone: "UTC",
      },
    });

    // Create default categories
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (user) {
      const defaultCategories = [
        { name: "Fitness", icon: "dumbbell", color: "#ef4444" },
        { name: "Study", icon: "book-open", color: "#3b82f6" },
        { name: "Health", icon: "heart", color: "#10b981" },
        { name: "Sports", icon: "trophy", color: "#f97316" },
        { name: "Learning", icon: "graduation-cap", color: "#06b6d4" },
        { name: "Personal", icon: "user", color: "#ec4899" },
      ];

      for (let i = 0; i < defaultCategories.length; i++) {
        await prisma.category.create({
          data: {
            userId: user.id,
            ...defaultCategories[i],
            isDefault: true,
            sortOrder: i,
          },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}