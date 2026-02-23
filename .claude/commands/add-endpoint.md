# Add Endpoint — Full Vertical Slice

You are an endpoint implementation orchestrator. Your ONLY job is to coordinate agents in strict dependency order — never write code, read files, or run commands in the main context.

The user wants to add this endpoint:

$ARGUMENTS

## Instructions

### Node PATH (all agents must use this)

```
PATH="/Users/zain/myFiles/claude-test/flowtask/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

Wait — use the correct PATH:

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

### Project root

`/Users/zain/myFiles/claude-test/flowtask/`

### Critical ordering rule

Adding a new endpoint MUST follow this order to avoid cascading TypeScript errors:

1. `packages/shared/src/types.ts` — TypeScript interfaces/types
2. `packages/shared/src/schemas.ts` — Zod validation schemas
3. `packages/backend/src/db/schema.ts` — Drizzle table columns (if DB change needed)
4. `packages/backend/src/routes/` — Hono route handler
5. `packages/frontend/src/lib/api.ts` — Frontend API client method
6. `packages/frontend/src/stores/` — Zustand store action
7. Tests — backend unit tests + frontend store tests

Agents operate in this order via task dependencies. **Do not allow any agent to skip ahead.**

---

## Step 1: Create the team

Use `TeamCreate` with team name `add-endpoint` and a description matching the endpoint request.

---

## Step 2: Create tasks with DAG dependencies

Create these 7 tasks in the task list:

1. **Update shared types and schemas** — Add TypeScript types and Zod schemas to `@flowtask/shared` for the new endpoint's request/response shapes.
2. **Implement backend route** — Add the Drizzle DB schema column(s) if needed, generate and apply any migration, then write the Hono route handler. **Blocked by task 1.**
3. **Implement frontend client and store** — Add the typed API client method and Zustand store action. **Blocked by task 2.**
4. **Write tests** — Write backend unit tests (real in-memory SQLite) and frontend store tests. **Blocked by tasks 2 and 3.**
5. **Run typecheck** — Run all 4 tsc checks. **Blocked by task 4.**
6. **Run backend and frontend tests** — Run full test suites. **Blocked by task 4.**
7. **Report** — Compile and send final summary. **Blocked by tasks 5 and 6.**

Set dependencies:
- Task 2 blocked by task 1
- Task 3 blocked by task 2
- Task 4 blocked by tasks 2 and 3
- Task 5 blocked by task 4
- Task 6 blocked by task 4
- Task 7 blocked by tasks 5 and 6

---

## Step 3: Spawn shared-agent

Spawn a `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 20`.

Context to pass:
```
Endpoint to implement: [paste $ARGUMENTS here]
Project root: /Users/zain/myFiles/claude-test/flowtask/
Node PATH: PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Team: add-endpoint
Your task: "Update shared types and schemas" (task 1)

Claim the task, then:

1. Read packages/shared/src/types.ts to understand existing type patterns.
2. Read packages/shared/src/schemas.ts to understand existing Zod schema patterns.
3. Add the TypeScript types needed for this endpoint:
   - Request body type (if POST/PATCH)
   - Response type
   - Any new model types
4. Add corresponding Zod schemas with proper validation.
5. Follow existing naming conventions exactly.

Mark task 1 complete and notify team-lead with:
- Types added (names + file locations)
- Schemas added (names + file locations)
```

---

## Step 4: Spawn backend-agent (after task 1 is complete)

Wait for task 1 to be marked complete by shared-agent. Then spawn a `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 35`.

Context to pass:
```
Endpoint to implement: [paste $ARGUMENTS here]
Project root: /Users/zain/myFiles/claude-test/flowtask/
Node PATH: PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Team: add-endpoint
Your task: "Implement backend route" (task 2)

Claim the task, then work in this order:

STEP A — DB Schema (only if the endpoint needs new columns or tables):
  Read packages/backend/src/db/schema.ts to understand existing Drizzle table patterns.
  Add columns or tables using the same patterns (snake_case columns, camelCase fields).
  If DB schema changed, generate and apply the migration:
    cd /Users/zain/myFiles/claude-test/flowtask
    PATH="..." pnpm --filter backend run db:generate
    PATH="..." pnpm --filter backend run db:migrate

STEP B — Route handler:
  Read the most similar existing route file in packages/backend/src/routes/ as a reference.
  Read packages/backend/src/index.ts to see how routes are registered.
  Follow this exact pattern:
    - Import types and schemas from @flowtask/shared
    - Use parseBody(c, schema) middleware for request validation
    - Query via Drizzle (use batchLoadRelations() if response needs tags/subtasks/pomodoros/timeEntries)
    - Return c.json({ data: result })
  Register the new route in packages/backend/src/index.ts if it's a new route file.

Mark task 2 complete and notify team-lead with:
- DB changes made (if any, with column names)
- Migration file created (if any)
- Route file created or modified
- HTTP method + path implemented
```

---

## Step 5: Spawn frontend-agent (after task 2 is complete)

Wait for task 2 to be marked complete. Then spawn a `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 25`.

Context to pass:
```
Endpoint to implement: [paste $ARGUMENTS here]
Project root: /Users/zain/myFiles/claude-test/flowtask/
Node PATH: PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Team: add-endpoint
Your task: "Implement frontend client and store" (task 3)

Claim the task, then:

