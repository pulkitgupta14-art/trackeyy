import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserPreferences {
  timezone: string;
  locale: string;
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
  timeFormat: "24h" | "12h";
  weekStart: 0 | 1; // 0 = Sunday, 1 = Monday
  compactMode: boolean;
  showStreaks: boolean;
  showProgressRings: boolean;
  defaultView: "today" | "habits" | "calendar";
}

interface UserStore {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  timezone: "UTC",
  locale: "en",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  weekStart: 0,
  compactMode: false,
  showStreaks: true,
  showProgressRings: true,
  defaultView: "today",
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      resetPreferences: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: "trackeyy-user",
    }
  )
);