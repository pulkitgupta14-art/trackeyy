# Trackeyy - Technical Architecture Plan

## Project Overview
Trackeyy is a production-grade personal habit, routine, activity, and productivity tracking platform built with modern web technologies.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: 
  - Server State: TanStack Query (React Query)
  - Client State: Zustand (lightweight)
  - Form State: React Hook Form + Zod
- **UI Components**: Custom design system (Headless UI / Radix UI primitives)
- **Charts**: Recharts (lightweight, tree-shakeable)
- **Date Handling**: date-fns + date-fns-tz
- **Validation**: Zod (shared schemas)

### Backend
- **API**: Next.js API Routes (App Router route handlers)
- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: Prisma Client
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Validation**: Zod (shared with frontend)

### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Database Migrations**: Prisma Migrate

---

## Database Schema (Prisma)

```prisma
// Core enums
enum HabitFrequency {
  DAILY
  WEEKLY
  WEEKDAYS
  WEEKENDS
  CUSTOM_DAYS
  INTERVAL
  MONTHLY
  MULTI_DAILY
}

enum HabitType {
  BOOLEAN
  NUMBER
  DURATION
  DISTANCE
  QUANTITY
}

enum HabitStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum ActivityType {
  GYM
  RUNNING
  WALKING
  CYCLING
  BADMINTON
  STUDYING
  CODING
  READING
  MEDITATION
  CUSTOM
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  PAUSED
  FAILED
}

enum ReminderFrequency {
  DAILY
  WEEKLY
  CUSTOM
}

// User & Auth
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  image         String?
  timezone      String    @default("UTC")
  locale        String    @default("en")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  accounts      Account[]
  sessions      Session[]
  habits        Habit[]
  activities    Activity[]
  goals         Goal[]
  categories    Category[]
  reminders     Reminder[]
  preferences   NotificationPreference?
  dailySummaries DailySummary[]
  
  @@index([email])
}

// NextAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// Categories
model Category {
  id          String   @id @default(cuid())
  userId      String
  name        String
  icon        String?
  color       String   @default("#6366f1")
  isDefault   Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  habits      Habit[]

  @@unique([userId, name])
  @@index([userId])
}

// Habits
model Habit {
  id              String         @id @default(cuid())
  userId          String
  categoryId      String?
  name            String
  description     String?        @db.Text
  icon            String?
  color           String         @default("#6366f1")
  type            HabitType      @default(BOOLEAN)
  frequency       HabitFrequency @default(DAILY)
  customDays      Int[]          // Bitmask for custom days (0-6)
  intervalDays    Int?           // For INTERVAL frequency
  timesPerDay     Int?           // For MULTI_DAILY frequency
  targetValue     Float?         // For quantitative habits
  unit            String?        // "liters", "hours", "km", "pages", "reps", "minutes"
  startDate       DateTime       @default(now())
  endDate         DateTime?
  reminderTime    String?        // HH:mm format
  reminderEnabled Boolean        @default(false)
  status          HabitStatus    @default(ACTIVE)
  sortOrder       Int            @default(0)
  archivedAt      DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Relations
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  category        Category?      @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  completions     HabitCompletion[]
  schedules       HabitSchedule[]
  goalLinks       GoalHabit[]

  @@index([userId, status])
  @@index([userId, categoryId])
}

// Habit Schedule (for complex recurring patterns)
model HabitSchedule {
  id        String   @id @default(cuid())
  habitId   String
  dayOfWeek Int      // 0-6 (Sunday-Saturday)
  time      String?  // HH:mm for specific time habits
  habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, dayOfWeek, time])
  @@index([habitId])
}

// Habit Completion (historical record)
model HabitCompletion {
  id            String   @id @default(cuid())
  habitId       String
  userId        String
  date          DateTime // Date only (timezone-aware)
  completedAt   DateTime @default(now())
  value         Float?   // For quantitative habits (partial progress)
  note          String?  @db.Text
  habit         Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([habitId, date]) // Prevent duplicate completions per day
  @@index([userId, date])
  @@index([habitId, date])
}

// Activities (detailed tracking)
model Activity {
  id          String       @id @default(cuid())
  userId      String
  type        ActivityType
  customType  String?      // For CUSTOM type
  name        String?
  startTime   DateTime
  endTime     DateTime?
  duration    Int?         // Minutes (calculated if endTime exists)
  distance    Float?       // km
  quantity    Float?       // Generic quantity
  unit        String?      // Unit for quantity
  notes       String?      @db.Text
  rating      Int?         // 1-5
  date        DateTime     // Date only for calendar grouping
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  workout     Workout?
  studySession StudySession?
  goalLinks   GoalActivity[]

  @@index([userId, date])
  @@index([userId, type])
  @@index([userId, startTime])
}

// Gym/Workout Tracking
model Workout {
  id          String   @id @default(cuid())
  activityId  String   @unique
  name        String?  // e.g., "Push Day", "Leg Day"
  notes       String?  @db.Text
  activity    Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  exercises   Exercise[]

  @@index([activityId])
}

model Exercise {
  id          String   @id @default(cuid())
  workoutId   String
  name        String
  sortOrder   Int      @default(0)
  notes       String?
  workout     Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  sets        WorkoutSet[]

  @@index([workoutId])
}

model WorkoutSet {
  id          String   @id @default(cuid())
  exerciseId  String
  setNumber   Int
  weight      Float?   // kg or lbs
  reps        Int?
  duration    Int?     // seconds (for timed exercises)
  distance    Float?   // For cardio
  isPR        Boolean  @default(false) // Personal Record
  isWarmup    Boolean  @default(false)
  exercise    Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)

  @@index([exerciseId])
}

// Study Tracking
model StudySession {
  id          String   @id @default(cuid())
  activityId  String   @unique
  subject     String
  topic       String?
  goalMinutes Int?
  activity    Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)

  @@index([activityId])
}

// Goals
model Goal {
  id              String      @id @default(cuid())
  userId          String
  name            String
  description     String?     @db.Text
  targetValue     Float
  currentValue    Float       @default(0)
  unit            String      // "hours", "times", "km", "pages", "problems"
  deadline        DateTime
  status          GoalStatus  @default(ACTIVE)
  autoCalculate   Boolean     @default(true) // Calculate from linked habits/activities
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  completedAt     DateTime?

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  habitLinks      GoalHabit[]
  activityLinks   GoalActivity[]

  @@index([userId, status])
  @@index([userId, deadline])
}

model GoalHabit {
  id        String @id @default(cuid())
  goalId    String
  habitId   String
  weight    Float  @default(1) // How much this habit contributes
  goal      Goal   @relation(fields: [goalId], references: [id], onDelete: Cascade)
  habit     Habit  @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([goalId, habitId])
  @@index([goalId])
  @@index([habitId])
}

model GoalActivity {
  id        String   @id @default(cuid())
  goalId    String
  activityId String
  weight    Float    @default(1)
  goal      Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
  activity  Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)

  @@unique([goalId, activityId])
  @@index([goalId])
  @@index([activityId])
}

// Reminders
model Reminder {
  id            String           @id @default(cuid())
  userId        String
  habitId       String?
  title         String
  message       String?
  time          String           // HH:mm
  frequency     ReminderFrequency @default(DAILY)
  customDays    Int[]            // For CUSTOM frequency
  isEnabled     Boolean          @default(true)
  quietHoursStart String?        // HH:mm
  quietHoursEnd   String?        // HH:mm
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  habit         Habit?           @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@index([userId, isEnabled])
}

// Notification Preferences
model NotificationPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  emailEnabled    Boolean  @default(true)
  pushEnabled     Boolean  @default(true)
  reminderEnabled Boolean  @default(true)
  goalEnabled     Boolean  @default(true)
  streakEnabled   Boolean  @default(true)
  weeklyReport    Boolean  @default(true)
  quietHoursStart String?  // HH:mm
  quietHoursEnd   String?  // HH:mm
  timezone        String   @default("UTC")
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Daily Summary (pre-computed for analytics performance)
model DailySummary {
  id              String   @id @default(cuid())
  userId          String
  date            DateTime // Date only
  habitsTotal     Int      @default(0)
  habitsCompleted Int      @default(0)
  habitsSkipped   Int      @default(0)
  activitiesCount Int      @default(0)
  activityMinutes Int      @default(0)
  studyMinutes    Int      @default(0)
  workoutMinutes  Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId, date])
}
```

