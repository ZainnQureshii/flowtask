# FlowTask - Productivity App Specification

## 1. Tech Stack

### Frontend
| Technology | Purpose | Rationale |
|---|---|---|
| **React 19** | UI framework | Largest ecosystem, best tooling, team familiarity. Hooks + concurrent features enable smooth UX for drag-and-drop and real-time timers. |
| **Vite 6** | Build tool / dev server | Sub-second HMR, fast builds. No SSR needed for a local-first productivity app, so Next.js would add unnecessary complexity. |
| **TypeScript 5.7** | Type safety | End-to-end type safety between frontend and backend. Catches bugs at compile time. |
| **Tailwind CSS 4** | Styling | Utility-first approach enables rapid UI development. Built-in dark mode support. Smaller bundle than component libraries. |
| **shadcn/ui** | Component primitives | Unstyled, accessible Radix UI primitives with Tailwind styling. Copy-paste model means no dependency lock-in. Includes dialog, dropdown, popover, tabs, calendar components we need. |
| **Zustand** | State management | Minimal boilerplate, TypeScript-first, supports middleware (persist, devtools). Simpler than Redux for this scale. Built-in `persist` middleware handles localStorage sync. |
| **@dnd-kit** | Drag and drop | Modern, accessible, performant. Built for React with hooks API. Supports sortable lists and transfer between containers (kanban columns). |
| **Framer Motion** | Animations | Declarative API, layout animations for reordering, exit animations for task completion. |
| **date-fns** | Date utilities | Tree-shakeable, immutable, TypeScript-native. Lighter than moment/dayjs for the operations we need. |
| **Lucide React** | Icons | Consistent icon set, tree-shakeable, active maintenance. |
| **React Router 7** | Routing | Client-side routing between views (list, kanban, calendar, settings). |
| **cmdk** | Command palette | Proven command palette component (used by Vercel, Linear). Handles Ctrl+K quick-capture UX. |

### Backend
| Technology | Purpose | Rationale |
|---|---|---|
| **Hono** | HTTP framework | Ultra-lightweight (14KB), TypeScript-first, fast. Built-in middleware for CORS, logger. Simpler than Express for a focused API. |
| **better-sqlite3** | Database | Synchronous API (simpler than async for local-first), excellent performance, zero-config. Single file database = easy backup/export. |
| **Drizzle ORM** | Database toolkit | TypeScript-first, generates types from schema. Lightweight (no heavy runtime like Prisma). SQL-like query builder keeps us close to the metal. |
| **Zod** | Validation | Runtime schema validation for API inputs. Integrates with TypeScript types so validation schemas and types stay in sync. |
| **tsx** | Dev runtime | Runs TypeScript directly in Node.js for development. |

### Monorepo Tooling
| Technology | Purpose | Rationale |
|---|---|---|
| **pnpm workspaces** | Package management | Fast installs, strict dependency isolation, built-in workspace support. |
| **shared package** | Shared types | Single source of truth for TypeScript interfaces, Zod schemas, and constants used by both frontend and backend. |

---

## 2. Project Structure

