"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  ChevronLeft,
  ChevronRight,
  CheckSquare as CheckSquareIcon,
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  navigation: NavigationItem[];
  pathname: string;
  open: boolean;
  onClose: () => void;
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

export function Sidebar({ navigation, pathname, open, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  if (!open) return null;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-200 lg:relative lg:z-auto",
        collapsed ? "w-16" : "w-64"
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2" aria-label="Trackeyy Home">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <CheckSquareIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">Trackeyy</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="lg:hidden"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.name : undefined}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <div className="text-xs text-muted-foreground text-center">
            Trackeyy v0.1.0
          </div>
        </div>
      </div>
    </aside>
  );
}