---

## API Architecture

### Route Structure
```
/api
  /auth
    [...nextauth]/route.ts
  /habits
    GET    - List habits (with filters, pagination)
    POST   - Create habit
    /[id]
      GET    - Get habit detail
      PATCH  - Update habit
      DELETE - Archive/Delete habit
      /completions
        GET    - Get completions for habit
        POST   - Create completion
        /[date]
          DELETE - Remove completion
  /activities
    GET    - List activities (with filters, pagination)
    POST   - Create activity
    /[id]
      GET    - Get activity detail
      PATCH  - Update activity
      DELETE - Delete activity
    /types - Get activity types
  /goals
    GET    - List goals
    POST   - Create goal
    /[id]
      GET    - Get goal detail
      PATCH  - Update goal
      DELETE - Delete goal
      /progress - Get goal progress
  /calendar
    GET    - Get calendar data for month/week
  /analytics
    GET    - Get analytics data (with query params for range, type)
    /streaks - Get streak data
    /heatmap - Get calendar heatmap data
  /insights
    GET    - Get generated insights
  /reminders
    GET    - List reminders
    POST   - Create reminder
    /[id]
      PATCH  - Update reminder
      DELETE - Delete reminder
  /preferences
    GET    - Get notification preferences
    PATCH  - Update notification preferences
  /categories
    GET    - List categories
    POST   - Create category
    /[id]
      PATCH  - Update category
      DELETE - Delete category
```