```
flowtask/
├── package.json                  # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json            # Shared TS config
├── SPEC.md
├── README.md
│
├── packages/
│   ├── shared/                   # Shared types, schemas, constants
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts          # All TypeScript interfaces
│   │       ├── schemas.ts        # Zod validation schemas
│   │       ├── constants.ts      # Status/priority enums, defaults
│   │       └── utils.ts          # Shared utility functions
│   │
│   ├── frontend/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── index.html
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── index.css              # Tailwind directives + global styles
│   │       ├── lib/
│   │       │   ├── api.ts             # API client (fetch wrapper)
│   │       │   ├── utils.ts           # Frontend utilities (cn, formatDate)
│   │       │   └── hooks/
│   │       │       ├── useTasks.ts        # Task CRUD operations
│   │       │       ├── usePomodoro.ts     # Pomodoro timer logic
│   │       │       ├── useTimeTracking.ts # Time tracking logic
│   │       │       ├── useKeyboard.ts     # Keyboard shortcut bindings
│   │       │       └── useTheme.ts        # Theme toggle + system detection
│   │       ├── stores/
│   │       │   ├── taskStore.ts       # Zustand store for tasks
│   │       │   ├── uiStore.ts         # UI state (active view, modals, sidebar)
│   │       │   └── timerStore.ts      # Pomodoro + time tracking state
│   │       ├── components/
│   │       │   ├── ui/                # shadcn/ui primitives
│   │       │   │   ├── button.tsx
│   │       │   │   ├── input.tsx
│   │       │   │   ├── dialog.tsx
│   │       │   │   ├── dropdown-menu.tsx
│   │       │   │   ├── popover.tsx
│   │       │   │   ├── badge.tsx
│   │       │   │   ├── calendar.tsx
│   │       │   │   ├── tabs.tsx
│   │       │   │   ├── select.tsx
│   │       │   │   ├── checkbox.tsx
│   │       │   │   ├── tooltip.tsx
│   │       │   │   ├── progress.tsx
│   │       │   │   └── separator.tsx
│   │       │   ├── layout/
│   │       │   │   ├── AppShell.tsx        # Main layout wrapper
│   │       │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │       │   │   ├── Header.tsx          # Top bar with search + actions
│   │       │   │   └── MobileNav.tsx       # Bottom nav for mobile
│   │       │   ├── tasks/
│   │       │   │   ├── TaskCard.tsx        # Single task display
│   │       │   │   ├── TaskForm.tsx        # Create/edit task form
│   │       │   │   ├── TaskDetail.tsx      # Full task detail panel
│   │       │   │   ├── SubtaskList.tsx     # Subtask checklist
│   │       │   │   ├── TaskFilters.tsx     # Filter bar component
│   │       │   │   └── QuickCapture.tsx    # Ctrl+K modal (uses cmdk)
│   │       │   ├── views/
│   │       │   │   ├── ListView.tsx        # Table/list view
│   │       │   │   ├── KanbanView.tsx      # Kanban board
│   │       │   │   ├── KanbanColumn.tsx    # Single kanban column
│   │       │   │   ├── CalendarView.tsx    # Calendar month view
│   │       │   │   └── DailyPlanner.tsx    # Day planner view
│   │       │   ├── productivity/
│   │       │   │   ├── PomodoroTimer.tsx   # Pomodoro widget
│   │       │   │   ├── TimeTracker.tsx     # Time tracking display
│   │       │   │   └── StatsPanel.tsx      # Productivity stats
│   │       │   ├── tags/
│   │       │   │   ├── TagBadge.tsx        # Colored tag display
│   │       │   │   ├── TagPicker.tsx       # Tag selection popover
│   │       │   │   └── TagManager.tsx      # CRUD tags in settings
│   │       │   └── settings/
│   │       │       ├── SettingsPanel.tsx   # Settings page
│   │       │       ├── ThemeToggle.tsx     # Dark/light/system toggle
│   │       │       └── ImportExport.tsx    # JSON import/export
│   │       └── pages/
│   │           ├── TasksPage.tsx       # Main tasks view (list/kanban/calendar)
│   │           ├── PlannerPage.tsx     # Daily planner
│   │           └── SettingsPage.tsx    # Settings
│   │
│   └── backend/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts               # Server entry point
│           ├── db/
│           │   ├── connection.ts       # SQLite connection setup
│           │   ├── schema.ts          # Drizzle table definitions
│           │   └── migrate.ts         # Migration runner
│           ├── routes/
│           │   ├── tasks.ts           # Task CRUD routes
│           │   ├── subtasks.ts        # Subtask routes
│           │   ├── tags.ts            # Tag routes
│           │   ├── pomodoro.ts        # Pomodoro session routes
│           │   ├── timeTracking.ts    # Time entry routes
│           │   ├── preferences.ts     # User preferences routes
│           │   └── data.ts            # Import/export routes
│           └── middleware/
│               └── validate.ts        # Zod validation middleware
```

---

## 3. Data Models

### Enums & Constants

