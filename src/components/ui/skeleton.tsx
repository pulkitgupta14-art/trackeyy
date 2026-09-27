import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function SkeletonText({ className, lines = 3, ...props }: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("animate-pulse rounded-md bg-muted h-4", i === lines - 1 && "w-3/4")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse rounded-lg border border-border bg-card p-4", className)} {...props}>
      <div className="h-4 w-1/3 bg-muted rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
      </div>
    </div>
  );
}

export function SkeletonStat({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse rounded-lg border border-border bg-card p-5", className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-1/2 bg-muted rounded mb-2" />
          <div className="h-6 w-3/4 bg-muted rounded mb-2" />
          <div className="h-3 w-1/3 bg-muted rounded" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-muted flex-shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonHabit({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "compact" | "today" | "list" }) {
  if (variant === "compact") {
    return (
      <div className={cn("animate-pulse flex items-center gap-3 p-3 rounded-lg border", className)} {...props}>
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
      <div className={cn("animate-pulse habit-card", className)} {...props}>
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
    <div className={cn("animate-pulse card-hover", className)} {...props}>
      <div className="p-4 sm:p-6">
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

export { Skeleton };