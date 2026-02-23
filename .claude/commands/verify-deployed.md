# /verify-deployed — Production Smoke Test

Run a smoke test against the live Fly.io deployment to verify the app is up, the API responds correctly, and the frontend renders. No local servers needed.

**Production URL**: `https://flowtask-cool-leaf-7076.fly.dev/`

## Steps

### 1. Create the team

Create a team called `verify-deployed`.

### 2. Spawn test agents (staggered, one at a time)

Spawn each agent with:
- `model: "sonnet"`
- `mode: "bypassPermissions"`
- `max_turns: 15`

No Node PATH needed — agents use `curl` and Playwright's system install.

Stagger spawning — confirm each agent has started before launching the next.

---

#### Agent 1: "test-api" — API Health & Endpoints

Test the following, reporting PASS or FAIL for each:

1. **Frontend 200** — `curl -s -o /dev/null -w "%{http_code}" https://flowtask-cool-leaf-7076.fly.dev/` — must return `200`.
2. **Frontend HTML content** — `curl -s https://flowtask-cool-leaf-7076.fly.dev/` — response body must contain `<div id="root">` (React mount point).
3. **GET /api/tasks** — `curl -s -o /dev/null -w "%{http_code}" https://flowtask-cool-leaf-7076.fly.dev/api/tasks` — must return `200`.
4. **GET /api/tasks response shape** — `curl -s https://flowtask-cool-leaf-7076.fly.dev/api/tasks` — response must be valid JSON with a `data` key (array).
5. **GET /api/preferences** — `curl -s -o /dev/null -w "%{http_code}" https://flowtask-cool-leaf-7076.fly.dev/api/preferences` — must return `200`.
6. **GET /api/tags** — `curl -s -o /dev/null -w "%{http_code}" https://flowtask-cool-leaf-7076.fly.dev/api/tags` — must return `200`.
7. **Health check** — `curl -s https://flowtask-cool-leaf-7076.fly.dev/api/health` — if endpoint exists, response must contain `"ok"` or `"status"`.
8. **404 for unknown route** — `curl -s -o /dev/null -w "%{http_code}" https://flowtask-cool-leaf-7076.fly.dev/api/nonexistent` — must return `404` (not 200 or 500).
9. **SPA client-side routing** — `curl -s -o /dev/null -w "%{http_code}" https://flowtask-cool-leaf-7076.fly.dev/some-client-route` — must return `200` (backend falls through to index.html for SPA routing).

After all tests, send a message to the team lead with a results table (test name | PASS/FAIL | notes).

---

#### Agent 2: "test-browser" — Frontend Render Verification

Use Playwright to navigate to `https://flowtask-cool-leaf-7076.fly.dev/` (no localhost). Take screenshots on failures with `page.screenshot({ path: '/tmp/verify-deployed-<test>.png' })`.

Test the following, reporting PASS or FAIL for each:

1. **Page loads without JS errors** — Navigate to the production URL, wait for `networkidle`. Verify no unhandled JS errors occurred (listen for `page.on('pageerror', ...)`).
2. **App title visible** — Verify the page title or heading contains "FlowTask" (case-insensitive).
3. **Task list renders** — Verify a task list container element is present in the DOM (look for task-related elements like `[data-testid="task-list"]`, `.task-list`, `ul`, or any visible task items).
4. **Navigation present** — Verify navigation elements exist (view switcher buttons or sidebar links for List/Kanban/Calendar views).
5. **Quick Capture accessible** — Press Ctrl+K (or look for the Quick Capture trigger button). Verify a modal or input opens.
6. **No blank screen** — Verify the `<div id="root">` is not empty (has child elements). A blank white screen means the React app failed to mount.
7. **Kanban view loads** — Click the Kanban view button. Verify the Kanban board renders (look for column headers or `[data-testid="kanban"]`).
8. **API data displayed** — Verify that task data from `/api/tasks` is being rendered in the UI (at least one task card visible, or the empty state message if no tasks exist — either is fine, a crash is not).

After all tests, send a message to the team lead with a results table (test name | PASS/FAIL | notes, including screenshot paths on failures).

---

### 3. Collect results and compile summary

After both agents have reported back, compile their results into a single summary table:

| Module | Test | Result | Notes |
|--------|------|--------|-------|
| API    | Frontend 200 | PASS/FAIL | ... |
| API    | GET /api/tasks | PASS/FAIL | ... |
| ...    | ... | ... | ... |
| Browser | Page loads without JS errors | PASS/FAIL | ... |
| ...    | ... | ... | ... |

Highlight any FAILs with the exact error or HTTP status observed, and screenshot paths if captured.

Print a one-line verdict at the end:

- **ALL PASS** — Production deployment is healthy.
- **N FAILURES** — Production issues detected. See table above.

### 4. Clean up

Send `shutdown_request` to all agents, then call `TeamDelete` to clean up the `verify-deployed` team.
