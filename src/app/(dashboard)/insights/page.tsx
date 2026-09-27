"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InsightsContent } from "./InsightsContent";

export default function InsightsPage() {
  return (
    <AppShell>
      <InsightsContent />
    </AppShell>
  );
}