---

## Frontend Architecture

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   │   ├── login/
│   │   ├── register/
│   │   └── onboarding/
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   ├── page.tsx       # Dashboard home
│   │   ├── today/
│   │   ├── habits/
│   │   ├── calendar/
│   │   ├── analytics/
│   │   ├── goals/
│   │   ├── activities/
│   │   ├── insights/
│   │   └── settings/
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Design system primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── dropdown.tsx
│   │   ├── toast.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── layout/            # Layout components
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   ├── TopBar.tsx
│   │   └── PageHeader.tsx
│   ├── habits/            # Habit-specific components
│   │   ├── HabitCard.tsx
│   │   ├── HabitList.tsx
│   │   ├── HabitForm.tsx
│   │   ├── HabitCalendar.tsx
│   │   ├── StreakIndicator.tsx
│   │   └── ProgressRing.tsx
│   ├── activities/        # Activity components
│   │   ├── ActivityCard.tsx
│   │   ├── ActivityForm.tsx
│   │   ├── WorkoutForm.tsx
│   │   └── StudyForm.tsx
│   ├── goals/             # Goal components
│   │   ├── GoalCard.tsx
│   │   ├── GoalForm.tsx
│   │   └── GoalProgress.tsx
│   ├── calendar/          # Calendar components
│   │   ├── MonthView.tsx
│   │   ├── WeekView.tsx
│   │   ├── DayView.tsx
│   │   └── CalendarHeatmap.tsx
│   ├── analytics/         # Analytics components
│   │   ├── CompletionChart.tsx
│   │   ├── CategoryBreakdown.tsx
│   │   ├── StreakChart.tsx
│   │   └── StatCards.tsx
│   ├── insights/          # Insight components
│   │   └── InsightCard.tsx
│   └── common/            # Shared components
│       ├── EmptyState.tsx
│       ├── LoadingState.tsx
│       ├── ErrorState.tsx
│       ├── ConfirmDialog.tsx
│       └── QuickAdd.tsx
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client
│   ├── utils.ts           # Utility functions
│   ├── date.ts            # Date/time utilities
│   ├── streak.ts          # Streak calculation engine
│   ├── validation/        # Zod schemas
│   │   ├── habit.ts
│   │   ├── activity.ts
│   │   ├── goal.ts
│   │   └── ...
│   └── constants.ts       # App constants
├── hooks/                 # Custom React hooks
│   ├── useHabits.ts
│   ├── useActivities.ts
│   ├── useGoals.ts
│   ├── useAnalytics.ts
│   ├── useReminders.ts
│   └── useLocalStorage.ts
├── stores/                # Zustand stores
│   ├── uiStore.ts         # UI state (sidebar, modals, toasts)
│   └── userStore.ts       # User preferences
├── types/                 # TypeScript types
│   ├── habit.ts
│   ├── activity.ts
│   ├── goal.ts
│   └── api.ts
└── styles/
    └── design-system.css  # CSS variables for design system
