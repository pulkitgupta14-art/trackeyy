"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { name: "Today", href: "/dashboard/today", icon: "sun" },
  { name: "Habits", href: "/dashboard/habits", icon: "check-square" },
  { name: "Calendar", href: "/dashboard/calendar", icon: "calendar" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "bar-chart-2" },
  { name: "Goals", href: "/dashboard/goals", icon: "target" },
  { name: "Activities", href: "/dashboard/activities", icon: "activity" },
  { name: "Insights", href: "/dashboard/insights", icon: "lightbulb" },
  { name: "Settings", href: "/dashboard/settings", icon: "settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        navigation={navigation}
        pathname={pathname}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <MobileNav navigation={navigation} pathname={pathname} />
      <div className="lg:pl-64">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}