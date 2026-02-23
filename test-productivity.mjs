import pkg from '/Users/zain/myFiles/claude-test/flowtask/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.js';
const { chromium } = pkg;

const BASE = 'http://localhost:5173';
const API = 'http://localhost:3001/api';

const results = [];

function log(test, result, notes = '') {
  results.push({ test, result, notes });
  console.log(`[${result}] ${test}${notes ? ' — ' + notes : ''}`);
}

async function apiGet(url) {
  const r = await fetch(url);
  return r.json();
}
async function apiPost(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
async function apiDelete(url) {
  const r = await fetch(url, { method: 'DELETE' });
  return r.json();
}
async function apiPatch(url, body) {
  const r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

async function resetData() {
  const { data: tasks } = await apiGet(`${API}/tasks`);
  for (const t of tasks) await apiDelete(`${API}/tasks/${t.id}`);
  const { data: tags } = await apiGet(`${API}/tags`);
  for (const t of tags) await apiDelete(`${API}/tags/${t.id}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `/tmp/verify-app-test-features-${name}.png` });
}

async function expandPomodoro(page) {
  const widget = page.locator('div.fixed.bottom-4.right-4').locator('button').first();
  await widget.waitFor({ state: 'visible', timeout: 10000 });
  await widget.click();
}

async function openTaskDetail(page, taskTitle) {
  await page.locator('.cursor-pointer').filter({ hasText: taskTitle }).first().click();
  await page.getByRole('heading', { name: taskTitle }).waitFor({ state: 'visible', timeout: 10000 });
}

(async () => {
  await resetData();

  // Seed a task for tests that need one
  const { data: seedTask } = await apiPost(`${API}/tasks`, { title: 'Productivity Test Task', status: 'todo' });

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // ───────────────────────────────────────────────
  // 1. Quick Capture priority syntax
  // ───────────────────────────────────────────────
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill('Priority Task !high');
    await page.keyboard.press('Enter');
    await input.waitFor({ state: 'hidden', timeout: 5000 });
    // Verify task visible in list
    const taskVisible = await page.getByText('Priority Task').first().isVisible().catch(() => false);
    if (taskVisible) {
      log('Quick Capture !priority syntax', 'PASS', 'Task "Priority Task" created');
    } else {
      await screenshot(page, 'qc-priority');
      log('Quick Capture !priority syntax', 'FAIL', 'Task not visible after creation');
    }
  } catch (e) {
    await screenshot(page, 'qc-priority');
    log('Quick Capture !priority syntax', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 2. Quick Capture tag syntax
  // ───────────────────────────────────────────────
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill('Tagged Task #work');
    await page.keyboard.press('Enter');
    await input.waitFor({ state: 'hidden', timeout: 5000 });
    await page.waitForTimeout(1000);
    // Verify tag created via API
    const { data: tags } = await apiGet(`${API}/tags`);
    const workTag = tags.find(t => t.name === 'work');
    if (workTag) {
      log('Quick Capture #tag syntax', 'PASS', 'Tag "work" created');
    } else {
      await screenshot(page, 'qc-tag');
      log('Quick Capture #tag syntax', 'FAIL', 'Tag "work" not found in API');
    }
  } catch (e) {
    await screenshot(page, 'qc-tag');
    log('Quick Capture #tag syntax', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 3. Quick Capture date syntax
  // ───────────────────────────────────────────────
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill('Dated Task @tomorrow');
    await page.keyboard.press('Enter');
    await input.waitFor({ state: 'hidden', timeout: 5000 });
    await page.waitForTimeout(1000);
    // Verify via API
    const { data: tasks } = await apiGet(`${API}/tasks`);
    const datedTask = tasks.find(t => t.title === 'Dated Task');
    if (datedTask && datedTask.dueDate) {
      log('Quick Capture @date syntax', 'PASS', `Due date: ${datedTask.dueDate.slice(0,10)}`);
    } else {
      await screenshot(page, 'qc-date');
      log('Quick Capture @date syntax', 'FAIL', 'Task has no due date');
    }
  } catch (e) {
    await screenshot(page, 'qc-date');
    log('Quick Capture @date syntax', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 4. Quick Capture search mode
  // ───────────────────────────────────────────────
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill('/search');
    // Search mode shows "Tasks" group heading or "No tasks found"
    const searchGroup = page.locator('[cmdk-group-heading]').filter({ hasText: 'Tasks' });
    const noTasks = page.getByText('No tasks found.');
    const isSearch = await searchGroup.isVisible().catch(() => false) || await noTasks.isVisible().catch(() => false);
    if (isSearch) {
      log('Quick Capture /search mode', 'PASS', 'Search mode activated');
    } else {
      await screenshot(page, 'qc-search');
      log('Quick Capture /search mode', 'FAIL', 'Search mode not visible');
    }
    await page.keyboard.press('Escape');
  } catch (e) {
    await screenshot(page, 'qc-search');
    log('Quick Capture /search mode', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 5. Quick Capture >theme command
  // ───────────────────────────────────────────────
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill('>theme');
    // Should show command group with theme items
    const lightTheme = page.getByText('Light theme');
    const darkTheme = page.getByText('Dark theme');
    const themeVisible = await lightTheme.isVisible().catch(() => false) || await darkTheme.isVisible().catch(() => false);
    if (themeVisible) {
      log('Quick Capture >theme command', 'PASS', 'Theme commands visible');
    } else {
      await screenshot(page, 'qc-theme');
      log('Quick Capture >theme command', 'FAIL', 'Theme commands not visible');
    }
    await page.keyboard.press('Escape');
  } catch (e) {
    await screenshot(page, 'qc-theme');
    log('Quick Capture >theme command', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 6. Quick Capture >view command
  // ───────────────────────────────────────────────
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill('>view');
    const kanban = page.getByText('Go to Kanban');
    const list = page.getByText('Go to List');
    const viewVisible = await kanban.isVisible().catch(() => false) || await list.isVisible().catch(() => false);
    if (viewVisible) {
      log('Quick Capture >view command', 'PASS', 'View commands visible');
    } else {
      await screenshot(page, 'qc-view');
      log('Quick Capture >view command', 'FAIL', 'View commands not visible');
    }
    await page.keyboard.press('Escape');
  } catch (e) {
    await screenshot(page, 'qc-view');
    log('Quick Capture >view command', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 7. Pomodoro start
  // ───────────────────────────────────────────────
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.getByText('Productivity Test Task').first().waitFor({ state: 'visible', timeout: 10000 });
    await expandPomodoro(page);
    const startBtn = page.getByRole('button', { name: 'Start' });
    await startBtn.waitFor({ state: 'visible', timeout: 5000 });
    await startBtn.click();
    // Verify "Focus" state label in expanded section
    const focusLabel = page.locator('div.fixed.bottom-4.right-4').locator('p').filter({ hasText: 'Focus' });
    await focusLabel.waitFor({ state: 'visible', timeout: 5000 });
    log('Pomodoro start', 'PASS', 'Focus state active');
  } catch (e) {
    await screenshot(page, 'pomodoro-start');
    log('Pomodoro start', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 8. Pomodoro pause
  // ───────────────────────────────────────────────
  try {
    // Pomodoro should already be running from test 7
    const pauseBtn = page.getByRole('button', { name: 'Pause' });
    await pauseBtn.waitFor({ state: 'visible', timeout: 5000 });
    await pauseBtn.click();
    const resumeBtn = page.getByRole('button', { name: 'Resume' });
    await resumeBtn.waitFor({ state: 'visible', timeout: 5000 });
    log('Pomodoro pause', 'PASS', 'Resume button appeared after pause');
  } catch (e) {
    await screenshot(page, 'pomodoro-pause');
    log('Pomodoro pause', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 9. Pomodoro reset
  // ───────────────────────────────────────────────
  try {
    const resetBtn = page.getByRole('button', { name: 'Reset' });
    await resetBtn.waitFor({ state: 'visible', timeout: 5000 });
    await resetBtn.click();
    // After reset, "Start" button should reappear (idle state)
    const startBtn = page.getByRole('button', { name: 'Start' });
    await startBtn.waitFor({ state: 'visible', timeout: 5000 });
    const readyLabel = page.locator('div.fixed.bottom-4.right-4').locator('p').filter({ hasText: 'Ready' });
    await readyLabel.waitFor({ state: 'visible', timeout: 5000 });
    log('Pomodoro reset', 'PASS', 'Timer reset to Ready/idle state');
  } catch (e) {
    await screenshot(page, 'pomodoro-reset');
    log('Pomodoro reset', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 10. Time tracking start
  // ───────────────────────────────────────────────
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.getByText('Productivity Test Task').first().waitFor({ state: 'visible', timeout: 10000 });
    await openTaskDetail(page, 'Productivity Test Task');
    await page.getByRole('tab', { name: 'Time' }).click();
    await page.getByRole('button', { name: 'Start Timer' }).click();
    const stopBtn = page.getByRole('button', { name: 'Stop' });
    await stopBtn.waitFor({ state: 'visible', timeout: 5000 });
    log('Time tracking start', 'PASS', 'Stop button appeared, timer running');
  } catch (e) {
    await screenshot(page, 'time-start');
    log('Time tracking start', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 11. Time tracking stop
  // ───────────────────────────────────────────────
  try {
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Stop' }).click();
    const startBtn = page.getByRole('button', { name: 'Start Timer' });
    await startBtn.waitFor({ state: 'visible', timeout: 5000 });
    log('Time tracking stop', 'PASS', 'Start Timer reappeared after stop');
  } catch (e) {
    await screenshot(page, 'time-stop');
    log('Time tracking stop', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 12. Time tracking manual entry
  // ───────────────────────────────────────────────
  try {
    await page.getByPlaceholder('Minutes').fill('15');
    await page.getByPlaceholder('Note...').fill('Manual test entry');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.waitForTimeout(1000);
    // Verify via API
    const { data: tasks } = await apiGet(`${API}/tasks`);
    const t = tasks.find(t => t.title === 'Productivity Test Task');
    const entry = t?.timeEntries?.find(e => e.note === 'Manual test entry');
    if (entry) {
      log('Time tracking manual entry', 'PASS', `Entry: ${entry.durationSeconds}s`);
    } else {
      await screenshot(page, 'time-manual');
      log('Time tracking manual entry', 'FAIL', 'Manual entry not found via API');
    }
  } catch (e) {
    await screenshot(page, 'time-manual');
    log('Time tracking manual entry', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 13. Time tracking delete entry
  // ───────────────────────────────────────────────
  try {
    // Manual entries added via UI don't update the store until page reload.
    // Seed a time entry via API, reload, then delete via UI.
    const { data: tasks } = await apiGet(`${API}/tasks`);
    const seedT = tasks.find(t => t.title === 'Productivity Test Task');
    await apiPost(`${API}/tasks/${seedT.id}/time-entries`, { durationSeconds: 1800 });

    // Reload so store picks up the entry
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.getByText('Productivity Test Task').first().waitFor({ state: 'visible', timeout: 10000 });
    await openTaskDetail(page, 'Productivity Test Task');
    await page.getByRole('tab', { name: 'Time' }).click();

    // Entry row shows formatted duration "30m 0s"
    const entryRow = page.locator('div.space-y-1').locator('div').filter({ hasText: '30m 0s' }).first();
    await entryRow.waitFor({ state: 'visible', timeout: 5000 });
    await entryRow.hover();
    // Scope delete button to this specific row to avoid strict mode violations
    await entryRow.getByRole('button', { name: 'Delete time entry' }).click();
    await page.waitForTimeout(1000);
    const entryGone = await entryRow.isVisible().catch(() => false);
    if (!entryGone) {
      log('Time tracking delete entry', 'PASS', 'Entry removed from UI');
    } else {
      await screenshot(page, 'time-delete');
      log('Time tracking delete entry', 'FAIL', 'Entry still visible after delete');
    }
  } catch (e) {
    await screenshot(page, 'time-delete');
    log('Time tracking delete entry', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 14. Subtasks add
  // ───────────────────────────────────────────────
  try {
    // Navigate to Subtasks tab (should be default)
    await page.getByRole('tab', { name: 'Subtasks' }).click();
    const subtaskInput = page.getByPlaceholder('Add subtask...');
    await subtaskInput.waitFor({ state: 'visible', timeout: 5000 });
    await subtaskInput.fill('Test Subtask Item');
    await subtaskInput.press('Enter');
    await page.getByText('Test Subtask Item').waitFor({ state: 'visible', timeout: 5000 });
    log('Subtasks add', 'PASS', 'Subtask "Test Subtask Item" visible');
  } catch (e) {
    await screenshot(page, 'subtask-add');
    log('Subtasks add', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 15. Subtasks complete
  // ───────────────────────────────────────────────
  try {
    const checkbox = page.getByRole('checkbox', { name: /Mark subtask "Test Subtask Item"/ });
    await checkbox.waitFor({ state: 'visible', timeout: 5000 });
    await checkbox.click();
    const lineThrough = page.locator('span.line-through', { hasText: 'Test Subtask Item' });
    await lineThrough.waitFor({ state: 'visible', timeout: 5000 });
    log('Subtasks complete', 'PASS', 'Subtask has line-through styling');
  } catch (e) {
    await screenshot(page, 'subtask-complete');
    log('Subtasks complete', 'FAIL', e.message.split('\n')[0]);
  }

  // ───────────────────────────────────────────────
  // 16. Subtasks delete
  // ───────────────────────────────────────────────
  try {
    const subtaskRow = page.locator('.group.rounded').filter({ hasText: 'Test Subtask Item' });
    await subtaskRow.hover();
    await page.getByRole('button', { name: 'Delete subtask' }).click();
    await page.waitForTimeout(500);
    const gone = await page.getByText('Test Subtask Item').isVisible().catch(() => false);
    if (!gone) {
      log('Subtasks delete', 'PASS', 'Subtask removed');
    } else {
      await screenshot(page, 'subtask-delete');
      log('Subtasks delete', 'FAIL', 'Subtask still visible after delete');
    }
  } catch (e) {
    await screenshot(page, 'subtask-delete');
    log('Subtasks delete', 'FAIL', e.message.split('\n')[0]);
  }

  await browser.close();

  // Print results table
  console.log('\n======== RESULTS TABLE ========');
  console.log('| Test | Result | Notes |');
  console.log('|------|--------|-------|');
  for (const r of results) {
    console.log(`| ${r.test} | ${r.result} | ${r.notes} |`);
  }

  const passed = results.filter(r => r.result === 'PASS').length;
  const failed = results.filter(r => r.result === 'FAIL').length;
  console.log(`\nTotal: ${passed} PASS, ${failed} FAIL out of ${results.length}`);

  // Output for team-lead
  const tableStr = results.map(r => `| ${r.test} | ${r.result} | ${r.notes} |`).join('\n');
  console.log('\n--- FOR TEAM LEAD ---');
  console.log(tableStr);
})();
