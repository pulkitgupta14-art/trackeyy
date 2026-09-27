"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Palette, Globe, Shield, LogOut, Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

interface SettingsItemBase {
  label: string;
  key: string;
}

interface InputItem extends SettingsItemBase {
  type: "input";
  placeholder: string;
  disabled?: boolean;
}

interface SelectItemConfig extends SettingsItemBase {
  type: "select";
  options: Array<string | { value: string | number; label: string }>;
  disabled?: boolean;
}

interface ThemeItem extends SettingsItemBase {
  type: "theme";
  options: Array<{ value: "light" | "dark" | "system"; label: string; icon: React.ComponentType<{ className?: string }> }>;
}

interface SwitchItem extends SettingsItemBase {
  type: "switch";
  description?: string;
}

interface ButtonItem extends SettingsItemBase {
  type: "button";
  action: () => void;
  variant?: ButtonVariant;
}

type SettingsItem = InputItem | SelectItemConfig | ThemeItem | SwitchItem | ButtonItem;

interface SettingsSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SettingsItem[];
}

export function SettingsContent() {
  const { theme, setTheme } = useUIStore();
  const { preferences, updatePreferences } = useUserStore();

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  const dateFormats = [
    { value: "YYYY-MM-DD" as const, label: "YYYY-MM-DD (2024-01-15)" },
    { value: "DD/MM/YYYY" as const, label: "DD/MM/YYYY (15/01/2024)" },
    { value: "MM/DD/YYYY" as const, label: "MM/DD/YYYY (01/15/2024)" },
  ];

  const timeFormats = [
    { value: "24h" as const, label: "24-hour (14:30)" },
    { value: "12h" as const, label: "12-hour (2:30 PM)" },
  ];

  const weekStartOptions = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
  ];

  const sections: SettingsSection[] = [
    {
      title: "Profile",
      icon: User,
      items: [
        {
          label: "Display Name",
          type: "input",
          placeholder: "Your name",
          key: "displayName",
        },
        {
          label: "Email",
          type: "input",
          placeholder: "you@example.com",
          disabled: true,
          key: "email",
        },
        {
          label: "Timezone",
          type: "select",
          options: ["UTC", "EST", "PST", "GMT", "CET", "JST"],
          key: "timezone",
        },
      ],
    },
    {
      title: "Appearance",
      icon: Palette,
      items: [
        {
          label: "Theme",
          type: "theme",
          options: themeOptions,
          key: "theme",
        },
        {
          label: "Compact Mode",
          type: "switch",
          description: "Reduce spacing for denser view",
          key: "compactMode",
        },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          label: "Push Notifications",
          type: "switch",
          description: "Receive habit reminders",
          key: "pushNotifications",
        },
        {
          label: "Email Notifications",
          type: "switch",
          description: "Weekly progress summaries",
          key: "emailNotifications",
        },
        {
          label: "Streak Alerts",
          type: "switch",
          description: "Notify when streak is at risk",
          key: "streakAlerts",
        },
      ],
    },
    {
      title: "Preferences",
      icon: Globe,
      items: [
        {
          label: "Date Format",
          type: "select",
          options: dateFormats,
          key: "dateFormat",
        },
        {
          label: "Time Format",
          type: "select",
          options: timeFormats,
          key: "timeFormat",
        },
        {
          label: "Week Starts On",
          type: "select",
          options: weekStartOptions,
          key: "weekStart",
        },
      ],
    },
    {
      title: "Data & Privacy",
      icon: Shield,
      items: [
        {
          label: "Export Data",
          type: "button",
          action: () => alert("Export functionality would go here"),
          variant: "outline",
          key: "exportData",
        },
        {
          label: "Delete Account",
          type: "button",
          variant: "destructive",
          action: () => confirm("Are you sure? This action cannot be undone.") && alert("Delete functionality would go here"),
          key: "deleteAccount",
        },
      ],
    },
  ];

  const handleSelectChange = (key: string, value: string | number) => {
    if (key === "theme") {
      setTheme(value as "light" | "dark" | "system");
    } else {
      updatePreferences({ [key]: value });
    }
  };

  const handleSwitchChange = (key: string, checked: boolean) => {
    if (key === "compactMode") {
      updatePreferences({ compactMode: checked });
    } else {
      updatePreferences({ [key]: checked });
    }
  };

  const getSelectValue = (key: string): string => {
    return (preferences[key as keyof typeof preferences] as string) || "";
  };

  const isItemDisabled = (item: SettingsItem): boolean => {
    return "disabled" in item && item.disabled === true;
  };

  const getItemDescription = (item: SettingsItem): string | undefined => {
    return "description" in item ? item.description : undefined;
  };

  return (
    <div className="page-section max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your preferences and account</p>
        </div>
      </div>

      {sections.map((section) => (
        <Card key={section.title} className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <section.icon className="h-5 w-5" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {section.items.map((item, index) => (
              <div key={`${section.title}-${index}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{item.label}</Label>
                  {getItemDescription(item) && <p className="text-xs text-muted-foreground mt-0.5">{getItemDescription(item)}</p>}
                </div>
                {item.type === "input" && (
                  <Input
                    placeholder={item.placeholder}
                    disabled={isItemDisabled(item)}
                    className="w-full sm:w-[200px]"
                  />
                )}
                {item.type === "select" && (
                  <Select
                    value={getSelectValue(item.key)}
                    onValueChange={(v) => handleSelectChange(item.key, v)}
                    disabled={isItemDisabled(item)}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {item.options.map((opt: string | { value: string | number; label: string }) => {
                        const value = typeof opt === "string" ? opt : opt.value;
                        const label = typeof opt === "string" ? opt : opt.label;
                        return (
                          <SelectItem key={String(value)} value={String(value)}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                {item.type === "theme" && (
                  <div className="flex items-center gap-2">
                    {item.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectChange(item.key, opt.value)}
                        className={cn(
                          "p-2 rounded-lg transition-colors flex items-center gap-2",
                          theme === opt.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                        )}
                        aria-pressed={theme === opt.value}
                      >
                        <opt.icon className="h-4 w-4" />
                        <span className="text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {item.type === "switch" && (
                  <Switch
                    checked={(preferences[item.key as keyof typeof preferences] as boolean) || false}
                    onCheckedChange={(checked) => handleSwitchChange(item.key, checked)}
                  />
                )}
                {item.type === "button" && (
                  <Button variant={item.variant || "outline"} size="sm" onClick={item.action}>
                    {item.label}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card className="card-hover border-destructive/20">
        <CardContent className="pt-4">
          <Button variant="destructive" onClick={() => alert("Sign out functionality")}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}