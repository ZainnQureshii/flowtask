# QA — Full Test Suite

You are a QA orchestrator. Your ONLY job is to delegate all test execution to parallel agents. Never run tests in the main context.

## Instructions

Immediately spawn 3 parallel agents — one for each test suite. Do not run any commands yourself.

### Node PATH (all agents must use this)

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

### Project root

`/Users/zain/myFiles/claude-test/flowtask/`

---

### Agent 1 — Backend Tests

Spawn a `general-purpose` agent with `model: "haiku"`, `mode: "bypassPermissions"`, `max_turns: 15`.

Context to pass:
```
Run backend tests for the FlowTask project.
Command: cd /Users/zain/myFiles/claude-test/flowtask && PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH" pnpm --filter backend run test

Expected: ~129 tests
Report back:
- Total tests run
- Pass count
- Fail count
- Names of any failing tests (if any)
Send result to team lead when done.
```

---

### Agent 2 — Frontend Tests

Spawn a `general-purpose` agent with `model: "haiku"`, `mode: "bypassPermissions"`, `max_turns: 15`.

Context to pass:
```
Run frontend tests for the FlowTask project.
Command: cd /Users/zain/myFiles/claude-test/flowtask && PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH" pnpm --filter frontend run test

Expected: ~92 tests
Report back:
- Total tests run
- Pass count
- Fail count
- Names of any failing tests (if any)
Send result to team lead when done.
```

---

### Agent 3 — E2E Playwright Tests

Spawn a `general-purpose` agent with `model: "haiku"`, `mode: "bypassPermissions"`, `max_turns: 15`.

Context to pass:
```
Run E2E Playwright tests for the FlowTask project.
Command: cd /Users/zain/myFiles/claude-test/flowtask && PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH" npx playwright test --ignore-snapshots

Expected: ~71 tests
Report back:
- Total tests run
- Pass count
- Fail count
- Names of any failing tests (if any)
Send result to team lead when done.
```

---

### Collect Results

Wait for all 3 agents to report back. Then present results in this format:

```
QA Report — FlowTask
====================
Suite              | Total | Pass | Fail | Status
-------------------|-------|------|------|-------
Backend (expected 129) |   X   |  X   |  X   | PASS/FAIL
Frontend (expected 92) |   X   |  X   |  X   | PASS/FAIL
E2E Playwright (expected 71) |   X   |  X   |  X   | PASS/FAIL

Failing Tests:
[list any failing tests by suite]
```

If all suites pass with 0 failures, report: "All tests passing."

---

## Important Rules

- NEVER run commands in this main context — all test execution goes to agents.
- All agents MUST use `mode: "bypassPermissions"`.
- All bash commands in agents MUST use the Node PATH above.
- Spawn all 3 agents in parallel (in the same response) for speed.
- Keep this context lean — only coordinate, never execute.
