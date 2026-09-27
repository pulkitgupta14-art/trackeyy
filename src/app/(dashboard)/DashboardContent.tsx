"use client";

import * as React from "react";
import { format } from "date-fns";
import { CheckSquare, Target, Flame, BarChart2, Plus, Clock, Trophy, TrendingUp, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { HabitCard } from "@/components/habits/HabitCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Today's Progress", value: "68%", icon: CheckSquare, iconColor: "text-success", iconBg: "bg-success/10", trend: "+12%" },
  { label: "Current Streak", value: "12 days", icon: Flame, iconColor: "text-warning", iconBg: "bg-warning/10", trend: "+3 days" },
  { label: "Weekly Consistency", value: "85%", icon: BarChart2, iconColor: "text-primary", iconBg: "bg-primary/10", trend: "+5%" },
  { label: "Active Goals", value: "3", icon: Target, iconColor: "text-purple-500", iconBg: "bg-purple-500/10", trend: undefined },
];

const todayHabits = [
  { id: "1", name: "Morning Run", category: "Fitness", completed: true, time: "06:00", type: "DURATION", frequency: "DAILY", target: 30, unit: "min", color: "#ef4444", current: 30, streak: 12 },
  { id: "2", name: "Study DSA", category: "Study", completed: false, time: "19:00", type: "DURATION", frequency: "WEEKDAYS", target: 90, unit: "min", color: "#3b82f6", current: 0, streak: 5 },
  { id: "3", name: "Drink Water", category: "Health", completed: true, time: "", type: "QUANTITY", frequency: "DAILY", target: 3, unit: "L", color: "#10b981", current: 3, streak: 28 },
  { id: "4", name: "Read 20 pages", category: "Learning", completed: false, time: "21:00", type: "QUANTITY", frequency: "DAILY", target: 20, unit: "pages", color: "#06b6d4", current: 0, streak: 15 },
  { id: "5", name: "Meditation", category: "Health", completed: false, time: "22:00", type: "DURATION", frequency: "DAILY", target: 10, unit: "min", color: "#f43f5e", current: 0, streak: 3 },
];

const activeGoals = [
  { name: "Run 50km this month", progress: 65, current: 32.5, target: 50, unit: "km", color: "#ef4444" },
  { name: "Study 100 hours", progress: 42, current: 42, target: 100, unit: "hrs", color: "#3b82f6" },
  { name: "Gym 20 sessions", progress: 80, current: 16, target: 20, unit: "sessions", color: "#8b5cf6" },
];

const weeklyData = [
  { day: "Mon", value: 45 },
  { day: "Tue", value: 72 },
  { day: "Wed", value: 38 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 60 },
  { day: "Sat", value: 90 },
  { day: "Sun", value: 55 },
];

const achievements = [
  { icon: Flame, label: "7-day streak", color: "text-warning" },
  { icon: Clock, label: "Early bird (5 AM)", color: "text-primary" },
  { icon: Target, label: "First goal hit", color: "text-success" },
];

export function DashboardContent() {
  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Here's your progress overview</p>
        </div>
        <Button asChild size="sm">
          <a href="/dashboard/habits/new">
            <Plus className="h-4 w-4 mr-2" />
            New Habit
          </a>
        </Button>
      </div>

      <div className="grid-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={Icon}
              iconColor={stat.iconColor}
              iconBg={stat.iconBg}
              trend={stat.trend}
            />
          );
        })}
      </div>

      <div className="grid-2col">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Habits</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/today">View all</a>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {todayHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  {...habit}
                  variant="compact"
                  showStreak={false}
                  showProgress={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Goals</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/goals">View all</a>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <div key={goal.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-medium">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.current}/{goal.target} {goal.unit}
                    </p>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" style={{ backgroundColor: goal.color }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="card-hover lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-around gap-2">
              {weeklyData.map((data, i) => (
                <div key={data.day} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "w-full rounded-t transition-all duration-300 bg-primary/20",
                      i === 3 && "bg-primary"
                    )}
                    style={{ height: `${data.value}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{data.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {achievements.map((achievement, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <achievement.icon className={cn("h-5 w-5", achievement.color)} />
                  <span className="text-sm">{achievement.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}