"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sun,
  CheckSquare,
  Calendar,
  BarChart2,
  Target,
  Activity,
  Lightbulb,
  Settings,
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}

interface MobileNavProps {
  navigation: NavigationItem[];
  pathname: string;
}

const icons = {
  "layout-dashboard": LayoutDashboard,
  sun: Sun,
  "check-square": CheckSquare,
  calendar: Calendar,
  "bar-chart-2": BarChart2,
  target: Target,
  activity: Activity,
  lightbulb: Lightbulb,
  settings: Settings,
} as const;

const primaryNav = [
  { name: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { name: "Today", href: "/dashboard/today", icon: "sun" },
  { name: "Habits", href: "/dashboard/habits", icon: "check-square" },
  { name: "Calendar", href: "/dashboard/calendar", icon: "calendar" },
];

export function MobileNav({ navigation, pathname }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-lg" aria-label="Mobile navigation">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {primaryNav.map((item) => {
          const Icon = icons[item.icon as keyof typeof icons];
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 text-xs transition-colors rounded-lg",
                isActive ? "text-primary bg-primary/5" : "text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate w-full text-center">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}