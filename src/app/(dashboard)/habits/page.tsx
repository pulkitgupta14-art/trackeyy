"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { HabitsContent } from "./HabitsContent";

export default function HabitsPage() {
  return (
    <AppShell>
      <HabitsContent />
    </AppShell>
  );
}