```typescript
// packages/shared/src/constants.ts

export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  ARCHIVED: 'archived',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const Priority = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const RecurrenceType = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;
export type RecurrenceType = (typeof RecurrenceType)[keyof typeof RecurrenceType];

export const ViewMode = {
  LIST: 'list',
  KANBAN: 'kanban',
  CALENDAR: 'calendar',
} as const;
export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode];

export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export const TASK_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
] as const;

export const DEFAULT_POMODORO = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
} as const;
```

### TypeScript Interfaces

```typescript
// packages/shared/src/types.ts

export interface Task {
  id: string;                          // ULID (sortable, unique)
  title: string;
  description: string;                 // Markdown-supported
  status: TaskStatus;
  priority: Priority;
  color: string | null;                // Hex color from TASK_COLORS
  dueDate: string | null;             // ISO 8601 date string
  position: number;                    // Sort order within status group
  tags: Tag[];                         // Associated tags
  subtasks: Subtask[];                 // Nested checklist items
  recurringConfig: RecurringConfig | null;
  pomodoroSessions: PomodoroSession[]; // Completed pomodoro sessions
  timeEntries: TimeEntry[];            // Manual time tracking entries
  totalTimeSpent: number;              // Computed: sum of all time in seconds
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;                    // Sort order
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;                        // Unique, lowercase
  color: string;                       // Hex color
}

export interface TaskTag {
  taskId: string;
  tagId: string;
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  startedAt: string;                   // ISO 8601
  endedAt: string | null;             // ISO 8601, null if in progress
  durationMinutes: number;             // Configured work duration
  completed: boolean;                  // Did user finish the full session?
  type: 'work' | 'short_break' | 'long_break';
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startedAt: string;                   // ISO 8601
  endedAt: string | null;             // null if timer is running
  durationSeconds: number;             // Computed or manual
  note: string;                        // Optional description of work done
}

export interface RecurringConfig {
  id: string;
  taskId: string;
  type: RecurrenceType;
  interval: number;                    // e.g., 3 for "every 3 days"
  daysOfWeek: number[] | null;        // 0=Sun..6=Sat, for weekly type
  dayOfMonth: number | null;          // 1-31, for monthly type
  nextOccurrence: string;             // ISO 8601 date of next creation
  lastGenerated: string | null;       // Last time a recurring instance was created
}

export interface UserPreferences {
  id: string;                          // Always "default" (single user)
  theme: Theme;
  defaultView: ViewMode;
  defaultPriority: Priority;
  pomodoroWorkMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroSessionsBeforeLongBreak: number;
  sidebarCollapsed: boolean;
  showCompletedTasks: boolean;
  updatedAt: string;
}

// --- API Request/Response Types ---

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  color?: string | null;
  dueDate?: string | null;
  tagIds?: string[];
  recurringConfig?: Omit<RecurringConfig, 'id' | 'taskId' | 'lastGenerated'> | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  color?: string | null;
  dueDate?: string | null;
  position?: number;
  tagIds?: string[];
  recurringConfig?: Omit<RecurringConfig, 'id' | 'taskId' | 'lastGenerated'> | null;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  tagIds?: string[];
  search?: string;                     // Full-text search on title + description
  dueDateFrom?: string;
  dueDateTo?: string;
  hasTimeEntries?: boolean;
}

export interface ReorderInput {
  taskId: string;
  newStatus?: TaskStatus;              // For cross-column kanban moves
  newPosition: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  tasks: Task[];
  tags: Tag[];
  preferences: UserPreferences;
}
```

---

## 4. API Contracts

Base URL: `http://localhost:3001/api`

All responses follow the shape: `{ data: T }` for success, `{ error: string }` for errors.

### Tasks

| Method | Path | Description | Request Body | Response | Query Params |
|--------|------|-------------|-------------|----------|-------------|
| `GET` | `/tasks` | List tasks with filters | - | `{ data: Task[], total: number }` | `status`, `priority`, `tagIds`, `search`, `dueDateFrom`, `dueDateTo`, `page`, `pageSize`, `sortBy`, `sortOrder` |
| `GET` | `/tasks/:id` | Get single task with relations | - | `{ data: Task }` | - |
| `POST` | `/tasks` | Create task | `CreateTaskInput` | `{ data: Task }` | - |
| `PATCH` | `/tasks/:id` | Update task | `UpdateTaskInput` | `{ data: Task }` | - |
| `DELETE` | `/tasks/:id` | Delete task and relations | - | `{ data: { success: true } }` | - |
| `POST` | `/tasks/reorder` | Reorder / move tasks | `{ items: ReorderInput[] }` | `{ data: { success: true } }` | - |

