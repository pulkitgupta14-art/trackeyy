"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: string;
  trendIcon?: LucideIcon;
  trendColor?: string;
  className?: string;
  size?: "default" | "compact";
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendIcon: TrendIcon = TrendingUp,
  trendColor = "text-success",
  className,
  size = "default",
}: StatCardProps) {
  const isCompact = size === "compact";

  return (
    <Card className={cn("stat-card", isCompact && "p-4", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
            {label}
          </p>
          <p className={cn("font-bold tracking-tight", isCompact ? "text-xl" : "text-2xl")}>
            {value}
          </p>
          {trend && TrendIcon && (
            <p className={cn("mt-1 flex items-center gap-1", isCompact ? "text-xs" : "text-xs", trendColor)}>
              <TrendIcon className={cn("h-3 w-3", isCompact && "h-2.5 w-2.5")} />
              {trend} vs last week
            </p>
          )}
        </div>
        <div className={cn("stat-card-icon flex-shrink-0", isCompact && "h-8 w-8", iconBg)}>
          <Icon className={cn("h-5 w-5", isCompact && "h-4 w-4", iconColor)} />
        </div>
      </div>
    </Card>
  );
}

export function StatCardSkeleton({ size = "default" }: { size?: "default" | "compact" }) {
  const isCompact = size === "compact";
  return (
    <Card className={cn("stat-card animate-pulse", isCompact && "p-4")}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className={cn("h-3 w-1/2 bg-muted rounded", isCompact && "h-2.5 w-1/3")} />
          <div className={cn("h-6 w-3/4 bg-muted rounded mt-2", isCompact && "h-5 w-1/2")} />
          <div className={cn("h-3 w-1/3 bg-muted rounded mt-1", isCompact && "h-2.5 w-1/4")} />
        </div>
        <div className={cn("stat-card-icon flex-shrink-0 bg-muted", isCompact && "h-8 w-8")} />
      </div>
    </Card>
  );
}