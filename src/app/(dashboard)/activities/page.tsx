"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ActivitiesContent } from "./ActivitiesContent";

export default function ActivitiesPage() {
  return (
    <AppShell>
      <ActivitiesContent />
    </AppShell>
  );
}