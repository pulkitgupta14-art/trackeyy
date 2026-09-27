"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart2, TrendingUp, Target, Flame, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";

const weeklyData = [
  { day: "Mon", completions: 5, total: 6 },
  { day: "Tue", completions: 4, total: 6 },
  { day: "Wed", completions: 6, total: 6 },
  { day: "Thu", completions: 5, total: 6 },
  { day: "Fri", completions: 4, total: 5 },
  { day: "Sat", completions: 5, total: 5 },
  { day: "Sun", completions: 3, total: 4 },
];

const categoryData = [
  { name: "Fitness", count: 28, color: "#ef4444" },
  { name: "Study", count: 22, color: "#3b82f6" },
  { name: "Health", count: 18, color: "#10b981" },
  { name: "Learning", count: 15, color: "#06b6d4" },
  { name: "Work", count: 12, color: "#8b5cf6" },
];

const habitPerformance = [
  { name: "Morning Run", completions: 25, target: 30, streak: 12, color: "#ef4444" },
  { name: "Study DSA", completions: 18, target: 22, streak: 5, color: "#3b82f6" },
  { name: "Drink Water", completions: 28, target: 30, streak: 28, color: "#10b981" },
  { name: "Read 20 pages", completions: 20, target: 22, streak: 8, color: "#06b6d4" },
  { name: "Meditation", completions: 12, target: 22, streak: 3, color: "#f43f5e" },
];

const monthlyTrend = [
  { week: "Week 1", completions: 18 },
  { week: "Week 2", completions: 22 },
  { week: "Week 3", completions: 19 },
  { week: "Week 4", completions: 25 },
];

export function AnalyticsContent() {
  const avgCompletion = Math.round(
    weeklyData.reduce((sum, d) => sum + (d.total > 0 ? (d.completions / d.total) * 100 : 0), 0) / weeklyData.length
  );

  const totalCompletions = weeklyData.reduce((sum, d) => sum + d.completions, 0);
  const totalTarget = weeklyData.reduce((sum, d) => sum + d.total, 0);

  const stats = [
    { label: "Avg Completion", value: `${avgCompletion}%`, icon: CheckCircle, iconColor: "text-success", iconBg: "bg-success/10", trend: "+5%" },
    { label: "Total Completions", value: totalCompletions, icon: TrendingUp, iconColor: "text-primary", iconBg: "bg-primary/10", trend: "+12%" },
    { label: "Current Streak", value: "12 days", icon: Flame, iconColor: "text-warning", iconBg: "bg-warning/10", trend: "+3 days" },
    { label: "Active Habits", value: "6", icon: Target, iconColor: "text-purple-500", iconBg: "bg-purple-500/10", trend: undefined },
  ];

  const getRateColor = (rate: number) => {
    if (rate >= 80) return "text-success";
    if (rate >= 50) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Insights into your habit patterns</p>
        </div>
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
          <CardHeader>
            <CardTitle>Weekly Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((data) => {
                const rate = data.total > 0 ? Math.round((data.completions / data.total) * 100) : 0;
                const rateColor = getRateColor(rate);
                return (
                  <div key={data.day}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium w-10">{data.day}</span>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <Progress value={rate} className="h-2" />
                        </div>
                        <span className={cn("text-sm font-mono text-muted-foreground w-16 text-right", rateColor)}>
                          {data.completions}/{data.total}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Completions by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((cat) => {
                const maxCount = Math.max(...categoryData.map(c => c.count));
                const percentage = Math.round((cat.count / maxCount) * 100);
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{cat.count} completions</span>
                    </div>
                    <Progress value={percentage} className="h-1.5" style={{ backgroundColor: cat.color }} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid-2col">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-around gap-2">
              {monthlyTrend.map((data, i) => (
                <div key={data.week} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "w-full rounded-t transition-all duration-300 bg-primary/20",
                      i === monthlyTrend.length - 1 && "bg-primary"
                    )}
                    style={{ height: `${(data.completions / Math.max(...monthlyTrend.map(d => d.completions))) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{data.week}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Consistency Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-1 max-w-full">
              {Array.from({ length: 28 }, (_, i) => {
                const dayIndex = i % 7;
                const weekIndex = Math.floor(i / 7);
                const isCompleted = dayIndex !== 6 || weekIndex > 0; // Mock pattern
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                    title={`Day ${i + 1}`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-primary" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-muted" />
                <span>Missed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Habit Performance</CardTitle>
        </CardHeader>
<CardContent className="pt-0">
          <div className="space-y-2">
            {habitPerformance.map((habit) => {
              const rate = habit.target > 0 ? Math.round((habit.completions / habit.target) * 100) : 0;
              const rateColor = getRateColor(rate);
              const badgeVariant = rate >= 80 ? "success" : rate >= 50 ? "warning" : "destructive";
              return (
                <div key={habit.name} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: habit.color + "20" }}>
                    <div className="h-5 w-5 rounded-full" style={{ backgroundColor: habit.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{habit.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-success" />
                        {habit.completions}/{habit.target}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-warning" />
                        {habit.streak} day streak
                      </span>
                      <Badge variant={badgeVariant} className="text-xs">
                        {rate}% rate
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}