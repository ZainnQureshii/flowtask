# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Node PATH required for all commands (system Node is too old):
# PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

pnpm install              # Install all workspace dependencies
pnpm dev                  # Start frontend (5173) + backend (3001) in parallel
pnpm dev:frontend         # Frontend only
pnpm dev:backend          # Backend only
pnpm --filter frontend run preview # Vite preview of production build
pnpm build                # Build all packages
pnpm typecheck            # TypeScript check across all packages (runs tsc --noEmit in each package)

# Backend-specific
pnpm --filter backend run db:generate   # Generate Drizzle migrations
pnpm --filter backend run db:migrate    # Apply migrations

# Testing
pnpm --filter backend run test          # Backend unit tests (~129 tests)
pnpm --filter backend run test:watch    # Backend tests in watch mode
pnpm --filter backend run test:coverage # Backend coverage report
pnpm --filter frontend run test         # Frontend unit tests (~92 tests)
pnpm --filter frontend run test:watch   # Frontend tests in watch mode
pnpm --filter frontend run test:coverage # Frontend coverage report
pnpm test:e2e                           # E2E Playwright tests (~71 tests, workers:1, Chromium only)
pnpm test:mutation                      # Stryker mutation testing
pnpm test:mutation:report               # Generate HTML mutation testing report

# Run a single test file
pnpm --filter backend run test -- src/__tests__/routes/tasks.test.ts
pnpm --filter frontend run test -- src/__tests__/stores/taskStore.test.ts

# TypeScript check per package (4 tsconfigs)
npx tsc --noEmit -p tsconfig.json
npx tsc --noEmit -p packages/backend/tsconfig.json
npx tsc --noEmit -p packages/frontend/tsconfig.json
npx tsc --noEmit -p packages/shared/tsconfig.json

