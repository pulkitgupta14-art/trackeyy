"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsContent } from "./AnalyticsContent";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <AnalyticsContent />
    </AppShell>
  );
}