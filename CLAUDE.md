# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

FlowTask is a professional task management app with Pomodoro timer, daily planner, time tracking, recurring tasks, drag-and-drop, and keyboard shortcuts.

- **GitHub**: https://github.com/ZainnQureshii/flowtask
- **Live**: https://flowtask-cool-leaf-7076.fly.dev/
- **Fly.io app**: `flowtask-cool-leaf-7076` (Paris/cdg, auto-deploys on push to main)

## Commands

```bash
# Node PATH required for all commands (system Node is too old):
# PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Dev
pnpm dev                                        # frontend:5173 + backend:3001 in parallel
pnpm dev:frontend                               # vite only
pnpm dev:backend                                # tsx watch src/index.ts

# Build
pnpm build                                      # all packages (pnpm -r run build)
pnpm --filter frontend run build                # tsc -b && vite build
pnpm --filter frontend run preview              # vite preview of production build

# Typecheck (4 tsconfig projects)
pnpm typecheck                                  # all packages
npx tsc --noEmit -p tsconfig.json
npx tsc --noEmit -p packages/backend/tsconfig.json
npx tsc --noEmit -p packages/frontend/tsconfig.json
npx tsc --noEmit -p packages/shared/tsconfig.json

# Database
pnpm --filter backend run db:generate           # drizzle-kit generate
pnpm --filter backend run db:migrate            # drizzle-kit migrate

# Tests
pnpm --filter backend run test                  # vitest run (~129 tests)
pnpm --filter frontend run test                 # vitest run (~92 tests)
pnpm --filter backend run test:watch
pnpm --filter frontend run test:watch
pnpm --filter backend run test:coverage
pnpm --filter frontend run test:coverage
pnpm test:e2e                                   # playwright (~71 tests, workers:1, Chromium only)
pnpm test:mutation                              # stryker run
pnpm test:mutation:report                       # HTML report output to reports/

# Single test file
pnpm --filter backend run test -- src/__tests__/routes/tasks.test.ts
pnpm --filter frontend run test -- src/__tests__/stores/taskStore.test.ts
```

## Architecture

**pnpm monorepo** with three packages under `packages/`:

```
flowtask/
├── packages/
│   ├── shared/    # @flowtask/shared — Zod schemas + inferred TS types, no build step
│   ├── backend/   # @flowtask/backend — Hono 4 API, port 3001
│   └── frontend/  # React 19 SPA — Vite 6, port 5173
├── tsconfig.base.json   # strict, ES2022, bundler moduleResolution
├── Dockerfile           # 3-stage: frontend build → native better-sqlite3 → alpine prod
└── fly.toml
```

- **`shared/`** — TypeScript types (`types.ts`), Zod schemas (`schemas.ts`), constants (`constants.ts`). No build step — consumed via direct TS imports via `workspace:*`. Single source of truth for types/validation across backend and frontend.
- **`frontend/`** — React 19 SPA. Zustand 5 for state, Tailwind 4 + shadcn/ui (Radix), @dnd-kit, motion/react v12 + GSAP 3.14 for animations. `@` path alias maps to `src/`.
- **`backend/`** — Hono 4 on `@hono/node-server`, port 3001. SQLite via better-sqlite3 11 + Drizzle ORM 0.38. DB at `packages/backend/data/flowtask.db`. Migrations auto-run on startup.

**Data flow:** Frontend calls `/api/*` → Vite dev proxy → Hono routes → `parseBody(c, schema)` Zod validation → Drizzle query → `c.json({ data: result })`.

**Adding a new field:** `shared/src/types.ts` → `shared/src/schemas.ts` → `backend/src/db/schema.ts` → API route → frontend store.

**App routes:** `/` → TasksPage (eager), `/planner` → PlannerPage (lazy), `/settings` → SettingsPage (lazy). KanbanView + CalendarView are lazy sub-views within TasksPage, not top-level routes.

**Backend routes:** tasks, subtasks, tags, pomodoro, timeTracking, preferences, data (import/export), health.

