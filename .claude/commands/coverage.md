# Coverage — Test Coverage Analysis

You are a coverage orchestrator. Your ONLY job is to delegate coverage analysis (and optional test writing) to agents. Never run commands or read files in the main context.

## Instructions

The user may pass an optional threshold percentage as an argument (e.g., `/coverage 80`). Default threshold is **70%** if not specified.

### Node PATH (all agents must use this)

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

### Project root

`/Users/zain/myFiles/claude-test/flowtask/`

---

## Phase 1 — Spawn Analyzer Agent

Spawn a single `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 15`.

Context to pass:
```
Analyze test coverage for the FlowTask project at /Users/zain/myFiles/claude-test/flowtask/

Threshold: [INSERT THRESHOLD]% (default 70 if not specified by user)

Use this PATH in ALL bash commands:
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Step 1 — Run backend coverage:
  cd /Users/zain/myFiles/claude-test/flowtask
  PATH="..." pnpm --filter backend run test:coverage 2>&1 | tail -40

Step 2 — Run frontend coverage:
  cd /Users/zain/myFiles/claude-test/flowtask
  PATH="..." pnpm --filter frontend run test:coverage 2>&1 | tail -40

Step 3 — Parse both outputs:
- Find the overall summary lines (Lines %, Branches %, Functions %)
- Find every individual file row that is below the threshold in any of Lines, Branches, or Functions
- Sort the below-threshold files by Lines% ascending (worst coverage first)

Step 4 — Send a report to team-lead in this exact format:

Coverage Report — FlowTask
==========================

BACKEND OVERALL
  Lines:     X%
  Branches:  X%
  Functions: X%

FRONTEND OVERALL
  Lines:     X%
  Branches:  X%
  Functions: X%

FILES BELOW [THRESHOLD]% THRESHOLD (sorted worst first):
  File                          | Lines% | Branches% | Functions%
  ------------------------------|--------|-----------|----------
  packages/backend/src/...      |  X%    |  X%       |  X%
  packages/frontend/src/...     |  X%    |  X%       |  X%
  (none if all files pass)

RECOMMENDATION:
  [List top 3 files to prioritize for test writing, with brief reason]
  OR "All files meet the threshold. No action needed."
```

---

## Phase 2 — Ask User About Test Writing (only if gaps exist)

After the analyzer reports back:

1. Present the coverage report to the user.
2. If there are files below the threshold, ask the user: **"Would you like me to spawn a test-writing agent to fill these gaps?"**
3. If the user says **yes**, proceed to Phase 3. Otherwise, stop.

---

## Phase 3 — Spawn Test-Writer Agent (optional)

Spawn a single `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 30`.

Pass it the list of low-coverage files from the analyzer report and these instructions:

```
Write additional tests to improve coverage for the FlowTask project.

Use this PATH in ALL bash commands:
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Low-coverage files to target:
[INSERT FILE LIST FROM ANALYZER REPORT]

Patterns to follow:
- Backend tests: real in-memory SQLite DB, no mocks. Files go in packages/backend/src/__tests__/routes/.
  Import testDb from helpers/setup.ts. Follow the structure of existing test files in that directory.
- Frontend tests: RTL + jsdom environment. Files go in packages/frontend/src/__tests__/.
  Use renderWithProviders() helper. MSW is available for API mocking.
- Do NOT write E2E tests here — unit/integration tests only.

For each file:
1. Read the source file to understand what to test
2. Read any existing test file for it (if present) to avoid duplication
3. Write focused tests targeting uncovered lines/branches/functions
4. Run the test file to verify it passes:
   cd /Users/zain/myFiles/claude-test/flowtask
   PATH="..." pnpm --filter backend run test -- [test-file-path]
   (or frontend equivalent)

After all tests are written and passing, re-run coverage:
  PATH="..." pnpm --filter backend run test:coverage 2>&1 | tail -20
  PATH="..." pnpm --filter frontend run test:coverage 2>&1 | tail -20

Send a final report to team-lead:
- Files where tests were added
- New coverage numbers for those files
- Any files you couldn't improve (and why)
```

---

## Collect and Present Results

Wait for the agent(s) to report back, then present a clean summary to the user:
- Coverage numbers before and after (if test-writer ran)
- Files improved
- Any remaining gaps

---

## Important Rules

- NEVER run commands or read files in the main context — all work goes to agents.
- All agents MUST use `mode: "bypassPermissions"`.
- All bash commands in agents MUST use the Node PATH above.
- Only spawn the test-writer agent if the user explicitly confirms.
- Keep this context lean — only coordinate, never execute.
