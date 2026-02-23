# Status — Project Health Report

You are a status orchestrator. Your ONLY job is to spawn a single agent that gathers all health metrics. Never run commands or read files in the main context.

## Instructions

### Node PATH

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

### Project root

`/Users/zain/myFiles/claude-test/flowtask/`

---

## Spawn one agent to do all checks

Spawn a single `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 25`.

Context to pass:
```
Generate a full health report for the FlowTask project at /Users/zain/myFiles/claude-test/flowtask/

Use this PATH in ALL bash commands:
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Run all of the following checks and collect results:

--- CHECK 1: TypeScript ---
Run all 4 tsc checks:
  cd /Users/zain/myFiles/claude-test/flowtask
  PATH="..." npx tsc --noEmit -p tsconfig.json 2>&1 | tail -5
  PATH="..." npx tsc --noEmit -p packages/backend/tsconfig.json 2>&1 | tail -5
  PATH="..." npx tsc --noEmit -p packages/frontend/tsconfig.json 2>&1 | tail -5
  PATH="..." npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | tail -5

Record: PASS or FAIL (with error count) for each.

--- CHECK 2: Backend Tests ---
  cd /Users/zain/myFiles/claude-test/flowtask
  PATH="..." pnpm --filter backend run test 2>&1 | tail -20

Record: total, pass, fail counts. Expected ~129.

--- CHECK 3: Frontend Tests ---
  cd /Users/zain/myFiles/claude-test/flowtask
  PATH="..." pnpm --filter frontend run test 2>&1 | tail -20

Record: total, pass, fail counts. Expected ~92.

--- CHECK 4: E2E Tests ---
  cd /Users/zain/myFiles/claude-test/flowtask
  PATH="..." npx playwright test --ignore-snapshots 2>&1 | tail -20

Record: total, pass, fail counts. Expected ~71.

--- CHECK 5: Git Status ---
  cd /Users/zain/myFiles/claude-test/flowtask
  git status --short
  git log --oneline -5

Record: number of modified/untracked files, last 5 commit messages.

---

After all checks complete, format results as follows and send to team lead:

FlowTask Health Report — [current date]
========================================

TYPESCRIPT
  tsconfig.json (root)      PASS / FAIL (N errors)
  packages/backend          PASS / FAIL (N errors)
  packages/frontend         PASS / FAIL (N errors)
  packages/shared           PASS / FAIL (N errors)

TESTS
  Suite        | Total | Pass | Fail | Status
  -------------|-------|------|------|-------
  Backend      |   X   |  X   |  X   | PASS/FAIL
  Frontend     |   X   |  X   |  X   | PASS/FAIL
  E2E (Playwright)|  X  |  X   |  X   | PASS/FAIL

GIT
  Modified/untracked files: N
  Recent commits:
    [last 5 commits]

OVERALL: HEALTHY / NEEDS ATTENTION
(Healthy = 0 TypeScript errors + 0 test failures)
```

---

## Collect and Present Results

Wait for the agent to report back, then present the formatted health report directly to the user exactly as the agent produced it.

---

## Important Rules

- NEVER run commands or read files in this main context — all work goes to the single agent.
- The agent MUST use `mode: "bypassPermissions"`.
- All bash commands in the agent MUST use the Node PATH above.
- Keep this context lean — only coordinate, never execute.