## Environment

No `.env` files required.

| Variable | Dev default | Prod |
|---|---|---|
| `PORT` | 3001 | 8080 |
| `NODE_ENV` | development | production |
| `DATABASE_URL` | `./data/flowtask.db` | `/data/flowtask.db` |

## Deployment

Fly.io auto-deploys on every push to `main` — no manual `fly deploy` needed.

```bash
fly logs                   # Tail production logs
fly ssh console            # SSH into the running machine
fly status                 # Check machine health
fly volumes list           # Inspect persistent SQLite volume
```

**Dockerfile 3-stage build:**
1. Frontend built with Vite → static files in `packages/frontend/dist/`
2. Backend bundled with esbuild → `dist/server.mjs` (better-sqlite3 externalized, recompiled for Alpine)
3. Production image: backend serves API + frontend static files on port 8080 (no CORS needed)

In dev, Vite proxies `/api/*` to `localhost:3001`. In prod, backend serves the SPA with fallback to `index.html` for client-side routing.

**Persistent storage:** SQLite on Fly volume `flowtask_data` mounted at `/data` (1GB). First-time: `fly volumes create flowtask_data --region cdg --size 1`.

**Scales to zero:** `min_machines=0`, `auto_stop='stop'`, `auto_start=true` — cold starts possible.

## Design System

Defined entirely in `packages/frontend/src/index.css` via Tailwind 4 `@theme {}` — no `tailwind.config.js`.

**Brand:** FlowTask Violet (`--color-violet-*`, primary `#6D56D4` light / `#9E8AF5` dark).

**Fonts:** Inter (`--font-sans`, body) + Manrope (`--font-display`, headings) via Google Fonts.

**Semantic tokens** (use these, never raw hex):
- Backgrounds: `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-sidebar`
- Text: `--color-text-primary/secondary/tertiary/disabled`
- Borders: `--color-border`, `--color-border-subtle`, `--color-border-strong`, `--color-border-focus`
- Priority: `--color-p1` (Urgent/Red) through `--color-p4` (Low/Gray) + `*-muted` variants

Dark mode overrides only semantic tokens via `.dark` class on `<html>`.

**Breakpoints:** mobile `<768px`, tablet `768px+`, desktop `1024px+`, XL `1536px+`.

**Animation — two libraries, distinct responsibilities, never mix on the same element:**
- **motion/react v12** (`lib/motion.ts`): `AnimatePresence`, layout animations, gesture-driven. Import: `import { motion, AnimatePresence } from 'motion/react'` (NOT `'framer-motion'`).
- **GSAP 3.14** (`lib/gsap.ts`): multi-step timelines, `ScrollTrigger`. Registered once at module level. Auto-scales to 1000x for `prefers-reduced-motion`.

**Priority colors** (`lib/priority.ts`): use `getPriorityColor(priority)` — returns `color`, `muted`, `label`, and Tailwind arbitrary-value classes. Never hardcode priority colors.

**Toast** (`lib/toast.ts`): `toast.success/error/warning/info(message)`. Backed by `useToastStore` (Zustand), rendered by `<Toaster />` in `AppShell`.

## Key Patterns

**Backend routes** (`packages/backend/src/routes/`): `parseBody(c, schema)` → Drizzle query → `c.json({ data: result })`. All task responses hydrate relations (tags, subtasks, pomodoro, time entries) via `batchLoadRelations()` to prevent N+1 queries.

**Frontend stores** (`packages/frontend/src/stores/`, Zustand with `persist` middleware):
- `useTaskStore` — Optimistic updates: mutate local → fire API → reconcile or rollback on error.
- `useUIStore` — Theme applied via DOM class toggle + `onRehydrateStorage` hook.
- `useTimerStore` — Manages `setInterval` for Pomodoro and time tracking. Not persisted.

**API client** (`src/lib/api.ts`): Generic `request<T>()` wrapper that extracts `.data` from all responses. Fully typed with shared types.

