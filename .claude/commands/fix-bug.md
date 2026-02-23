# Fix Bug

You are a bug-fixing orchestrator. Your ONLY job is to delegate all work to agents — never investigate or fix anything in this main context.

The user has reported the following bug:

$ARGUMENTS

## Instructions

Immediately spawn a team and assign an investigator agent to handle this end-to-end. Do not read any files, do not run any commands yourself. All work goes to agents.

### Step 1: Create the team

Use `TeamCreate` with team name `fix-bug` and description matching the bug report.

### Step 2: Create tasks

Create the following tasks in the task list:
1. **Investigate and fix bug** — Read relevant source files in `/Users/zain/myFiles/claude-test/flowtask/`, find the root cause of the bug described in the arguments, and apply a targeted fix.
2. **Run backend tests** — Run backend test suite and report results.
3. **Run frontend tests** — Run frontend test suite and report results.
4. **Run typecheck** — Run TypeScript checks on all 4 tsconfigs and report any errors.
5. **Report findings** — Summarize the root cause, the fix applied, and all test/typecheck results.

Set task dependencies: tasks 2, 3, 4 are blocked by task 1. Task 5 is blocked by tasks 2, 3, 4.

### Step 3: Spawn investigator agent

Spawn a `general-purpose` agent with `model: "sonnet"` and `mode: "bypassPermissions"` and `max_turns: 30`. Pass this focused context:

```
Bug description: [paste $ARGUMENTS here]
Project root: /Users/zain/myFiles/claude-test/flowtask/
Node PATH to use in ALL bash commands: PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Your job:
1. Claim task "Investigate and fix bug" from the team task list.
2. Read only the files most likely related to this bug (use Grep/Glob to locate relevant code — do not do broad scans).
3. Identify the root cause.
4. Apply a minimal, targeted fix using the Edit tool.
5. Mark the task complete and notify the team lead with a summary of: root cause, files changed, and the fix applied.

Then claim and run tasks 2, 3, 4 sequentially:

Task 2 — Backend tests:
  cd /Users/zain/myFiles/claude-test/flowtask && PATH="..." pnpm --filter backend run test
  Report pass/fail counts and any failing test names.

Task 3 — Frontend tests:
  cd /Users/zain/myFiles/claude-test/flowtask && PATH="..." pnpm --filter frontend run test
  Report pass/fail counts and any failing test names.

Task 4 — Typecheck:
  cd /Users/zain/myFiles/claude-test/flowtask
  Run all 4:
    PATH="..." npx tsc --noEmit -p tsconfig.json
    PATH="..." npx tsc --noEmit -p packages/backend/tsconfig.json
    PATH="..." npx tsc --noEmit -p packages/frontend/tsconfig.json
    PATH="..." npx tsc --noEmit -p packages/shared/tsconfig.json
  Report any errors found.

After all tasks complete, mark task 5 complete and send the team lead a final report.
```

### Step 4: Wait for results

Wait for the agent to complete and deliver the final report. Then present a concise summary to the user:
- Bug description
- Root cause found
- Fix applied (files changed)
- Backend tests: PASS/FAIL (counts)
- Frontend tests: PASS/FAIL (counts)
- TypeScript: PASS/FAIL (error count)

### Step 5: Shut down and clean up

Send `shutdown_request` to all agents, then call `TeamDelete`.

## Important Rules

- NEVER read files or run commands in this main context — all work goes to agents.
- All agents MUST use `mode: "bypassPermissions"`.
- All bash commands MUST use: `PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"`
- Keep this context lean — only coordinate, never execute.
