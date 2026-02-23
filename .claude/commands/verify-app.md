# /verify-app — Full Browser Test Suite

Run a comprehensive browser test of the FlowTask app covering every feature. Use this after any fix or feature work.

## Steps

### 1. Create the team

Create a team called `verify-app`.

### 2. Ensure dev servers are running

Check whether the backend (port 3001) and frontend (port 5173) are already running:

```bash
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
lsof -ti:3001,5173
```

If either server is not running, start both from the project root (`/Users/zain/myFiles/claude-test/flowtask`) with:

```bash
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
pnpm dev
```

Wait until both servers are confirmed listening before spawning test agents.

### 3. Spawn test agents (staggered, one at a time)

Spawn each agent with:
- `model: "sonnet"`
- `mode: "bypassPermissions"`
- `max_turns: 20`

Set `PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"` in every agent's environment / bash commands.

Use Playwright in every agent: `import { chromium } from 'playwright'` (or `const { chromium } = require('playwright')`). Navigate to `http://localhost:5173`. Take screenshots on failures with `page.screenshot({ path: '/tmp/verify-app-<agent>-<test>.png' })`.

Stagger agent spawning — wait for each previous agent to confirm it has started before launching the next one.

---

#### Agent 1: "test-tasks" — Task CRUD

Test the following, reporting PASS or FAIL for each:

1. **Quick Capture create** — Open Quick Capture with Ctrl+K, type a task title, submit. Verify the new task appears in the task list.
2. **TaskForm create (all fields)** — Open the full task form, fill in: title, description, priority (High), due date (tomorrow), at least one tag. Save. Verify task appears with all fields populated correctly.
3. **Edit task** — Click edit on an existing task, change the title, save. Verify the updated title is shown.
4. **Delete task** — Delete a task. Verify it is removed from the list.
5. **Complete task** — Click the checkbox on a task. Verify it is marked as complete (visual change, e.g. strikethrough or moved to Done).
6. **List view verification** — Confirm tasks render in the list view with title, priority, and due date visible.

After all tests, send a message to the team lead with a results table (test name | PASS/FAIL | notes).

---

#### Agent 2: "test-views" — All Views

Test the following, reporting PASS or FAIL for each:

1. **List view** — Navigate to List view. Verify it loads and tasks are visible.
2. **Kanban view** — Switch to Kanban view. Verify four columns exist: Todo, In Progress, Done, Archived.
3. **Kanban drag — Todo to In Progress** — Drag a task card from the Todo column to In Progress. Verify it moves.
4. **Kanban drag — In Progress to Done** — Drag the same card from In Progress to Done. Verify it moves.
5. **Calendar view** — Switch to Calendar view. Verify it loads and tasks with due dates appear on the calendar.
6. **View switching** — Switch between List, Kanban, and Calendar views multiple times. Verify no crashes and correct content per view.

After all tests, send a message to the team lead with a results table (test name | PASS/FAIL | notes).

---

#### Agent 3: "test-features" — Productivity Features

Test the following, reporting PASS or FAIL for each:

1. **Quick Capture priority syntax** — Open Quick Capture (Ctrl+K), type a task with `!high` priority syntax, submit. Verify task is created with High priority.
2. **Quick Capture tag syntax** — Open Quick Capture, type a task with `#mytag` syntax, submit. Verify task is created with the tag attached.
3. **Quick Capture date syntax** — Open Quick Capture, type a task with `@tomorrow` date syntax, submit. Verify task is created with a due date set.
4. **Quick Capture search mode** — Open Quick Capture, type `/search someterm`. Verify it switches to search mode and shows search results (or empty state).
5. **Quick Capture command — theme switch** — Open Quick Capture, type `>theme`. Verify a theme-switching command appears and can be activated.
6. **Quick Capture command — view switch** — Open Quick Capture, type `>view`. Verify a view-switching command appears and can be activated.
7. **Pomodoro start** — Open the Pomodoro timer, click Start. Verify the timer counts down.
8. **Pomodoro pause** — While timer is running, click Pause. Verify it stops counting.
9. **Pomodoro reset** — Click Reset. Verify the timer returns to the initial value.
10. **Time tracking start** — On a task, start time tracking. Verify the tracker is running (elapsed time visible).
11. **Time tracking stop** — Stop the tracker. Verify a time entry is recorded.
12. **Time tracking manual entry** — Add a manual time entry. Verify it appears in the task's time log.
13. **Time tracking delete** — Delete a time entry. Verify it is removed.
14. **Subtasks add** — On a task, add a subtask. Verify it appears under the task.
15. **Subtasks complete** — Check the subtask checkbox. Verify it is marked complete.
16. **Subtasks delete** — Delete the subtask. Verify it is removed.

After all tests, send a message to the team lead with a results table (test name | PASS/FAIL | notes).

---

#### Agent 4: "test-settings" — Settings and Filters

Test the following, reporting PASS or FAIL for each:

1. **Theme toggle to dark** — Toggle to dark mode. Verify the UI switches to dark theme.
2. **Theme toggle to light** — Toggle back to light mode. Verify the UI switches back.
3. **Filter by status** — Apply a status filter (e.g. "In Progress"). Verify only tasks with that status are shown.
4. **Filter by priority** — Apply a priority filter (e.g. "High"). Verify only high-priority tasks are shown.
5. **Export data** — Trigger the export action. Verify a file is downloaded or export success is confirmed.
6. **Import data** — Trigger the import action with a valid data file. Verify tasks are imported successfully.
7. **Tag management — create** — In settings or tag manager, create a new tag. Verify it appears in the tag list.
8. **Tag management — assign to task** — Assign the new tag to a task. Verify the tag appears on the task.
9. **Tag management — delete** — Delete the tag. Verify it is removed from the tag list (and from the task if applicable).

After all tests, send a message to the team lead with a results table (test name | PASS/FAIL | notes).

---

### 4. Collect results and compile summary

After all four agents have reported back, compile their results into a single summary table:

| Module | Test | Result | Notes |
|--------|------|--------|-------|
| Tasks  | Quick Capture create | PASS/FAIL | ... |
| ...    | ...  | ...    | ... |

Highlight any FAILs with the exact error message or behavior observed, and the screenshot path if captured.

### 5. Clean up

Send `shutdown_request` to all agents, then call `TeamDelete` to clean up the `verify-app` team.