**Bundle optimization** (`vite.config.ts`): vite-plugin-compression generates gzip + brotli. Manual chunk splitting: `react-vendor`, `motion-vendor`, `gsap-vendor`, `ui-vendor`, `dnd-vendor`, `router`. Main chunk: 225KB (was 866KB, -74%), gzip: 59KB (was 274KB, -78%).

## Database

8 SQLite tables in `packages/backend/src/db/schema.ts`: `tasks`, `subtasks`, `tags`, `task_tags`, `pomodoro_sessions`, `time_entries`, `recurring_configs`, `user_preferences`. FK cascade deletes, WAL mode + foreign keys enabled via pragmas.

Recurring task logic: when a task with `recurringConfig` is marked done, the PATCH `/api/tasks/:id` handler auto-generates the next occurrence (clones task + tags + subtasks + recurring config with new due date).

## Testing

**Backend** (`packages/backend/src/__tests__/routes/`): One file per route. Each test gets a fresh in-memory SQLite DB via `beforeEach` in `src/__tests__/helpers/setup.ts` — no mocks, real Drizzle queries.

**Frontend** (`packages/frontend/src/__tests__/`): Zustand stores, error states, utils, and one component. `jsdom` environment + `@testing-library/react`. `renderWithProviders()` wraps in `MemoryRouter`. MSW available for API mocking.

**E2E** (`e2e/`): 17 spec files (tasks, subtasks, tags, views, filters, calendar, pomodoro, timer, quick-capture, settings, a11y, visual regression). `workers: 1` required — tests share a single live SQLite DB. `fullyParallel: false`, Chromium only. Use `--ignore-snapshots` to skip visual regression during development.

**Mutation testing** targets `packages/backend/src/routes/tasks.ts` only — 57% score applies to that file. HTML report in `reports/`.

## Custom Skills (`.claude/commands/`)

19 slash commands — orchestrator context never runs code or reads files directly.

| Command | What it does |
|---|---|
| `/add-feature <desc>` | Plan-then-implement: design agent (plan mode) → approval → parallel backend/frontend/test agents → verification |
| `/fix-bug <desc>` | Investigate → fix → run tests + typecheck → report |
| `/qa` | Run backend, frontend, E2E in 3 parallel haiku agents; produces pass/fail table |
| `/status` | Full health: 4 tsc checks + all 3 test suites + git status |
| `/typecheck` | Run all 4 tsc checks; spawn fix agent only if errors found |
| `/review-code [ref]` | Code review against uncommitted changes or a git ref |
| `/verify-app` | 4-agent browser test: task CRUD, views/drag-drop, Pomodoro/time tracking, settings/filters |
| `/verify-deployed` | Smoke test against live Fly.io production URL |
| `/resume` | Save session state to `memory/current-work.md` for next session handoff |
| `/cleanup-agents` | Kill dead tmux panes; report stale team/task directories |
| `/check-patterns` | Analyze recent workflows; propose new skills to automate |
| `/add-endpoint <desc>` | Full vertical slice: shared types → Zod → route → DB → API client → store → tests |
| `/add-migration <desc>` | Schema change: types → Drizzle schema → generate → apply → update routes → verify |
| `/coverage [threshold]` | Coverage analysis + gap-filling; default threshold 70% |
| `/git-checkpoint [msg]` | Safe commit gated on green typecheck + tests |
| `/db-inspect [query]` | Read-only SQLite inspection — table counts, schema, ad-hoc SELECT |
| `/perf` | Bundle size analysis + test timing profiling |
| `/a11y` | axe-core accessibility audit across all views via Playwright |
| `/deploy` | Deploy to Fly.io, monitor for success, health-check live URL |

## Known Issues

- **Backend tests on Apple Silicon**: better-sqlite3 arm64/x86_64 native module mismatch — pre-existing infrastructure issue, not a code bug. Fix: delete `node_modules/.pnpm/better-sqlite3*` and run `pnpm install`.
- **E2E parallelism**: `workers: 1` is required — tests share a live SQLite DB and corrupt each other if parallelized.