### Subtasks

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/tasks/:taskId/subtasks` | List subtasks | - | `{ data: Subtask[] }` |
| `POST` | `/tasks/:taskId/subtasks` | Create subtask | `{ title: string }` | `{ data: Subtask }` |
| `PATCH` | `/subtasks/:id` | Update subtask | `{ title?: string, completed?: boolean, position?: number }` | `{ data: Subtask }` |
| `DELETE` | `/subtasks/:id` | Delete subtask | - | `{ data: { success: true } }` |
| `POST` | `/tasks/:taskId/subtasks/reorder` | Reorder subtasks | `{ items: { id: string, position: number }[] }` | `{ data: { success: true } }` |

### Tags

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/tags` | List all tags | - | `{ data: Tag[] }` |
| `POST` | `/tags` | Create tag | `{ name: string, color: string }` | `{ data: Tag }` |
| `PATCH` | `/tags/:id` | Update tag | `{ name?: string, color?: string }` | `{ data: Tag }` |
| `DELETE` | `/tags/:id` | Delete tag (removes from all tasks) | - | `{ data: { success: true } }` |

### Pomodoro

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/tasks/:taskId/pomodoro` | List sessions for task | - | `{ data: PomodoroSession[] }` |
| `POST` | `/tasks/:taskId/pomodoro/start` | Start a pomodoro session | `{ type: 'work' \| 'short_break' \| 'long_break', durationMinutes: number }` | `{ data: PomodoroSession }` |
| `PATCH` | `/pomodoro/:id/complete` | Mark session completed | `{ completed: boolean }` | `{ data: PomodoroSession }` |
| `DELETE` | `/pomodoro/:id` | Delete a session | - | `{ data: { success: true } }` |

### Time Tracking

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/tasks/:taskId/time-entries` | List time entries for task | - | `{ data: TimeEntry[] }` |
| `POST` | `/tasks/:taskId/time-entries/start` | Start timer | `{ note?: string }` | `{ data: TimeEntry }` |
| `PATCH` | `/time-entries/:id/stop` | Stop timer | - | `{ data: TimeEntry }` |
| `POST` | `/tasks/:taskId/time-entries` | Add manual entry | `{ durationSeconds: number, note?: string, startedAt?: string }` | `{ data: TimeEntry }` |
| `DELETE` | `/time-entries/:id` | Delete entry | - | `{ data: { success: true } }` |

### Preferences

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/preferences` | Get user preferences | - | `{ data: UserPreferences }` |
| `PATCH` | `/preferences` | Update preferences | `Partial<UserPreferences>` | `{ data: UserPreferences }` |

### Data Import/Export

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/data/export` | Export all data as JSON | - | `{ data: ExportData }` |
| `POST` | `/data/import` | Import data from JSON | `ExportData` | `{ data: { tasksImported: number, tagsImported: number } }` |

---

## 5. Feature Specifications

### 5.1 Smart Task Organization

**Priorities**
- Four levels: Urgent (red pulse icon), High (orange), Medium (yellow), Low (gray)
- Urgent tasks display a subtle pulsing indicator and sort to top by default
- Priority is selectable via dropdown in task form and inline via right-click context menu

**Tags**
- User-created labels with custom colors
- Multiple tags per task
- Tag picker in task form uses a searchable popover
- Tags display as colored badges on task cards
- Filter sidebar shows all tags with task counts

**Color Coding**
- Optional per-task color accent (left border stripe on task card)
- 8 preset colors from TASK_COLORS palette
- Selectable via color dot picker in task form

**Subtasks**
- Checkbox-based checklist within each task
- Progress indicator shows "3/5 completed" on parent task card
- Drag to reorder within the subtask list
- Inline editing: click to edit title, Enter to save, Escape to cancel
- "Add subtask" input always visible at bottom of subtask list

