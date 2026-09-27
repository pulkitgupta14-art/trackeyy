"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TodayContent } from "./TodayContent";

export default function TodayPage() {
  return (
    <AppShell>
      <TodayContent />
    </AppShell>
  );
}