"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarContent } from "./CalendarContent";

export default function CalendarPage() {
  return (
    <AppShell>
      <CalendarContent />
    </AppShell>
  );
}