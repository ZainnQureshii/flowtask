# TypeCheck — Check and Fix All TypeScript Errors

You are a typecheck orchestrator. Your ONLY job is to delegate all typecheck and fix work to agents. Never run tsc or edit files in the main context.

## Instructions

### Node PATH (all agents must use this)

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

### Project root

`/Users/zain/myFiles/claude-test/flowtask/`

### The 4 tsconfigs to check

1. `tsconfig.json` (root)
2. `packages/backend/tsconfig.json`
3. `packages/frontend/tsconfig.json`
4. `packages/shared/tsconfig.json`

---

## Phase 1: Run initial typecheck

Spawn a `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 20`.

Context to pass:
```
Run TypeScript checks on the FlowTask project at /Users/zain/myFiles/claude-test/flowtask/

Use this PATH in all bash commands:
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Run these 4 commands and capture all output:
1. cd /Users/zain/myFiles/claude-test/flowtask && PATH="..." npx tsc --noEmit -p tsconfig.json
2. cd /Users/zain/myFiles/claude-test/flowtask && PATH="..." npx tsc --noEmit -p packages/backend/tsconfig.json
3. cd /Users/zain/myFiles/claude-test/flowtask && PATH="..." npx tsc --noEmit -p packages/frontend/tsconfig.json
4. cd /Users/zain/myFiles/claude-test/flowtask && PATH="..." npx tsc --noEmit -p packages/shared/tsconfig.json

If ALL 4 pass with zero errors: report "TypeScript: All clear — 0 errors across all 4 tsconfigs."

If there ARE errors: collect the full error output for each failing tsconfig and report:
- Which tsconfigs had errors
- Full error messages (file, line, error code, description)
- Total error count

Send this report to the team lead.
```

---

## Phase 2: Fix errors (only if errors were found)

If the Phase 1 agent reports errors:

Spawn a `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 30`.

Pass the exact error output from Phase 1 as context:
```
Fix TypeScript errors in the FlowTask project at /Users/zain/myFiles/claude-test/flowtask/

Node PATH: PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Here are the TypeScript errors to fix:
[paste Phase 1 error output here]

Instructions:
1. Read each file mentioned in the errors (use Read tool, don't over-read).
2. Fix the TypeScript errors using the Edit tool. Make minimal, targeted changes.
3. Do not change runtime behavior — type fixes only unless a type error reveals a real bug.
4. After fixing, re-run all 4 tsc commands to verify zero errors:
   - PATH="..." npx tsc --noEmit -p tsconfig.json
   - PATH="..." npx tsc --noEmit -p packages/backend/tsconfig.json
   - PATH="..." npx tsc --noEmit -p packages/frontend/tsconfig.json
   - PATH="..." npx tsc --noEmit -p packages/shared/tsconfig.json
5. Report: files changed, errors fixed, final tsc result (pass/fail).

Send result to team lead when done.
```

---

## Phase 3: Report results

Present a final summary:

```
TypeScript Check — FlowTask
===========================
tsconfig.json (root)      — PASS / FAIL (N errors)
packages/backend          — PASS / FAIL (N errors)
packages/frontend         — PASS / FAIL (N errors)
packages/shared           — PASS / FAIL (N errors)

[If fixes were applied:]
Files changed: [list]
Errors fixed: N

Final verification: PASS (0 errors) / FAIL (N remaining errors)
```

---

## Important Rules

- NEVER run tsc or edit files in this main context — all work goes to agents.
- All agents MUST use `mode: "bypassPermissions"`.
- All bash commands in agents MUST use the Node PATH above.
- Only spawn the fix agent if Phase 1 finds actual errors.
- Keep this context lean — only coordinate, never execute.
