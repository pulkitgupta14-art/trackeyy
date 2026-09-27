"use client";

import * as React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Check, Plus, Circle, Clock, Target, Flame, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { HabitCard, HabitCardSkeleton } from "@/components/habits/HabitCard";

const todayHabits = [
  { id: "1", name: "Morning Run", category: "Fitness", color: "#ef4444", completed: true, time: "06:00", type: "DURATION", frequency: "DAILY", target: 30, unit: "min", current: 30, streak: 12 },
  { id: "2", name: "Study DSA", category: "Study", color: "#3b82f6", completed: false, time: "19:00", type: "DURATION", frequency: "WEEKDAYS", target: 90, unit: "min", current: 0, streak: 5 },
  { id: "3", name: "Drink Water", category: "Health", color: "#10b981", completed: true, time: "", type: "QUANTITY", frequency: "DAILY", target: 3, unit: "L", current: 3, streak: 28 },
  { id: "4", name: "Read 20 pages", category: "Learning", color: "#06b6d4", completed: false, time: "21:00", type: "QUANTITY", frequency: "DAILY", target: 20, unit: "pages", current: 0, streak: 15 },
  { id: "5", name: "Meditation", category: "Health", color: "#f43f5e", completed: false, time: "22:00", type: "DURATION", frequency: "DAILY", target: 10, unit: "min", current: 0, streak: 3 },
  { id: "6", name: "Code Review", category: "Work", color: "#8b5cf6", completed: false, time: "14:00", type: "DURATION", frequency: "WEEKDAYS", target: 60, unit: "min", current: 0, streak: 8 },
];

export function TodayContent() {
  const { addToast } = useUIStore();
  const [habits, setHabits] = React.useState(todayHabits);
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleHabit = (id: string, completed: boolean) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, completed, current: completed ? h.target : 0 } : h
      )
    );
    const habit = habits.find((h) => h.id === id);
    if (habit) {
      addToast({
        type: "success",
        title: completed ? "Completed!" : "Marked incomplete",
        description: habit.name,
      });
    }
  };

  const handleAddHabit = () => {
    setShowQuickAdd(true);
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Today</h1>
          <p className="page-subtitle">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <Button onClick={handleAddHabit} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Habit
        </Button>
      </div>

      <Card className="card-hover">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Daily Progress</p>
              <p className="text-3xl font-bold tracking-tight">{progress}%</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-36 hidden sm:block">
                <Progress value={progress} className="h-2" />
              </div>
              <ProgressRing value={progress} size={56} strokeWidth={4} showPercentage />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{completedCount} of {totalCount} completed</span>
            <span className="text-border">•</span>
            <span>{totalCount - completedCount} remaining</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {habits.length > 0 ? (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              {...habit}
              variant="today"
              onToggle={toggleHabit}
              showStreak={true}
            />
          ))
        ) : (
          <Card className="text-center py-12 animate-in">
            <CardContent>
              <Circle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No habits for today</h3>
              <p className="text-muted-foreground mb-4">
                Create your first habit and start building your streak.
              </p>
              <Button onClick={handleAddHabit} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Habit
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}