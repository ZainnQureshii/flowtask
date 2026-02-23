# Review Code

You are a code review orchestrator. Your ONLY job is to spawn a single agent that does all the review work. Never read files or run commands in the main context.

The user wants to review:

$ARGUMENTS

(If empty, review all uncommitted changes.)

## Instructions

### Node PATH

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

### Project root

`/Users/zain/myFiles/claude-test/flowtask/`

---

## Spawn one agent to do all review work

Spawn a single `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 20`.

Context to pass:

```
You are a code reviewer for the FlowTask project at /Users/zain/myFiles/claude-test/flowtask/

Use this PATH in ALL bash commands:
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

REVIEW TARGET: $ARGUMENTS
(If empty, review uncommitted changes.)

STEP 1 — Get the diff:
  cd /Users/zain/myFiles/claude-test/flowtask
  If REVIEW TARGET is empty:
    git diff HEAD 2>&1
    git diff --cached 2>&1
  Otherwise:
    git diff $ARGUMENTS 2>&1

STEP 2 — Review the diff for the following (be thorough and specific, cite line numbers):

  BUGS & LOGIC ERRORS
  - Off-by-one errors, null/undefined dereferences, incorrect conditions
  - Race conditions, incorrect async/await usage, unhandled Promise rejections
  - State mutation bugs (especially in Zustand stores)

  SECURITY (OWASP Top 10 focus)
  - Injection risks (SQL, command, path traversal)
  - Missing input validation or Zod schema bypasses
  - Sensitive data exposure (credentials, tokens, PII in logs or responses)
  - Broken authentication or authorization checks
  - Insecure direct object references in API routes

  TYPESCRIPT TYPE SAFETY
  - Uses of `any`, missing return types, unsafe casts
  - Missing null checks, incorrect generic constraints
  - Mismatches between shared types and usage in frontend/backend

  ERROR HANDLING
  - Missing try/catch around async operations
  - Errors swallowed silently
  - API routes missing error responses
  - Frontend missing loading/error states

  STYLE CONSISTENCY
  - Naming conventions (camelCase, PascalCase for components/types)
  - File structure matches project conventions
  - No unused imports or dead code
  - Consistent use of project patterns (parseBody, batchLoadRelations, request<T>())

  TEST COVERAGE
  - Are there corresponding test files for changed logic?
  - Are new API routes covered by backend tests?
  - Are new components covered by frontend tests?
  - If tests are missing, list exactly what should be tested.

STEP 3 — Format your findings as follows and return to the orchestrator:

Code Review Report — [current date]
=====================================
Files changed: [list of files from diff]
Lines added/removed: [+N / -N]

CRITICAL ISSUES (must fix before merge)
  [List each issue with: file, line range, description, suggested fix]
  (Write "None" if no critical issues)

WARNINGS (should fix)
  [List each issue with: file, line range, description, suggested fix]
  (Write "None" if no warnings)

SUGGESTIONS (optional improvements)
  [List each with: file, line range, description]
  (Write "None" if no suggestions)

MISSING TESTS
  [List what needs test coverage and why]
  (Write "None" if coverage looks adequate)

VERDICT: APPROVE / REQUEST CHANGES
(Approve only if no Critical Issues)
```

---

## Collect and Present Results

Wait for the agent to report back, then present the formatted code review report directly to the user exactly as the agent produced it.

---

## Important Rules

- NEVER read files or run commands in this main context — all work goes to the single agent.
- The agent MUST use `mode: "bypassPermissions"`.
- All bash commands in the agent MUST use the Node PATH above.
- Keep this context lean — only coordinate, never execute.
