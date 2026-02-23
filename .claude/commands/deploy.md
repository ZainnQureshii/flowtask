# /deploy — Deploy to Fly.io

Deploys FlowTask to Fly.io, monitors for success, and verifies the live app responds correctly.

## Steps

### 1. Spawn the deploy agent

Spawn a single `general-purpose` agent named `"deployer"` with:
- `model: "sonnet"`
- `mode: "bypassPermissions"`
- `max_turns: 20`

Pass this context:

```
Run the FlowTask Fly.io deployment workflow. Project root: /Users/zain/myFiles/claude-test/flowtask/
Fly app name: flowtask-cool-leaf-7076
Production URL: https://flowtask-cool-leaf-7076.fly.dev/

--- STEP 1: Deploy ---
cd /Users/zain/myFiles/claude-test/flowtask
fly deploy 2>&1

Watch the output carefully:
- If it ends with "v<N> deployed successfully", note the version number and proceed.
- If it ends with "Error" or "failed", capture the last 30 lines and STOP. Report the failure.

--- STEP 2: Check status ---
fly status

Parse the output:
- Confirm at least one machine shows state = "started" and health checks passing.
- Note the current version (e.g. v9, v10).
- If any machine is in a crash loop or failed state, report it and STOP.

--- STEP 3: Tail recent logs (quick sanity check) ---
fly logs --no-tail 2>&1 | head -30

Look for any FATAL or unhandled error lines in the first 30 lines. If found, include them in the report.

--- STEP 4: Health check ---
curl -s -o /dev/null -w "%{http_code}" https://flowtask-cool-leaf-7076.fly.dev/ --max-time 15

Expected: 200
If the response code is not 200 (or the request times out), report the actual code and STOP.

Also fetch the API health endpoint:
curl -s https://flowtask-cool-leaf-7076.fly.dev/api/health --max-time 15

Expected: JSON with status "ok". If not, report what was returned.

--- STEP 5: Report ---
Send a final report to team-lead with the following format:

  Deploy Result: SUCCESS / FAILED
  Version: vN
  Machines: N started, N healthy
  HTTP check (app root): 200 / <actual code>
  HTTP check (/api/health): ok / <actual response>
  Log warnings: none / <list>

  (If FAILED, include the error output and which step failed.)
```

---

### 2. Collect and present results

Wait for the deployer agent to report back, then present the result to the user:

If **SUCCESS**:
```
Deploy — SUCCESS
================
Version: vN deployed to https://flowtask-cool-leaf-7076.fly.dev/
Machines: all healthy
App root: 200 OK
API health: ok
```

If **FAILED**:
```
Deploy — FAILED
===============
Failed at: [step name]
Reason: [error details]

Check `fly logs` for more information.
```

---

## Important Rules

- NEVER run commands in the main context — all work goes to the deployer agent.
- The agent MUST use `mode: "bypassPermissions"`.
- `fly` CLI must be on PATH — it is installed globally at `/usr/local/bin/fly` or `~/.fly/bin/fly`.
- If `fly deploy` fails, do NOT retry automatically — report the error so the user can investigate.
- Keep this context lean — only coordinate, never execute.
