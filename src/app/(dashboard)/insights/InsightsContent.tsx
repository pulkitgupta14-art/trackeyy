"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, Target, Flame, Clock, AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

const insights = [
  {
    type: "positive",
    title: "Strong Monday Performance",
    description: "You complete 85% of habits on Mondays, your best day of the week.",
    icon: TrendingUp,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    type: "positive",
    title: "12-Day Streak!",
    description: "Your current streak is 12 days. Keep it going to beat your record of 15 days.",
    icon: Flame,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    type: "neutral",
    title: "Evening Habits Need Attention",
    description: "Habits scheduled after 8 PM have a 40% completion rate vs 75% for morning habits.",
    icon: Clock,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    type: "warning",
    title: "Meditation Streak at Risk",
    description: "You've missed meditation 3 days in a row. Consider moving it to morning.",
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    type: "positive",
    title: "Weekend Consistency Improved",
    description: "Weekend completion rate increased 15% this month. Great progress!",
    icon: ArrowUpRight,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    type: "neutral",
    title: "Study Sessions Too Long",
    description: "90-minute study sessions have 50% completion. Try splitting into 2×45min.",
    icon: Target,
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const patterns = [
  { label: "Best Time", value: "6:00 AM", detail: "Highest completion rate (92%)" },
  { label: "Worst Time", value: "10:00 PM", detail: "Lowest completion rate (35%)" },
  { label: "Best Day", value: "Wednesday", detail: "88% average completion" },
  { label: "Worst Day", value: "Sunday", detail: "52% average completion" },
  { label: "Longest Streak", value: "15 days", detail: "Achieved in March 2024" },
  { label: "Current Streak", value: "12 days", detail: "Started Jan 3, 2024" },
];

export function InsightsContent() {
  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="page-subtitle">AI-powered patterns and recommendations</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-hover lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {insights.map((insight, i) => (
                <div key={i} className={cn("p-4 rounded-lg border", insight.bg)}>
                  <div className="flex items-start gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", insight.bg)}>
                      <insight.icon className={cn("h-5 w-5", insight.color)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                    <Badge variant={insight.type === "positive" ? "success" : insight.type === "warning" ? "destructive" : "muted"}>
                      {insight.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Patterns</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              {patterns.map((pattern, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{pattern.label}</p>
                  <p className="text-lg font-semibold mt-1">{pattern.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pattern.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-primary">Move Meditation to Morning</h4>
                    <p className="text-sm text-muted-foreground mt-1">Your 6 AM habits have 92% completion. Moving meditation from 10 PM to 6 AM could improve consistency by 50%.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/10">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-warning">Split Long Study Sessions</h4>
                    <p className="text-sm text-muted-foreground mt-1">90-minute sessions have low completion. Two 45-minute sessions with a break could increase completion to 75%.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-success/5 border border-success/10">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-success">Add Weekend Review</h4>
                    <p className="text-sm text-muted-foreground mt-1">A 10-minute Sunday planning session correlates with 20% better weekday completion.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}