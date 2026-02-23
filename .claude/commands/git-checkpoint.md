# Git Checkpoint — Safe Commit Workflow

You are a git-checkpoint orchestrator. Your ONLY job is to gate commits on green tests and delegate all verification and committing to an agent. Never run commands or read files in the main context.

## Instructions

The user may pass an optional commit message override as an argument (e.g., `/git-checkpoint feat: add dark mode`). If no argument is provided, the agent will generate a conventional commit message from the diff.

### Node PATH (all agents must use this)

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

### Project root

`/Users/zain/myFiles/claude-test/flowtask/`

---

## Spawn Verifier Agent

Spawn a single `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 15`.

Context to pass:
```
Run the FlowTask safe commit workflow. Project root: /Users/zain/myFiles/claude-test/flowtask/

Commit message override (blank if none): [INSERT USER MESSAGE OR LEAVE BLANK]

Use this PATH in ALL bash commands:
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

--- STEP 1: TypeScript check ---
cd /Users/zain/myFiles/claude-test/flowtask
PATH="..." pnpm typecheck 2>&1 | tail -20

If there are TypeScript errors:
  - Report the errors to team-lead
  - STOP immediately. Do NOT proceed to tests or commit.

--- STEP 2: Backend tests ---
PATH="..." pnpm --filter backend run test 2>&1 | tail -20

If there are test failures:
  - Report which tests failed to team-lead
  - STOP immediately. Do NOT proceed to frontend tests or commit.

--- STEP 3: Frontend tests ---
PATH="..." pnpm --filter frontend run test 2>&1 | tail -20

If there are test failures:
  - Report which tests failed to team-lead
  - STOP immediately. Do NOT proceed to commit.

--- STEP 4: Inspect changes ---
cd /Users/zain/myFiles/claude-test/flowtask
git status
git diff --staged
git diff

--- STEP 5: Generate or use commit message ---
If the user provided a commit message override, use it exactly as-is.
If no override was given, generate a conventional commit message from the changes:
  - Use one of: feat:, fix:, refactor:, docs:, chore:, test:
  - Keep the subject line under 72 characters
  - Add a brief body if the changes are complex

--- STEP 6: Stage and commit ---
Stage all modified/new files EXCEPT:
  - .env or any *.env* files
  - Any files matching *credentials* or *secret*
  - packages/backend/data/*.db (SQLite database files)

Run:
  git add [safe files only]
  git commit -m "$(cat <<'EOF'
[COMMIT MESSAGE HERE]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"

--- STEP 7: Confirm ---
git log --oneline -5

Send a final report to team-lead:
  Result: SUCCESS or STOPPED (and reason)
  Commit hash: [short hash]
  Commit message: [full message]
  Files changed: [count and list]
  TypeScript: PASS
  Backend tests: PASS (N tests)
  Frontend tests: PASS (N tests)
```

---

## Collect and Present Results

Wait for the agent to report back, then present the result to the user:

If **SUCCESS**:
```
Git Checkpoint — SUCCESS
========================
Commit: [hash] [message]
Files changed: N
TypeScript: PASS
Backend tests: PASS (N tests)
Frontend tests: PASS (N tests)
```

If **STOPPED**:
```
Git Checkpoint — BLOCKED
========================
Reason: [TypeScript errors / Backend test failures / Frontend test failures]
Details:
[error/failure details]

Fix the issues above before committing.
```

---

## Important Rules

- NEVER run commands or read files in the main context — all work goes to the agent.
- The agent MUST use `mode: "bypassPermissions"`.
- All bash commands in the agent MUST use the Node PATH above.
- If TypeScript or tests fail, do NOT commit — report the errors and stop.
- Never stage .env files, credential files, or *.db database files.
- Keep this context lean — only coordinate, never execute.