```

---

## Design System Specification

### Color Palette
```css
:root {
  /* Brand */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-light: #eef2ff;
  --color-primary-dark: #3730a3;
  
  /* Neutral */
  --color-bg: #fafafa;
  --color-bg-secondary: #ffffff;
  --color-bg-tertiary: #f4f4f5;
  --color-border: #e4e4e7;
  --color-border-strong: #d4d4d8;
  
  /* Text */
  --color-text: #18181b;
  --color-text-secondary: #71717a;
  --color-text-tertiary: #a1a1aa;
  --color-text-inverse: #fafafa;
  
  /* Semantic */
  --color-success: #16a34a;
  --color-success-light: #dcfce7;
  --color-warning: #eab308;
  --color-warning-light: #fef9c3;
  --color-error: #dc2626;
  --color-error-light: #fee2e2;
  --color-info: #0ea5e9;
  --color-info-light: #e0f2fe;
  
  /* Category Colors */
  --color-fitness: #ef4444;
  --color-study: #3b82f6;
  --color-health: #10b981;
  --color-sports: #f97316;
  --color-work: #8b5cf6;
  --color-personal: #ec4899;
  --color-learning: #06b6d4;
  --color-finance: #84cc16;
  --color-lifestyle: #f43f5e;
}
```

### Typography Scale
```css
:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing System
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### Border Radius
```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;
}
```

### Shadows
```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

### Breakpoints
```css
:root {
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
  --bp-2xl: 1536px;
}
```

---

## Key Business Logic

### Streak Calculation Engine
```typescript
// Core streak logic (server-side)
interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0-1
  weeklyConsistency: number; // 0-1
  monthlyConsistency: number; // 0-1
}

function calculateStreak(
  completions: Date[],
  frequency: HabitFrequency,
  customDays?: number[],
  intervalDays?: number,
  startDate: Date,
  timezone: string
): StreakResult {
  // Implementation handles:
  // - Daily: consecutive calendar days
  // - Weekly: at least once per week
  // - Weekdays: Mon-Fri
  // - Weekends: Sat-Sun
  // - Custom days: specific weekdays
  // - Interval: every N days
  // - Multi-daily: multiple times per day
  // - Timezone-aware date boundaries
}
```

### Habit Scheduling
```typescript
function getHabitsForDate(
  habits: Habit[],
  date: Date,
  timezone: string
): Habit[] {
  // Returns habits that are due on the given date
  // Considers: frequency, custom days, interval, start/end dates, status
}
```

### Quantitative Progress
```typescript
interface ProgressResult {
  value: number;
  target: number;
  percentage: number; // 0-100
  isComplete: boolean;
}