### 5.2 Multiple Views

**List View (default)**
- Tabular layout with columns: checkbox, title, priority badge, tags, due date, time tracked
- Click row to open task detail panel (slide-in from right)
- Sortable columns: title, priority, due date, created date, time tracked
- Bulk selection: checkbox per row, bulk actions bar (delete, change status, change priority)
- Grouping: optionally group by status, priority, or due date

**Kanban Board**
- Columns: Todo | In Progress | Done | Archived
- Cards show: title, priority badge, tags (max 3 + overflow count), due date, subtask progress
- Drag cards between columns (updates status)
- Drag cards within column to reorder (updates position)
- Column headers show task count
- "Add task" button at bottom of each column (pre-fills status)

**Calendar View**
- Month grid showing tasks by due date
- Day cells show up to 3 task titles + "+N more" overflow
- Click day to see all tasks for that date in a popover
- Click task to open task detail
- Drag task between days to change due date
- Today highlighted with accent color
- Navigation: prev/next month, "Today" button

### 5.3 Productivity Tools

**Pomodoro Timer**
- Floating widget in bottom-right corner (collapsible)
- States: idle, work (25 min), short break (5 min), long break (15 min)
- Visual: circular progress ring with time remaining in center
- After 4 work sessions, automatically suggests long break
- Audio notification (optional) when session ends
- Browser notification when session ends (with permission)
- Links to current task: select which task you're working on
- Session history recorded per task
- Configurable durations in settings

**Time Tracking**
- Per-task stopwatch: start/stop button on task card and detail view
- Running timer displays in header bar with task title
- Only one timer can run at a time (starting new one stops current)
- Manual entry: add time entries with duration and optional note
- Task card shows total time tracked in human-readable format (e.g., "2h 15m")
- Time entries list in task detail with individual notes and durations

**Daily Planner**
- "Today" view showing tasks due today + manually added tasks
- Time-block layout: 24-hour vertical timeline
- Drag tasks onto time blocks to schedule
- Unscheduled section at top for tasks without time blocks
- Shows Pomodoro sessions and time entries on timeline
- Quick stats: tasks completed today, total focus time, pomodoros completed

### 5.4 Recurring Tasks

- Configure recurrence when creating/editing a task
- Recurrence types:
  - **Daily**: every N days (default: 1)
  - **Weekly**: specific days of the week (e.g., Mon, Wed, Fri)
  - **Monthly**: specific day of month (e.g., 15th)
  - **Custom**: every N days
- When a recurring task is marked "done", the system automatically creates the next occurrence with:
  - Same title, description, priority, tags, and color
  - New due date based on recurrence config
  - Status reset to "todo"
  - Empty subtasks (same titles, all unchecked)
- Recurring tasks display a repeat icon on the task card
- Recurring config shown in task detail with next occurrence date

### 5.5 Quick Capture (Ctrl+K / Cmd+K)

