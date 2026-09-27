export const HABIT_FREQUENCIES = [
  { value: "DAILY", label: "Daily", description: "Every day" },
  { value: "WEEKDAYS", label: "Weekdays", description: "Monday to Friday" },
  { value: "WEEKENDS", label: "Weekends", description: "Saturday and Sunday" },
  { value: "WEEKLY", label: "Weekly", description: "Once per week" },
  { value: "CUSTOM_DAYS", label: "Custom days", description: "Select specific days" },
  { value: "INTERVAL", label: "Every N days", description: "Repeat every X days" },
  { value: "MONTHLY", label: "Monthly", description: "Same date each month" },
  { value: "MULTI_DAILY", label: "Multiple times daily", description: "Several times per day" },
] as const;

export const HABIT_TYPES = [
  { value: "BOOLEAN", label: "Yes/No", description: "Simple completion", unit: "" },
  { value: "NUMBER", label: "Number", description: "Count or quantity", unit: "count" },
  { value: "DURATION", label: "Duration", description: "Time spent", unit: "minutes" },
  { value: "DISTANCE", label: "Distance", description: "Distance covered", unit: "km" },
  { value: "QUANTITY", label: "Quantity", description: "Custom measurable unit", unit: "units" },
] as const;

export const ACTIVITY_TYPES = [
  { value: "GYM", label: "Gym", icon: "dumbbell", color: "#ef4444" },
  { value: "RUNNING", label: "Running", icon: "footprints", color: "#f97316" },
  { value: "WALKING", label: "Walking", icon: "footprints", color: "#84cc16" },
  { value: "CYCLING", label: "Cycling", icon: "bike", color: "#06b6d4" },
  { value: "BADMINTON", label: "Badminton", icon: "trophy", color: "#ec4899" },
  { value: "STUDYING", label: "Studying", icon: "book-open", color: "#3b82f6" },
  { value: "CODING", label: "Coding", icon: "code", color: "#8b5cf6" },
  { value: "READING", label: "Reading", icon: "book", color: "#10b981" },
  { value: "MEDITATION", label: "Meditation", icon: "brain", color: "#f43f5e" },
  { value: "CUSTOM", label: "Custom", icon: "plus-circle", color: "#6366f1" },
] as const;

export const DEFAULT_CATEGORIES = [
  { name: "Fitness", icon: "dumbbell", color: "#ef4444" },
  { name: "Study", icon: "book-open", color: "#3b82f6" },
  { name: "Health", icon: "heart", color: "#10b981" },
  { name: "Sports", icon: "trophy", color: "#f97316" },
  { name: "Work", icon: "briefcase", color: "#8b5cf6" },
  { name: "Personal", icon: "user", color: "#ec4899" },
  { name: "Learning", icon: "graduation-cap", color: "#06b6d4" },
  { name: "Finance", icon: "dollar-sign", color: "#84cc16" },
  { name: "Lifestyle", icon: "coffee", color: "#f43f5e" },
] as const;

export const UNITS = [
  "minutes",
  "hours",
  "km",
  "miles",
  "pages",
  "reps",
  "sets",
  "liters",
  "ml",
  "cups",
  "count",
  "times",
  "problems",
  "sessions",
] as const;

export const WEEKDAYS = [
  { value: 0, label: "Sun", full: "Sunday" },
  { value: 1, label: "Mon", full: "Monday" },
  { value: 2, label: "Tue", full: "Tuesday" },
  { value: 3, label: "Wed", full: "Wednesday" },
  { value: 4, label: "Thu", full: "Thursday" },
  { value: 5, label: "Fri", full: "Friday" },
  { value: 6, label: "Sat", full: "Saturday" },
] as const;

export const APP_NAME = "Trackeyy";
export const APP_DESCRIPTION = "Track habits, routines, and activities in one place";