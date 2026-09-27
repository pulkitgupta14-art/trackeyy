"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsContent } from "./SettingsContent";

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}