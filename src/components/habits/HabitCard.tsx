"use client";

import * as React from "react";
import { Check, Clock, Target, MoreHorizontal, Edit, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { HABIT_TYPES, HABIT_FREQUENCIES } from "@/lib/constants";

export interface HabitCardProps {
  id: string;
  name: string;
  category: string;
  color: string;
  completed: boolean;
  time: string;
  type: string;
  frequency: string;
  target?: number;
  unit?: string;
  current?: number;
  streak: number;
  description?: string;
  reminderTime?: string;
  variant?: "default" | "compact" | "today" | "list";
  onToggle?: (id: string, completed: boolean) => void;
  onEdit?: (habit: HabitCardProps) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  showActions?: boolean;
  showStreak?: boolean;
  showProgress?: boolean;
  showCategory?: boolean;
  showTime?: boolean;
  className?: string;
}

interface HabitEditData {
  id: string;
  name: string;
  category: string;
  color: string;
  completed: boolean;
  time: string;
  type: string;
  frequency: string;
  target?: number;
  unit?: string;
  current?: number;
  streak: number;
  description?: string;
  reminderTime?: string;
}

function getProgress(habit: { type: string; completed: boolean; target?: number; current?: number }): number {
  if (habit.type === "BOOLEAN") return habit.completed ? 100 : 0;
  if (!habit.target || habit.target === 0) return 0;
  const current = habit.current ?? (habit.completed ? habit.target : 0);
  return Math.min(Math.round((current / habit.target) * 100), 100);
}

function getFrequencyLabel(frequency: string): string {
  const freq = HABIT_FREQUENCIES.find(f => f.value === frequency);
  return freq?.label || frequency;
}

function getTypeLabel(type: string): string {
  const t = HABIT_TYPES.find(t => t.value === type);
  return t?.label || type;
}

export function HabitCard({
  id,
  name,
  category,
  color,
  completed,
  time,
  type,
  frequency,
  target,
  unit,
  current,
  streak,
  description,
  reminderTime,
  variant = "default",
  onToggle,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  showStreak = true,
  showProgress = true,
  showCategory = true,
  showTime = true,
  className,
}: HabitCardProps) {
  const progress = getProgress({ type, completed, target, current });
  const isCompact = variant === "compact";
  const isToday = variant === "today";
  const isList = variant === "list";

  const handleToggle = () => {
    onToggle?.(id, !completed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  const colorStyle = { backgroundColor: color + "20" } as React.CSSProperties;
  const colorDotStyle = { backgroundColor: color } as React.CSSProperties;
  const progressColorStyle = { backgroundColor: color } as React.CSSProperties;

  const editData: HabitEditData = {
    id,
    name,
    category,
    color,
    completed,
    time,
    type,
    frequency,
    target,
    unit,
    current,
    streak,
    description,
    reminderTime,
  };

  if (isCompact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
          completed ? "bg-success/5 border-success/20" : "hover:bg-accent/50",
          className
        )}
      >
        <button
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center border-2 transition-all flex-shrink-0",
            completed
              ? "bg-primary border-primary text-primary-foreground shadow-sm"
              : "border-border hover:border-primary/50 hover:bg-accent"
          )}
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
          aria-pressed={completed}
        >
          {completed && <Check className="h-5 w-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full flex-shrink-0" style={colorDotStyle} />
            <h3 className={cn("font-medium truncate", completed && "line-through text-muted-foreground")}>
              {name}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {showCategory && <span>{category}</span>}
            {showTime && time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </span>
            )}
            {target && (
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {current ?? 0}/{target} {unit}
              </span>
            )}
          </div>
        </div>
        {showProgress && type !== "BOOLEAN" && !completed && (
          <Progress value={progress} className="h-1.5 w-24" style={progressColorStyle} />
        )}
        {showStreak && streak && streak > 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full inline-block mr-1" style={colorDotStyle} />
            {streak}d
          </span>
        )}
      </div>
    );
  }

  if (isToday) {
    return (
      <div
        className={cn(
          "habit-card transition-all duration-150",
          completed ? "bg-success/5 border-success/20" : "hover:bg-accent/50",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-all flex-shrink-0",
              completed
                ? "bg-primary border-primary text-primary-foreground shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-accent"
            )}
            aria-label={completed ? "Mark incomplete" : "Mark complete"}
            aria-pressed={completed}
          >
            {completed && <Check className="h-6 w-6" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full flex-shrink-0" style={colorDotStyle} />
              <h3 className={cn("font-medium truncate", completed && "line-through text-muted-foreground")}>
                {name}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              {showTime && time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {time}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {type !== "BOOLEAN" ? `${current ?? 0}/${target} ${unit}` : "Tap to complete"}
              </span>
            </div>
            {type !== "BOOLEAN" && !completed && showProgress && (
              <Progress value={progress} className="h-1 mt-2" style={progressColorStyle} />
            )}
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <span className="sr-only">More options</span>
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem asChild onClick={() => onView?.(id)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(editData)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete?.(id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  if (isList) {
    return (
      <div
        className={cn(
          "card-hover",
          className
        )}
      >
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", colorStyle)}>
                <div className="h-5 w-5 rounded-full" style={colorDotStyle} />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium truncate">{name}</h3>
                {description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>}
                <p className="text-sm text-muted-foreground">{category}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={() => onEdit?.(editData)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={() => onDelete?.(id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {showCategory && frequency && (
              <span className="flex items-center gap-1">
                <span className="h-3 w-3" />
                {getFrequencyLabel(frequency)}
              </span>
            )}
            {target && (
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {getTypeLabel(type)}: {target} {unit}
              </span>
            )}
            {reminderTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Reminder: {reminderTime}
              </span>
            )}
          </div>

          {showStreak && streak && streak > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={colorDotStyle} />
              <span className="text-sm font-medium text-muted-foreground">
                {streak} day streak
              </span>
            </div>
          )}

          {showProgress && type !== "BOOLEAN" && (
            <div className="mt-3">
              <Progress value={progress} className="h-1.5" style={progressColorStyle} />
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>{progress}% complete</span>
                <span>{current ?? 0}/{target} {unit}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "card-hover",
        className
      )}
    >
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", colorStyle)}>
              <div className="h-5 w-5 rounded-full" style={colorDotStyle} />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate">{name}</h3>
              <p className="text-sm text-muted-foreground">{category}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit?.(editData)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={() => onDelete?.(id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {frequency && (
            <span className="flex items-center gap-1">
              <span className="h-3 w-3" />
              {getFrequencyLabel(frequency)}
            </span>
          )}
          {target && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {target} {unit}
            </span>
          )}
        </div>

        {reminderTime && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Reminder: {reminderTime}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={colorDotStyle} />
          <span className="text-sm font-medium text-muted-foreground">
            {streak ?? 0} day streak
          </span>
        </div>
      </div>
    </div>
  );
}

export function HabitCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" | "today" | "list" }) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
        <div className="h-10 w-10 rounded-xl bg-muted flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 bg-muted rounded mb-2" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
        <div className="h-1.5 w-24 bg-muted rounded" />
      </div>
    );
  }

  if (variant === "today") {
    return (
      <div className="habit-card animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted flex-shrink-0" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
            <div className="flex items-center gap-3 text-xs mt-1">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="h-1 w-full bg-muted rounded mt-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-hover animate-pulse">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div>
              <div className="h-4 w-1/2 bg-muted rounded mb-1" />
              <div className="h-3 w-1/3 bg-muted rounded" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="mt-4">
          <div className="h-2 w-2 bg-muted rounded-full" />
          <div className="h-3 w-20 bg-muted rounded ml-2" />
        </div>
      </div>
    </div>
  );
}