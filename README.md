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

## How It Was Built

This application was built as an AI-assisted full-stack development project, demonstrating modern software engineering practices combined with AI-powered development workflows. The entire application — from specification to implementation to testing — was developed using Claude Code as an AI pair programmer.

### Development Process

1. **Specification and Architecture Design** — Started with a comprehensive technical specification (SPEC.md) that defined every aspect: data models, API contracts, component architecture, database schema, keyboard shortcuts, and quality standards. The spec served as the single source of truth throughout development.

2. **Monorepo Scaffolding** — Set up the pnpm workspace with three packages (shared, backend, frontend) and a base TypeScript configuration enforcing strict mode across all packages. Established the shared-first pattern where types and validation schemas are defined once and consumed by both frontend and backend.

3. **Database and Backend API** — Implemented the SQLite database schema with 8 tables using Drizzle ORM, then built the Hono REST API with 7 route modules. Each route follows a consistent pattern: Zod validation → business logic → JSON response. Implemented batched relation loading to avoid N+1 query problems.

4. **Frontend Application** — Built the React 19 SPA with Zustand state management using optimistic updates for responsive UX. Implemented three views (List, Kanban with @dnd-kit drag-and-drop, Calendar), a command palette with inline syntax parsing (Quick Capture), and productivity tools (Pomodoro timer, time tracking).

5. **End-to-End Type Safety** — Zod schemas in the shared package serve as the contract between frontend and backend. The API client is fully typed, stores use shared types, and runtime validation catches any mismatches at the API boundary.

6. **Comprehensive Testing** — Built a 292+ test suite across three layers: backend unit tests with real in-memory SQLite (no mocks), frontend tests with React Testing Library and MSW, and 71 Playwright E2E tests covering every user flow. Added axe-core accessibility tests and visual regression snapshots.

7. **Quality Assurance** — Zero TypeScript errors across all 4 tsconfigs. Backend at 85% line coverage. Mutation testing on critical routes. Every bug fix and feature addition was followed by full browser verification using Playwright in headed mode.

8. **Developer Automation** — Created 17 Claude Code automation skills (slash commands) that automate common workflows: adding endpoints, database migrations, test coverage analysis, accessibility audits, performance profiling, and more. These skills use multi-agent teams with DAG task dependencies to enforce correct execution order.

---

## What Makes This Different

- **Local-first architecture** — All data stays on your machine in SQLite. No cloud dependency, no account required, instant performance.
- **Production-grade engineering** — This is not a tutorial project. It has proper error handling, optimistic updates with rollback, N+1 query prevention, cascade deletions, WAL mode for concurrent access, and code-split lazy loading.
- **AI-augmented development workflow** — 17 automation skills that use multi-agent teams to handle everything from endpoint creation to accessibility audits. The development process itself is part of the engineering.

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

**Data and UX**
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
