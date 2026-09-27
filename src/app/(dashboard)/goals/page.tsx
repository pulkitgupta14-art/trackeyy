"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { GoalsContent } from "./GoalsContent";

export default function GoalsPage() {
  return (
    <AppShell>
      <GoalsContent />
    </AppShell>
  );
}