- Global keyboard shortcut opens command palette overlay
- Powered by cmdk library for fuzzy search UX
- Modes:
  1. **Quick add** (default): type task title, press Enter to create with default settings
     - Supports inline syntax: `Buy groceries !high #shopping @tomorrow`
       - `!urgent` / `!high` / `!medium` / `!low` sets priority
       - `#tagname` adds tag (creates if doesn't exist)
       - `@today` / `@tomorrow` / `@next-week` / `@YYYY-MM-DD` sets due date
  2. **Search**: prefix with `/` to search existing tasks
  3. **Commands**: prefix with `>` for app commands (e.g., `>toggle theme`, `>export data`, `>go to kanban`)

### 5.6 Search and Filters

**Search**
- Search bar in header: searches task titles and descriptions
- Debounced (300ms) for performance
- Results highlight matched text
- Search persists across view switches

**Filters**
- Filter bar below header (collapsible)
- Filter by:
  - Status: multi-select checkboxes (todo, in_progress, done, archived)
  - Priority: multi-select checkboxes
  - Tags: multi-select tag picker
  - Due date: date range picker (from/to)
  - Has time entries: toggle
- Active filters shown as removable chips
- "Clear all" button when any filter is active
- Filter state persists in URL query params for shareability
- Saved filter presets (optional stretch goal)

### 5.7 Drag and Drop

- Implemented with @dnd-kit for accessibility (keyboard support, screen reader announcements)
- **Kanban**: drag cards between columns and within columns
- **List view**: drag to reorder tasks
- **Subtasks**: drag to reorder within task
- **Calendar**: drag tasks between days
- Visual feedback:
  - Drag overlay follows cursor with reduced opacity
  - Drop target highlighted with dashed border
  - Smooth layout animation when items shift position
- Optimistic updates: UI updates immediately, API call in background
- Conflict resolution: if API reorder fails, revert UI with toast notification

### 5.8 Theme System

- Three modes: Light, Dark, System (auto-detect)
- System mode uses `prefers-color-scheme` media query with listener for real-time changes
- Toggle in header (sun/moon icon) and settings page
- CSS variables on `:root` / `.dark` for all colors
- Tailwind `darkMode: 'class'` strategy
- Theme preference saved to backend + localStorage (localStorage for instant load, backend for persistence)
- Smooth transition between themes (150ms on background-color, color)

### 5.9 Data Persistence & Import/Export

**Persistence**
- Primary: SQLite database via backend API
- Fallback: Zustand persist middleware writes to localStorage as cache
- On startup: frontend fetches from API, falls back to localStorage if API unavailable

**Export**
- "Export Data" button in settings
- Exports complete JSON with all tasks, tags, preferences
- File saved as `flowtask-export-YYYY-MM-DD.json`
- Includes schema version for forward compatibility

**Import**
- "Import Data" button in settings
- File picker accepts `.json` files
- Preview dialog shows: N tasks, N tags to import
- Options: "Merge with existing" or "Replace all data"
- Validates JSON structure before import
- Error reporting for invalid data

---

## 6. Component Architecture

### Layout Components

**`AppShell`** - Root layout wrapper
- Props: `children: ReactNode`
- Renders Sidebar, Header, main content area, PomodoroTimer widget
- Handles responsive layout: sidebar → drawer on mobile (< 768px)

**`Sidebar`** - Navigation + filter sidebar
- State: `collapsed: boolean` from uiStore
- Sections:
  - Navigation links (Tasks, Planner, Settings) with icons
  - View switcher (List / Kanban / Calendar)
  - Tags list with counts, click to filter
  - "Add tag" inline input
- Collapsible on desktop, drawer on mobile

**`Header`** - Top bar
- Left: page title, view toggle buttons
- Center: search input
- Right: running timer indicator, theme toggle, quick-add button

**`MobileNav`** - Bottom navigation bar (< 768px)
- Tab icons: Tasks, Planner, Timer, Settings

### Task Components

**`TaskCard`** - Individual task display
- Props: `task: Task`, `variant: 'list' | 'kanban'`, `onSelect: () => void`
- Displays: color stripe, checkbox (toggle status to done), title, priority badge, tag badges, due date, subtask progress, time tracked
- Kanban variant: compact card layout
- List variant: single row with columns
- Context menu on right-click: edit, delete, change priority, change status

**`TaskForm`** - Create/edit task dialog
- Props: `task?: Task` (edit mode if provided), `defaultStatus?: TaskStatus`, `onSave: (input) => void`, `onCancel: () => void`
- Fields: title (required), description (textarea with markdown preview), priority select, status select, color picker, due date picker, tag picker, recurrence config
- Validation: title required, min 1 char

**`TaskDetail`** - Full task detail slide-in panel
- Props: `taskId: string`, `onClose: () => void`
- Opens from right side (400px wide, full height)
- Shows all task fields, inline editable
- Tabs: Details, Subtasks, Time Tracking, Pomodoro History
- Action buttons: start timer, start pomodoro, delete task

**`SubtaskList`** - Sortable subtask checklist
- Props: `taskId: string`, `subtasks: Subtask[]`
- Renders draggable checkbox items
- Inline editing on click
- Add subtask input at bottom
- Progress bar at top

**`TaskFilters`** - Filter bar
- Props: none (reads/writes filter state from URL + store)
- Renders filter controls in a collapsible horizontal bar
- Active filter chips with remove buttons

**`QuickCapture`** - Command palette modal
- Props: none (global, triggered by keyboard shortcut)
- Uses cmdk for fuzzy search
- Parses inline syntax for priority, tags, due date

### View Components

**`ListView`** - Table/list view
- Props: `tasks: Task[]`
- Sortable columns, selectable rows
- Bulk action bar appears on selection
- Groups tasks by chosen grouping (status/priority/none)

**`KanbanView`** - Kanban board
- Props: `tasks: Task[]`
- Renders 4 `KanbanColumn` components
- @dnd-kit DndContext wrapping all columns

**`KanbanColumn`** - Single kanban column
- Props: `status: TaskStatus`, `tasks: Task[]`
- Droppable container with SortableContext
- Column header with count and add button

**`CalendarView`** - Month calendar
- Props: `tasks: Task[]`
- 7-column grid, weeks as rows
- Day cells with task previews
- Navigation for prev/next month

**`DailyPlanner`** - Day planner view
- Props: none (reads today's date, fetches tasks)
- 24-hour timeline with task blocks
- Unscheduled tasks section
- Stats summary

### Productivity Components

**`PomodoroTimer`** - Floating timer widget
- Props: none (reads from timerStore)
- Position: fixed bottom-right
- Collapsible to minimal view (just time + play/pause)
- Expanded view: circular progress, session type, task name, controls

**`TimeTracker`** - Time tracking display in task detail
- Props: `taskId: string`, `timeEntries: TimeEntry[]`
- Start/stop button, manual entry form
- List of entries with notes and durations
- Total time summary

**`StatsPanel`** - Productivity statistics
- Props: none (computed from task/timer data)
- Daily/weekly stats: tasks completed, focus time, pomodoro sessions
- Simple bar chart for weekly view

### State Management (Zustand Stores)

**`taskStore`**
```typescript
interface TaskStore {
  tasks: Task[];
  tags: Tag[];
  filters: TaskFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (items: ReorderInput[]) => Promise<void>;

  // Subtask actions
  createSubtask: (taskId: string, title: string) => Promise<Subtask>;
  updateSubtask: (id: string, input: Partial<Subtask>) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;

  // Tag actions
  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;

  // Filter actions
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
}
```

**`timerStore`**
```typescript
interface TimerStore {
  // Pomodoro
  pomodoroState: 'idle' | 'work' | 'short_break' | 'long_break';
  pomodoroTaskId: string | null;
  pomodoroTimeRemaining: number;  // seconds
  pomodoroSessionCount: number;
  isPomodoroRunning: boolean;

  // Time tracking
  activeTimeEntry: TimeEntry | null;
  isTimeTrackingRunning: boolean;

  // Pomodoro actions
  startPomodoro: (taskId: string) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  skipPomodoro: () => void;
  resetPomodoro: () => void;

  // Time tracking actions
  startTimeTracking: (taskId: string) => Promise<void>;
  stopTimeTracking: () => Promise<void>;
}
```

**`uiStore`**
```typescript
interface UIStore {
  theme: Theme;
  activeView: ViewMode;
  sidebarCollapsed: boolean;
  selectedTaskId: string | null;
  isQuickCaptureOpen: boolean;
  isTaskFormOpen: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setActiveView: (view: ViewMode) => void;
  toggleSidebar: () => void;
  selectTask: (id: string | null) => void;
  toggleQuickCapture: () => void;
  openTaskForm: (defaultValues?: Partial<CreateTaskInput>) => void;
  closeTaskForm: () => void;
}
```

---

## 7. Quality Standards

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- No `any` types - use `unknown` + type guards where needed
- Shared types package ensures frontend/backend type consistency
- Zod schemas as single source of truth for runtime validation

### Responsive Design
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Mobile (< 768px): bottom nav, drawer sidebar, stacked layout, full-width cards
- Tablet (768px - 1024px): collapsible sidebar, adapted kanban (horizontal scroll)
- Desktop (> 1024px): persistent sidebar, full kanban, split-pane task detail

### Accessibility
- All interactive elements keyboard-focusable with visible focus rings
- ARIA labels on icon-only buttons
- @dnd-kit provides keyboard drag-and-drop (Space to pick up, arrows to move, Space to drop)
- Color is never the sole indicator (always paired with icon or text)
- Sufficient contrast ratios (WCAG AA minimum)
- Screen reader announcements for: task created, task completed, timer started/ended, drag operations
- Skip-to-content link
- Respect `prefers-reduced-motion` for animations

### Animations
- Framer Motion for:
  - `layout` prop on task cards for smooth reorder transitions
  - `AnimatePresence` for task creation/deletion (fade + slide)
  - Page transitions between views (crossfade)
  - Pomodoro timer progress ring animation
  - Sidebar expand/collapse
- Keep all animations under 300ms for snappy feel
- Disable animations when `prefers-reduced-motion: reduce`

### Performance
- Virtualize long task lists with `@tanstack/react-virtual` if > 100 tasks visible
- Debounce search input (300ms)
- Optimistic updates for all mutations (revert on failure)
- Lazy load CalendarView and DailyPlanner (React.lazy + Suspense)
- SQLite indexes on: `tasks.status`, `tasks.priority`, `tasks.due_date`, `tasks.created_at`

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open quick capture |
| `Ctrl/Cmd + N` | New task |
| `Ctrl/Cmd + /` | Toggle sidebar |
| `Escape` | Close modal / deselect task |
| `1` / `2` / `3` | Switch view (list / kanban / calendar) |
| `Ctrl/Cmd + D` | Toggle dark mode |
| `Delete` / `Backspace` | Delete selected task (with confirmation) |

---

## 8. Database Schema (SQLite / Drizzle)

```typescript
// packages/backend/src/db/schema.ts

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  color: text('color'),
  dueDate: text('due_date'),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const subtasks = sqliteTable('subtasks', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
});

export const taskTags = sqliteTable('task_tags', {
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

export const pomodoroSessions = sqliteTable('pomodoro_sessions', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  durationMinutes: integer('duration_minutes').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  type: text('type').notNull(),  // 'work' | 'short_break' | 'long_break'
});

export const timeEntries = sqliteTable('time_entries', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  note: text('note').notNull().default(''),
});

export const recurringConfigs = sqliteTable('recurring_configs', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  interval: integer('interval').notNull().default(1),
  daysOfWeek: text('days_of_week'),    // JSON array string: "[1,3,5]"
  dayOfMonth: integer('day_of_month'),
  nextOccurrence: text('next_occurrence').notNull(),
  lastGenerated: text('last_generated'),
});

export const userPreferences = sqliteTable('user_preferences', {
  id: text('id').primaryKey().default('default'),
  theme: text('theme').notNull().default('system'),
  defaultView: text('default_view').notNull().default('list'),
  defaultPriority: text('default_priority').notNull().default('medium'),
  pomodoroWorkMinutes: integer('pomodoro_work_minutes').notNull().default(25),
  pomodoroShortBreakMinutes: integer('pomodoro_short_break_minutes').notNull().default(5),
  pomodoroLongBreakMinutes: integer('pomodoro_long_break_minutes').notNull().default(15),
  pomodoroSessionsBeforeLongBreak: integer('pomodoro_sessions_before_long_break').notNull().default(4),
  sidebarCollapsed: integer('sidebar_collapsed', { mode: 'boolean' }).notNull().default(false),
  showCompletedTasks: integer('show_completed_tasks', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});
```

---

## 9. Development Scripts

```json
{
  "scripts": {
    "dev": "pnpm --parallel -r run dev",
    "dev:frontend": "pnpm --filter frontend run dev",
    "dev:backend": "pnpm --filter backend run dev",
    "build": "pnpm -r run build",
    "typecheck": "pnpm -r run typecheck",
    "lint": "pnpm -r run lint"
  }
}
```

- Frontend dev: `vite` (port 5173, proxies `/api` to backend)
- Backend dev: `tsx watch src/index.ts` (port 3001)
- Database file location: `packages/backend/data/flowtask.db` (auto-created)