STEP A — API client:
  Read packages/frontend/src/lib/api.ts to understand the generic request<T>() wrapper and existing methods.
  Add a new typed method for the endpoint. Use shared types from @flowtask/shared for the return type.
  Follow existing method patterns exactly (same error handling, same return shape).

STEP B — Zustand store:
  Read the most relevant store in packages/frontend/src/stores/ (likely taskStore.ts).
  Add a store action that:
    1. Applies an optimistic update to local state immediately
    2. Calls the new api.ts method
    3. On success: reconciles local state with server response
    4. On error: rolls back the optimistic update and re-throws
  Follow the existing optimistic update patterns exactly.

Mark task 3 complete and notify team-lead with:
- API client method added
- Store action added
- Store file modified
```

---

## Step 6: Spawn test-agent (after tasks 2 and 3 are complete)

Wait for tasks 2 AND 3 to both be complete. Then spawn a `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 30`.

Context to pass:
```
Endpoint implemented: [paste $ARGUMENTS here]
Project root: /Users/zain/myFiles/claude-test/flowtask/
Node PATH: PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Team: add-endpoint
Your task: "Write tests" (task 4)

Claim the task, then write tests for the new endpoint.

BACKEND TESTS:
  Read the most similar existing test file in packages/backend/src/__tests__/routes/ as a reference.
  Write tests covering:
    - Happy path (valid request → correct response shape)
    - Validation errors (missing required fields, wrong types)
    - Not-found cases (if endpoint takes an :id param)
    - Edge cases specific to this endpoint's logic
  Pattern: each test file gets a fresh in-memory SQLite DB via beforeEach in helpers/setup.ts. No mocks.
  Run the new test file to verify it passes:
    cd /Users/zain/myFiles/claude-test/flowtask
    PATH="..." pnpm --filter backend run test -- [new-test-file-path]

FRONTEND TESTS (if a store action was added):
  Read the most similar existing store test in packages/frontend/src/__tests__/stores/.
  Write tests for the new store action covering:
    - Optimistic update applied immediately
    - State reconciled on API success
    - State rolled back on API failure
  Use MSW to mock the API call.
  Run the new test file:
    PATH="..." pnpm --filter frontend run test -- [new-test-file-path]

Mark task 4 complete and notify team-lead with:
- Backend test file created (path + number of tests)
- Frontend test file created or modified (path + number of tests, or "N/A" if no store action)
```

---

## Step 7: Spawn verifier-agent (after task 4 is complete)

Wait for task 4 to be marked complete. Then spawn a `general-purpose` agent with `model: "haiku"`, `mode: "bypassPermissions"`, `max_turns: 20`.

Context to pass:
```
Project root: /Users/zain/myFiles/claude-test/flowtask/
Node PATH: PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Team: add-endpoint
Your tasks: "Run typecheck" (task 5) and "Run backend and frontend tests" (task 6)

Claim and run both tasks sequentially:

TASK 5 — Typecheck:
  cd /Users/zain/myFiles/claude-test/flowtask
  PATH="..." npx tsc --noEmit -p tsconfig.json 2>&1 | tail -10
  PATH="..." npx tsc --noEmit -p packages/backend/tsconfig.json 2>&1 | tail -10
  PATH="..." npx tsc --noEmit -p packages/frontend/tsconfig.json 2>&1 | tail -10
  PATH="..." npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | tail -10
  Record: PASS or FAIL (with error count) for each.
  Mark task 5 complete.

TASK 6 — Full test suites:
  PATH="..." pnpm --filter backend run test 2>&1 | tail -20
  PATH="..." pnpm --filter frontend run test 2>&1 | tail -20
  Record: total, pass, fail counts for each.
  Mark task 6 complete.

After both tasks are done, mark task 7 complete and send final report to team-lead:
  TypeScript:     PASS / FAIL (N errors)
  Backend tests:  PASS / FAIL (N/N)
  Frontend tests: PASS / FAIL (N/N)
  [List any failing tests or type errors]
```

---

## Step 8: Present results and clean up

Wait for all agents to complete. Present a final summary to the user:

```
Endpoint Added: [endpoint description]
======================================
Files created/modified:
  packages/shared/src/types.ts    — [types added]
  packages/shared/src/schemas.ts  — [schemas added]
  packages/backend/src/db/schema.ts — [DB changes, if any]
  packages/backend/src/routes/...  — [route implemented]
  packages/frontend/src/lib/api.ts — [client method added]
  packages/frontend/src/stores/... — [store action added]
  packages/backend/src/__tests__/  — [N backend tests]
  packages/frontend/src/__tests__/ — [N frontend tests]

TypeScript:      PASS (0 errors, all 4 tsconfigs)
Backend tests:   PASS (N/N)
Frontend tests:  PASS (N/N)
```

Send `shutdown_request` to all agents, then call `TeamDelete`.

---

## Important Rules

- NEVER write code, read files, or run commands in this main context — all work goes to agents.
- All agents MUST use `mode: "bypassPermissions"`.
- All bash commands in agents MUST use the Node PATH above.
- **Enforce the dependency order strictly** — never spawn backend-agent before task 1 is complete, never spawn frontend-agent before task 2 is complete. Getting this wrong causes cascading TypeScript errors.
- Keep this context lean — only coordinate, never execute.
- Spawn agents liberally — the user has plenty of RAM and CPU.
