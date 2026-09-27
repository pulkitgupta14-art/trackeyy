"use client";

import * as React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Check, Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Completion {
  habitName: string;
  color: string;
}

const mockCompletions: Record<string, Completion[]> = {
  "2024-01-15": [
    { habitName: "Morning Run", color: "#ef4444" },
    { habitName: "Drink Water", color: "#10b981" },
  ],
  "2024-01-16": [
    { habitName: "Study DSA", color: "#3b82f6" },
    { habitName: "Read 20 pages", color: "#06b6d4" },
    { habitName: "Meditation", color: "#f43f5e" },
  ],
  "2024-01-20": [
    { habitName: "Morning Run", color: "#ef4444" },
    { habitName: "Code Review", color: "#8b5cf6" },
  ],
};

const today = new Date();

export function CalendarContent() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(today);
  const [showCompletions, setShowCompletions] = React.useState<Completion[] | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getCompletionsForDay = (date: Date): Completion[] => {
    const key = format(date, "yyyy-MM-dd");
    return mockCompletions[key] || [];
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (date: Date) => {
    const completions = getCompletionsForDay(date);
    setSelectedDay(date);
    setShowCompletions(completions.length > 0 ? completions : null);
  };

  const isSelected = (date: Date): boolean => selectedDay !== null && isSameDay(date, selectedDay);

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">View your habit completion history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" asChild>
            <a href="/dashboard/habits/new">
              <Plus className="h-4 w-4 mr-2" />
              New Habit
            </a>
          </Button>
        </div>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Completion Calendar</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {weekdays.map((weekday) => (
              <div key={weekday} className="text-center text-xs font-medium text-muted-foreground py-2">
                {weekday}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const completions = getCompletionsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const isCompleted = completions.length > 0;
              const selected = isSelected(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "relative aspect-square rounded-lg transition-all duration-150 flex flex-col items-center justify-center p-1 text-sm font-medium",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isTodayDate && "bg-primary/10 text-primary",
                    isCompleted && "bg-success/5",
                    selected && "ring-2 ring-primary ring-offset-2",
                    (isCurrentMonth || isCompleted) && "hover:bg-accent cursor-pointer",
                    !isCurrentMonth && !isCompleted && "cursor-default"
                  )}
                  disabled={!isCurrentMonth && !isCompleted}
                  aria-label={format(day, "EEEE, MMMM d, yyyy")}
                  aria-current={isTodayDate ? "date" : undefined}
                >
                  <span className="z-10 relative">{format(day, "d")}</span>
                  {isCompleted && (
                    <div className="absolute bottom-1.5 flex gap-0.5 z-10">
                      {completions.slice(0, 3).map((c, i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                      ))}
                      {completions.length > 3 && (
                        <Badge variant="muted" className="text-[10px] px-1 py-0 h-auto">
                          +{completions.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  {isTodayDate && !isCompleted && !selected && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                      <div className="h-1.5 w-1.5 rounded-full border-2 border-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {showCompletions && selectedDay && (
        <Card className="card-hover animate-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {format(selectedDay, "EEEE, MMMM d, yyyy")}
              </div>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowCompletions(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {showCompletions.map((completion: Completion, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: completion.color + "20" }}
                  >
                    <Check className="h-4 w-4" style={{ color: completion.color }} />
                  </div>
                  <span className="font-medium">{completion.habitName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Legend</h2>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-lg bg-primary/10 border border-primary/20" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-lg bg-success/5 border border-success/20" />
            <span>Has completions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-lg bg-muted/50 border border-border" />
            <span>No habits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-lg text-muted-foreground/40" />
            <span>Other month</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background bg-transparent" />
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}