function calculateProgress(
  habit: Habit,
  completions: HabitCompletion[],
  date: Date
): ProgressResult {
  // For BOOLEAN: 0 or 100%
  // For NUMBER/DURATION/DISTANCE/QUANTITY: sum of values / target
}
```

### Goal Progress Calculation
```typescript
function calculateGoalProgress(goal: Goal): number {
  if (!goal.autoCalculate) return goal.currentValue;
  
  // Sum progress from linked habits (weighted)
  // Sum progress from linked activities (weighted)
  // Return calculated value
}
```

---

## Authentication Flow

1. **Email/Password**: Credentials provider with bcrypt hashing
2. **OAuth**: Google, GitHub providers ready
3. **Session**: JWT strategy with 30-day expiry
4. **Middleware**: Protect all `/dashboard/*` routes
5. **Onboarding**: First-time users redirected to setup flow

---

## State Management Strategy

### Server State (TanStack Query)
- Habits, Activities, Goals, Analytics, Insights
- Cached with appropriate stale times
- Optimistic updates for mutations

### Client State (Zustand)
- UI state: sidebar open/closed, active modals, toasts
- User preferences: theme, timezone, view mode
- Form draft state (before submission)

---

## Performance Considerations

1. **Database Indexes**: On all foreign keys and common query columns
2. **Pagination**: All list endpoints paginated (default 20, max 100)
3. **Pre-computed Analytics**: DailySummary table updated via triggers/cron
4. **Code Splitting**: Route-level and component-level
5. **Image Optimization**: Next.js Image component
6. **Caching**: API responses cached with appropriate headers

---

## Security Measures

1. **Authentication**: NextAuth.js with secure defaults
2. **Authorization**: Every API route validates user ownership
3. **Input Validation**: Zod schemas on all inputs (client + server)
4. **SQL Injection**: Prisma parameterized queries
5. **XSS Prevention**: React auto-escaping + CSP headers
6. **CSRF Protection**: NextAuth.js built-in
7. **Rate Limiting**: On auth endpoints and mutations
8. **Data Isolation**: All queries scoped to userId

---

## Testing Strategy

### Unit Tests (Vitest)
- Streak calculation engine
- Habit scheduling logic
- Progress calculations
- Date/time utilities
- Validation schemas

### Integration Tests
- API route handlers
- Database operations
- Authentication flows

### E2E Tests (Playwright)
- User registration + onboarding
- Habit creation + completion
- Activity logging
- Goal creation + progress
- Calendar navigation
- Mobile responsive behavior

---

## Deployment Architecture

### Development
- SQLite database (file-based)
- Local Next.js dev server
- pnpm for package management

### Production
- PostgreSQL (managed: Neon, Supabase, or Railway)
- Vercel deployment
- Environment variables for secrets
- Prisma migrations in CI/CD

---

## Phase Implementation Order

### Phase 1: Foundation (Week 1)
- [ ] Next.js + TypeScript + Tailwind setup
- [ ] Prisma schema + migrations
- [ ] NextAuth.js configuration
- [ ] Basic project structure

### Phase 2: Design System (Week 1-2)
- [ ] CSS variables + Tailwind config
- [ ] Primitive components (Button, Input, Card, Modal, etc.)
- [ ] Layout components (AppShell, Sidebar, TopBar)
- [ ] Responsive navigation

### Phase 3: Habit Engine (Week 2-3)
- [ ] Habit CRUD API
- [ ] Habit scheduling logic
- [ ] Completion API with duplicate prevention
- [ ] Streak calculation
- [ ] Habit UI components

### Phase 4: Today Page (Week 3)
- [ ] Today view with quick completion
- [ ] Daily progress visualization
- [ ] Upcoming habits
- [ ] Quick add modal

### Phase 5: Activities (Week 3-4)
- [ ] Activity CRUD API
- [ ] Workout tracking (exercises, sets)
- [ ] Study session tracking
- [ ] Activity UI components

### Phase 6: Goals (Week 4)
- [ ] Goal CRUD API
- [ ] Auto-calculation from habits/activities
- [ ] Goal progress UI

### Phase 7: Calendar (Week 4-5)
- [ ] Month/Week/Day views
- [ ] Calendar heatmap
- [ ] Date detail view

### Phase 8: Analytics (Week 5)
- [ ] Completion charts
- [ ] Streak visualization
- [ ] Category breakdown
- [ ] Pre-computed summaries

### Phase 9: Insights & Reminders (Week 5-6)
- [ ] Insight generation engine
- [ ] Reminder system
- [ ] Notification preferences

### Phase 10: Polish (Week 6)
- [ ] Empty states
- [ ] Error handling
- [ ] Loading states
- [ ] Accessibility audit
- [ ] Mobile optimization
- [ ] Performance profiling
- [ ] E2E tests

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Trackeyy"
```

---

## Success Criteria

The application is complete when a new user can:
1. ✅ Create an account
2. ✅ Complete onboarding
3. ✅ Create a habit with schedule
4. ✅ Mark habit complete (boolean + quantitative)
5. ✅ Track activities (gym, study, etc.)
6. ✅ Create goals linked to habits/activities
7. ✅ View calendar history
8. ✅ View analytics and streaks
9. ✅ Receive reminders
10. ✅ Edit/archive/delete habits
11. ✅ Use comfortably on mobile
12. ✅ Understand progress without instructions