# Add Migration — Database Schema Change

You are a migration orchestrator. Your ONLY job is to coordinate agents — never write code, read files, or run commands in the main context.

The user wants to make this schema change:

$ARGUMENTS

## Instructions

### Node PATH (all agents must use this)

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

### Project root

`/Users/zain/myFiles/claude-test/flowtask/`

### Critical ordering rule

Schema changes MUST follow this order to keep TypeScript and the running DB in sync:

1. `packages/shared/src/types.ts` — TypeScript interfaces updated
2. `packages/shared/src/schemas.ts` — Zod schemas updated
3. `packages/backend/src/db/schema.ts` — Drizzle table definitions updated
4. `db:generate` — Migration SQL file created from the Drizzle schema diff
5. `db:migrate` — Migration applied to the SQLite database file
6. Routes updated — Any route that queries the changed table is updated
7. Typecheck + tests — Verify nothing is broken

**Do not apply the migration before updating the Drizzle schema. Do not update routes before the migration is applied.**

---

## Step 1: Create the team

Use `TeamCreate` with team name `add-migration` and a description matching the schema change request.

---

## Step 2: Create tasks with DAG dependencies

Create these 5 tasks:

1. **Apply schema change** — Update shared types, Zod schemas, Drizzle schema; generate and apply migration; update affected routes.
2. **Run typecheck** — Run all 4 tsc checks to verify no TypeScript errors. **Blocked by task 1.**
3. **Run backend tests** — Run full backend test suite. **Blocked by task 1.**
4. **Run frontend tests** — Run full frontend test suite. **Blocked by task 1.**
5. **Report** — Compile and send final summary. **Blocked by tasks 2, 3, and 4.**

Set dependencies:
- Tasks 2, 3, 4 all blocked by task 1
- Task 5 blocked by tasks 2, 3, and 4

---

## Step 3: Spawn schema-agent

Spawn a `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 35`.

Context to pass:
```
Schema change to apply: [paste $ARGUMENTS here]
Project root: /Users/zain/myFiles/claude-test/flowtask/
Node PATH: PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Team: add-migration
Your task: "Apply schema change" (task 1)

Claim the task, then work in this EXACT order — do not skip or reorder:

--- PHASE 1: Shared types ---
Read packages/shared/src/types.ts.
Update the relevant TypeScript interface(s) to reflect the schema change.
Follow existing naming conventions (camelCase fields, union types for enums).

--- PHASE 2: Shared schemas ---
Read packages/shared/src/schemas.ts.
Update the relevant Zod schema(s) to match the type changes.
Ensure insert/update schemas are consistent with the type.

--- PHASE 3: Drizzle schema ---
Read packages/backend/src/db/schema.ts.
Update the relevant Drizzle table definition(s):
  - Add columns: use the appropriate Drizzle column type (.text(), .integer(), .real(), .blob())
  - Add .notNull() or .default() as appropriate
  - For new tables: include id, createdAt, updatedAt, and cascade foreign keys
  - For dropped columns: remove the column definition
  - For renamed columns: update the column name (breaking change — coordinate with routes)
  - snake_case column names, camelCase field names (using .column() mapping if needed)

--- PHASE 4: Generate migration ---
cd /Users/zain/myFiles/claude-test/flowtask
PATH="..." pnpm --filter backend run db:generate 2>&1

This creates a new SQL file in packages/backend/drizzle/. Verify the output SQL matches the intended change — read the generated file to confirm it looks correct before applying.

--- PHASE 5: Apply migration ---
PATH="..." pnpm --filter backend run db:migrate 2>&1

If migration fails, diagnose the error and fix the Drizzle schema, then re-generate.

--- PHASE 6: Update affected routes ---
Read packages/backend/src/routes/ files that query the changed table.
Update any:
  - INSERT statements to include new required columns (or verify defaults handle them)
  - SELECT/return shapes to include new fields
  - batchLoadRelations() calls if a new relation was added
  - Zod schema references (parseBody calls) if request schema changed

--- PHASE 7: Verify compilation ---
cd /Users/zain/myFiles/claude-test/flowtask
PATH="..." npx tsc --noEmit -p packages/backend/tsconfig.json 2>&1 | tail -20
PATH="..." npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | tail -20

If there are TypeScript errors, fix them before marking the task complete.

Mark task 1 complete and notify team-lead with:
- Shared types changed (file + field names)
- Zod schemas changed
- Drizzle schema changes (table + column names)
- Migration file created (path)
- Routes updated (file names + what changed)
- Any TypeScript issues encountered and resolved
```

---

## Step 4: Spawn verifier-agent (after task 1 is complete)

Wait for task 1 to be marked complete by schema-agent. Then spawn a `general-purpose` agent with `model: "haiku"`, `mode: "bypassPermissions"`, `max_turns: 20`.

Context to pass:
```
Project root: /Users/zain/myFiles/claude-test/flowtask/
Node PATH: PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Team: add-migration
Your tasks: "Run typecheck" (task 2), "Run backend tests" (task 3), "Run frontend tests" (task 4)

Run all three sequentially:

TASK 2 — Typecheck:
  cd /Users/zain/myFiles/claude-test/flowtask
  PATH="..." npx tsc --noEmit -p tsconfig.json 2>&1 | tail -10
  PATH="..." npx tsc --noEmit -p packages/backend/tsconfig.json 2>&1 | tail -10
  PATH="..." npx tsc --noEmit -p packages/frontend/tsconfig.json 2>&1 | tail -10
  PATH="..." npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | tail -10
  Record: PASS or FAIL (with error count) for each.
  Mark task 2 complete.

TASK 3 — Backend tests:
  PATH="..." pnpm --filter backend run test 2>&1 | tail -20
  Record: total, pass, fail. Expected ~129+.
  Mark task 3 complete.

TASK 4 — Frontend tests:
  PATH="..." pnpm --filter frontend run test 2>&1 | tail -20
  Record: total, pass, fail. Expected ~92+.
  Mark task 4 complete.

After all three tasks complete, mark task 5 complete and send final report to team-lead:
  TypeScript:     PASS / FAIL (details)
  Backend tests:  PASS / FAIL (N/N)
  Frontend tests: PASS / FAIL (N/N)
  [Any failing tests or type errors with file names]
```

---

## Step 5: Present results and clean up

Wait for all agents to complete. Present a final summary to the user:

```
Migration Applied: [schema change description]
===============================================
Changes:
  packages/shared/src/types.ts    — [types updated]
  packages/shared/src/schemas.ts  — [schemas updated]
  packages/backend/src/db/schema.ts — [table changes]
  packages/backend/drizzle/       — [migration file name]
  packages/backend/src/routes/    — [routes updated]

TypeScript:      PASS (0 errors, all 4 tsconfigs)
Backend tests:   PASS (N/N)
Frontend tests:  PASS (N/N)
```

If any check failed, report the errors and tell the user what still needs to be fixed.

Send `shutdown_request` to all agents, then call `TeamDelete`.

---

## Important Rules

- NEVER write code, read files, or run commands in this main context — all work goes to agents.
- All agents MUST use `mode: "bypassPermissions"`.
- All bash commands in agents MUST use the Node PATH above.
- **The schema-agent MUST complete before the verifier-agent is spawned** — the migration must be applied before tests run against the DB.
- If `db:generate` or `db:migrate` fails, the schema-agent must fix it — do not spawn the verifier-agent with a broken migration.
- Keep this context lean — only coordinate, never execute.