# Standalone browser test scripts (Playwright, manual/ad-hoc)
node test-productivity.mjs        # Productivity feature tests
node test-views.js                # View/drag-drop tests
```

## Architecture

**pnpm monorepo** with three packages under `packages/`:

- **`shared/`** (`@flowtask/shared`) — TypeScript types (`types.ts`), Zod validation schemas (`schemas.ts`), constants/enums (`constants.ts`). No build step — consumed via direct TS imports. This is the single source of truth for types and validation used by both frontend and backend.
- **`frontend/`** — React 19 SPA built with Vite 6. Zustand for state, Tailwind 4 + shadcn/ui for styling, @dnd-kit for drag-and-drop, motion/react v12 + GSAP for animations. Uses `@` path alias mapped to `src/`.
- **`backend/`** — Hono REST API on port 3001. SQLite via better-sqlite3 + Drizzle ORM. DB file at `packages/backend/data/flowtask.db`. Migrations run automatically on startup.

**Data flow:** Frontend calls `/api/*` → Vite dev proxy forwards to `localhost:3001` → Hono routes validate with Zod → query SQLite via Drizzle → respond with `{ data: T }`.

**Adding a new field:** Update in order: `shared/src/types.ts` → `shared/src/schemas.ts` → `backend/src/db/schema.ts` (Drizzle table) → API route → frontend store.

**Proxy config:** `packages/frontend/vite.config.ts` — `/api` path is proxied to `localhost:3001`.

**tsconfig:** All package tsconfigs extend `tsconfig.base.json` (strict: true, ES2022, bundler module resolution).

**Workspace:** Defined in `pnpm-workspace.yaml` — `packages: ['packages/*']`.

## Environment

No `.env` files required. Key env vars in production:
- `PORT` — defaults to 3001 (dev), set to 8080 in production (Fly.io)
- `NODE_ENV` — when `production`, backend serves frontend static files and uses `/data/flowtask.db` (Fly volume)
- Dev DB path: `packages/backend/data/flowtask.db`

## Deployment

Deployed on Fly.io: https://flowtask-cool-leaf-7076.fly.dev/

```bash
fly deploy                              # Build Docker image + deploy
fly logs                                # Tail production logs
fly ssh console                         # SSH into the running machine
fly status                              # Check machine health
fly volumes list                        # Inspect persistent SQLite volume
```

**Architecture in production**: The Dockerfile uses a 3-stage build:
1. Frontend built with Vite → static files in `packages/frontend/dist/`
2. Backend bundled with esbuild → single `dist/server.mjs` (better-sqlite3 externalized as native module)
3. Production image: backend serves both API routes and frontend static files on port 8080

In dev, Vite proxies `/api/*` to the backend. In production, the backend serves the frontend SPA directly with a fallback to `index.html` for client-side routing.

**Persistent storage**: SQLite DB lives on a Fly volume (`flowtask_data` mounted at `/data`). First-time setup requires: `fly volumes create flowtask_data --region cdg --size 1`

**Auto-deploy**: Fly.io GitHub integration auto-deploys on push to main.

## Design System

Defined entirely in `packages/frontend/src/index.css` via Tailwind 4 `@theme` — no separate config file.

**Brand:** FlowTask Violet (`--color-violet-*`, primary is `#6D56D4` light / `#9E8AF5` dark).

**Fonts:** Inter (`--font-sans`, body) + Manrope (`--font-display`, headings). Both loaded via Google Fonts. JetBrains Mono for code.

**Semantic tokens** (use these, never raw hex):
- Backgrounds: `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-sidebar`
- Text: `--color-text-primary/secondary/tertiary/disabled`
- Borders: `--color-border`, `--color-border-subtle`, `--color-border-strong`, `--color-border-focus`
- Priority: `--color-p1` (Urgent/Red) through `--color-p4` (Low/Gray) + `*-muted` variants

Dark mode overrides only semantic tokens — aliases cascade automatically. Apply with `.dark` class on `<html>`.

**Breakpoints:** mobile `<768px`, tablet `768px+`, desktop `1024px+`, XL `1536px+`. Layout vars: `--sidebar-width: 240px`, `--detail-panel-width: 340px`, `--header-height: 56px`, `--bottom-nav-height: 64px`.

**Animation framework** — two libraries, distinct responsibilities. Never mix both on the same element:
- **motion/react v12** (`lib/motion.ts`): `AnimatePresence`, layout animations, gesture-driven. Import via `import { motion, AnimatePresence } from 'motion/react'`. Use presets: `fadeIn`, `slideInRight`, `slideUpModal`, `slideUpSheet`, `taskEnter`, `sidebarCollapse`, `noMotion` (reduced-motion fallback).
- **GSAP** (`lib/gsap.ts`): multi-step timelines, `ScrollTrigger`. Registered once at module level with global `power2.out` / `0.2s` defaults. Automatically time-scales to 1000x when `prefers-reduced-motion` is set.

**Priority colors** (`lib/priority.ts`): use `getPriorityColor(priority)` or `PRIORITY_COLORS[priority]` — returns `color`, `muted`, `label`, and Tailwind arbitrary-value classes (`twBorder`, `twText`, `twBg`). Never hardcode priority colors.

**Toast** (`lib/toast.ts`): call `toast.success/error/warning/info(message)` anywhere. Backed by `useToastStore` (Zustand). Rendered by `<Toaster />` in `AppShell`. Errors auto-dismiss after 6s, warnings after 8s, others after 4s.

**Layout components** (`components/layout/`): `AppShell` composes `Sidebar` + `Header` + `MobileNav`. `MobileNav` is a bottom sheet tab bar rendered only on `<768px` (hidden on desktop via CSS).

## Key Patterns

**Backend routes** (`packages/backend/src/routes/`): Zod schema → `parseBody(c, schema)` middleware → Drizzle query → `c.json({ data: result })`. All task responses include hydrated relations (tags, subtasks, pomodoro sessions, time entries) via `batchLoadRelations()` to avoid N+1 queries.

**Frontend stores** (`packages/frontend/src/stores/`, Zustand with `persist` middleware):
- `useTaskStore` — Optimistic updates: mutate local state immediately, reconcile or rollback on API response.
- `useUIStore` — Theme applied via DOM class toggle + `onRehydrateStorage` hook.
- `useTimerStore` — Manages `setInterval` for Pomodoro and time tracking. Not persisted.

**API client** (`src/lib/api.ts`) — Generic `request<T>()` wrapper that extracts `.data` from all responses. All methods are fully typed with shared types.

**Lazy routes**: PlannerPage, SettingsPage, KanbanView, and CalendarView are lazy-loaded via `React.lazy()` in `App.tsx` for code splitting. TasksPage is eager (default route).

**Bundle config** (`vite.config.ts`): vite-plugin-compression generates gzip + brotli pre-compressed assets. Manual chunk splitting: `react-vendor`, `motion-vendor`, `gsap-vendor`, `ui-vendor`, `dnd-vendor`, `router`. Bundle metrics: main chunk 225KB (was 866KB, -74%), gzip 59KB (was 274KB, -78%).

## Database

8 SQLite tables defined in `packages/backend/src/db/schema.ts`: tasks, subtasks, tags, task_tags, pomodoro_sessions, time_entries, recurring_configs, user_preferences. Foreign keys use `onDelete: 'cascade'`. SQLite pragmas: WAL mode + foreign keys enabled.

Recurring task logic: when a task with `recurringConfig` is marked "done", the PATCH `/api/tasks/:id` handler auto-generates the next occurrence (clones task, tags, subtasks, and recurring config with new due date).

## Testing

**Backend tests** (`packages/backend/src/__tests__/routes/`): One file per route — `tasks`, `subtasks`, `tags`, `pomodoro`, `timeTracking`, `preferences`, `data`, `health`. Each test file gets a fresh in-memory SQLite DB via `beforeEach` in `src/__tests__/helpers/setup.ts` (no mocks — tests use real Drizzle queries). Exports `testDb`, `testSqlite`, `ApiResponse<T>`, `SuccessResponse`, `ErrorResponse`.

**Frontend tests** (`packages/frontend/src/__tests__/`): Zustand stores (`taskStore`, `uiStore`, `timerStore`), error states, utils, and one component (`QuickCapture`). Use `jsdom` environment + `@testing-library/react`. `renderWithProviders()` helper wraps in `MemoryRouter`. MSW (`msw`) is available for API mocking.

**E2E tests** (`e2e/`): 17 spec files covering tasks, subtasks, tags, views, filters, calendar, pomodoro, timer, quick-capture, settings, accessibility, visual regression, kebab actions. Playwright config: `workers: 1` (cannot increase — tests share state via the running SQLite DB), `fullyParallel: false`, Chromium only, auto-starts both dev servers. Run with `--ignore-snapshots` to skip visual regression comparisons during development.

**Mutation testing** (`pnpm test:mutation`): Targets only `packages/backend/src/routes/tasks.ts` — the 57% mutation score applies to that file only. HTML report output goes to `reports/`.

## Custom Skills (`.claude/commands/`)

19 slash commands available. All spawn agents — orchestrator context never runs code or reads files directly.

| Command | What it does |
|---|---|
| `/add-feature <desc>` | Plan-then-implement workflow: design agent in plan mode → user approval → parallel backend/frontend/test agents → verification agent |
| `/fix-bug <desc>` | Investigate → fix → run backend + frontend tests + typecheck → report |
| `/qa` | Run backend, frontend, and E2E test suites in 3 parallel haiku agents; produces pass/fail table |
| `/status` | Full health report: 4 tsc checks + all 3 test suites + git status |
| `/typecheck` | Run all 4 tsc checks; spawn fix agent only if errors found |
| `/review-code [ref]` | Code review against uncommitted changes (or a git ref); checks bugs, security, types, error handling, test coverage |
| `/verify-app` | 4-agent browser test covering task CRUD, views/drag-drop, productivity features (Pomodoro, time tracking, subtasks), and settings/filters |
| `/verify-deployed` | 2-agent smoke test against live Fly.io production URL — checks HTTP status, API endpoints, frontend render, and no JS errors |
| `/resume` | Saves current session state to `memory/current-work.md` for seamless handoff to next session |
| `/cleanup-agents` | Kills dead tmux panes; reports stale team/task directories |
| `/check-patterns` | Analyzes recent workflows and proposes new skills to automate |
| `/add-endpoint <desc>` | Full vertical slice: shared types → Zod → route → DB → API client → store → tests (5-agent team with DAG dependencies) |
| `/add-migration <desc>` | Database schema change: types → Drizzle schema → generate migration → apply → update routes → verify (2-agent team) |
| `/coverage [threshold]` | Test coverage analysis + optional gap-filling; default threshold 70% |
| `/git-checkpoint [msg]` | Safe commit gated on green typecheck + tests; generates conventional commit message |
| `/db-inspect [query]` | Read-only SQLite inspection — table counts, schema, or ad-hoc SELECT queries |
| `/perf` | Bundle size analysis + test timing profiling with recommendations |
| `/a11y` | axe-core accessibility audit across all views via Playwright |
| `/deploy` | Deploy to Fly.io, monitor for success, and health-check the live production URL |

## Known Issues

- `better-sqlite3` native module must match the host architecture (arm64 on Apple Silicon). If the backend fails on startup with an architecture mismatch, delete `node_modules/.pnpm/better-sqlite3*` and run `pnpm install` to rebuild.
- E2E tests must run with `workers: 1` — tests share a single live SQLite DB and will corrupt each other if parallelized.


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 21, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #1042 | 7:07 AM | 🔵 | FlowTask tech stack specification reviewed | ~563 |
| #995 | 6:06 AM | ✅ | FlowTask SPEC.md completed by researcher agent | ~451 |

### Feb 23, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #1189 | 2:54 AM | 🔵 | FlowTask Implementation Patterns and Development Guide | ~410 |
| #1188 | " | 🔵 | FlowTask App Specification Reviewed | ~473 |
</claude-mem-context>