# FlowTask

A local-first productivity suite with intelligent task management, Kanban boards, Pomodoro timer, and time tracking.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-local--first-003B57?logo=sqlite&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-monorepo-F69220?logo=pnpm&logoColor=white)

---

## Overview

FlowTask is a local-first task management application that keeps all data on-device via SQLite — no account required, no cloud dependency. It combines flexible task organization (List, Kanban, Calendar views) with built-in productivity tooling: a Pomodoro timer, automatic time tracking, and focus sessions. The stack is a typed end-to-end TypeScript monorepo with a React 19 frontend and a Hono API backend, backed by 292+ tests across unit, integration, and E2E layers.

---

## Key Features

**Task Management**
- Full CRUD with priorities, tags, and subtask nesting
- Recurring tasks with configurable schedules
- Quick Capture with inline syntax parsing (dates, priorities, tags from plain text)

**Views**
- List view with sorting and filtering
- Kanban board with drag-and-drop column management
- Calendar view for date-based scheduling

**Productivity**
- Pomodoro timer with configurable work and break intervals
- Time tracking — manual entry and automatic session recording
- Focus sessions linked to tasks

**Data & UX**
- Local-first SQLite storage — no account, no sync service
- Import and export support
- Optimistic UI updates for a snappy experience

**Developer Experience**
- End-to-end type safety via Zod schemas shared between frontend and backend
- 292+ tests: unit (Vitest), E2E (Playwright), accessibility (axe-core), visual regression, MSW error state coverage
- 17 Claude Code automation skills in `.claude/commands/`

---

## Architecture

```
packages/
  shared/      # Zod schemas, TypeScript types, shared utilities
  frontend/    # React 19 SPA (Vite)
  backend/     # Hono HTTP API
```

**Data flow:**

```
Frontend (React + Zustand)
  → Vite Dev Proxy / Production fetch
    → Hono API (backend:3001)
      → Drizzle ORM
        → SQLite (better-sqlite3)
```

The `shared` package is the single source of truth for all request/response schemas. Zod schemas are compiled to TypeScript types consumed by both the frontend store layer and the Hono route handlers, eliminating runtime type drift.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, Zustand, Tailwind CSS 4, shadcn/ui, Framer Motion, @dnd-kit |
| Backend | Hono, better-sqlite3, Drizzle ORM |
| Shared | TypeScript 5, Zod |
| Testing | Vitest, Playwright, MSW, axe-core |
| Tooling | pnpm workspaces, ESLint, TypeScript strict mode |

---

## Getting Started

**Prerequisites**
- Node.js 22+
- pnpm 10+

**Install**

```bash
pnpm install
```

**Development**

```bash
pnpm dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

**Tests**

```bash
# Backend unit + integration tests
pnpm --filter backend run test

# Frontend unit + component tests
pnpm --filter frontend run test

# End-to-end (Playwright)
pnpm test:e2e
```

---

## License

MIT
