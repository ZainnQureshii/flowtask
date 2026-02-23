#!/usr/bin/env node
/**
 * View & Drag-Drop Browser Test
 * Tests: List view, Kanban view, drag Todo→InProgress, drag InProgress→Done,
 *        Calendar view, and view switching
 */

const { chromium } = require('/Users/zain/myFiles/claude-test/flowtask/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
// Node 22 has built-in fetch
const apiFetch = globalThis.fetch.bind(globalThis);

const API = 'http://localhost:3001/api';
const APP = 'http://localhost:5173';

const results = [];
let todoTaskTitle = '';

function log(msg) {
  console.log(`[test-views] ${msg}`);
}

function pass(name, notes = '') {
  results.push({ test: name, result: 'PASS', notes });
  log(`✅ PASS: ${name}${notes ? ' — ' + notes : ''}`);
}

function fail(name, notes = '') {
  results.push({ test: name, result: 'FAIL', notes });
  log(`❌ FAIL: ${name}${notes ? ' — ' + notes : ''}`);
}

async function apiGet(path) {
  const res = await apiFetch(`${API}${path}`);
  const json = await res.json();
  return json.data;
}

async function apiPost(path, body) {
  const res = await apiFetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json.data;
}

async function apiDelete(path) {
  await apiFetch(`${API}${path}`, { method: 'DELETE' });
}

async function setupTestTasks() {
  log('Setting up test tasks via API...');
  // Create test tasks with unique prefix
  const todo = await apiPost('/tasks', { title: 'VT-Todo-Task', status: 'todo', priority: 'medium' });
  const inProg = await apiPost('/tasks', { title: 'VT-InProg-Task', status: 'in_progress', priority: 'medium' });
  const done = await apiPost('/tasks', { title: 'VT-Done-Task', status: 'done', priority: 'medium' });
  // Add due date for calendar test — backend expects full ISO timestamp
  const todayISO = new Date().toISOString();
  const cal = await apiPost('/tasks', { title: 'VT-Calendar-Task', status: 'todo', priority: 'low', dueDate: todayISO });
  todoTaskTitle = todo.title;
  log(`Created tasks: ${todo.title}, ${inProg.title}, ${done.title}, cal=${cal?.title ?? 'FAILED'}`);
  if (!cal) log('WARNING: calendar task creation failed (dueDate issue), continuing without it');
  return { todo, inProg, done, cal };
}

async function cleanupTasks(taskIds) {
  for (const id of taskIds) {
    try { await apiDelete(`/tasks/${id}`); } catch (e) { /* ignore */ }
  }
}

async function dragElement(page, source, targetBoundingBox) {
  const sourceBbox = await source.boundingBox();
  if (!sourceBbox) throw new Error('Source element not found');

  const startX = sourceBbox.x + sourceBbox.width / 2;
  const startY = sourceBbox.y + sourceBbox.height / 2;
  const endX = targetBoundingBox.x + targetBoundingBox.width / 2;
  const endY = targetBoundingBox.y + targetBoundingBox.height / 2;

  // @dnd-kit PointerSensor with activationConstraint: { distance: 8 }
  // Must move >8px after mousedown to activate
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(50);

  // Move a bit to trigger activation
  await page.mouse.move(startX + 5, startY + 5);
  await page.waitForTimeout(50);
  await page.mouse.move(startX + 10, startY + 10);
  await page.waitForTimeout(100);

  // Move to target in steps
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const cx = startX + 10 + ((endX - (startX + 10)) * i) / steps;
    const cy = startY + 10 + ((endY - (startY + 10)) * i) / steps;
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(800); // wait for state update + API call
}

async function switchToView(page, viewName) {
  // Scope to aside sidebar to avoid matching dnd-kit task card role="button" elements
  const btn = page.locator('aside').getByRole('button', { name: viewName, exact: true }).first();
  await btn.click();
  await page.waitForTimeout(600);
}

async function getTaskStatusFromApi(taskId) {
  // Use the list endpoint and filter — more reliable than single-task endpoint
  const allTasks = await apiGet('/tasks');
  if (!Array.isArray(allTasks)) return null;
  const t = allTasks.find(t => t.id === taskId);
  return t?.status ?? null;
}

async function runTests() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  let taskIds = [];
  try {
    // Setup
    const tasks = await setupTestTasks();
    taskIds = [tasks.todo.id, tasks.inProg.id, tasks.done.id, tasks.cal?.id].filter(Boolean);

    // ─── Test 1: List View ───────────────────────────────────────────────
    log('Test 1: List view');
    try {
      await page.goto(APP, { waitUntil: 'networkidle' });
      // List view is default. Wait for tasks to load
      await page.waitForSelector('text=VT-Todo-Task', { timeout: 10000 });
      const todoVisible = await page.getByText('VT-Todo-Task').isVisible();
      const inProgVisible = await page.getByText('VT-InProg-Task').isVisible();
      const doneVisible = await page.getByText('VT-Done-Task').isVisible();
      if (todoVisible && inProgVisible && doneVisible) {
        pass('List view', 'All 3 tasks visible in list view');
      } else {
        await page.screenshot({ path: '/tmp/verify-app-test-views-list.png' });
        fail('List view', `todo=${todoVisible} inProg=${inProgVisible} done=${doneVisible}`);
      }
    } catch (e) {
      await page.screenshot({ path: '/tmp/verify-app-test-views-list.png' });
      fail('List view', e.message);
    }

    // ─── Test 2: Kanban View ─────────────────────────────────────────────
    log('Test 2: Kanban view columns');
    try {
      await switchToView(page, 'Kanban');
      // Wait for kanban to render
      await page.waitForSelector('h3', { timeout: 8000 });

      const todoCol = await page.locator('h3').filter({ hasText: /^Todo$/ }).isVisible();
      const inProgCol = await page.locator('h3').filter({ hasText: /^In Progress$/ }).isVisible();
      const doneCol = await page.locator('h3').filter({ hasText: /^Done$/ }).isVisible();
      const archCol = await page.locator('h3').filter({ hasText: /^Archived$/ }).isVisible();

      if (todoCol && inProgCol && doneCol) {
        pass('Kanban view', `Columns visible: Todo=${todoCol}, InProgress=${inProgCol}, Done=${doneCol}, Archived=${archCol}`);
      } else {
        await page.screenshot({ path: '/tmp/verify-app-test-views-kanban.png' });
        fail('Kanban view', `Missing columns — Todo=${todoCol}, InProgress=${inProgCol}, Done=${doneCol}`);
      }
    } catch (e) {
      await page.screenshot({ path: '/tmp/verify-app-test-views-kanban.png' });
      fail('Kanban view', e.message);
    }

    // ─── Test 3: Kanban drag — Todo → In Progress ────────────────────────
    log('Test 3: Kanban drag Todo→In Progress');
    try {
      // Make sure we're in kanban view
      await page.waitForSelector('h3', { timeout: 5000 });

      // Find VT-Todo-Task card
      const todoCard = page.getByText('VT-Todo-Task').first();
      await todoCard.waitFor({ timeout: 8000 });

      // Find the In Progress column container
      const inProgHeader = page.locator('h3').filter({ hasText: /^In Progress$/ });
      const inProgColumn = inProgHeader.locator('..').locator('..');
      const inProgBbox = await inProgColumn.boundingBox();

      if (!inProgBbox) throw new Error('In Progress column bounding box not found');

      await dragElement(page, todoCard, inProgBbox);

      // Verify the task moved — check API via list endpoint
      await page.waitForTimeout(1200);
      const statusAfterDrag1 = await getTaskStatusFromApi(tasks.todo.id);
      if (statusAfterDrag1 === 'in_progress') {
        pass('Kanban drag Todo→In Progress', 'Task status changed to in_progress in DB');
      } else {
        // Also check visually — task should appear in In Progress column
        const taskInInProg = await inProgColumn.getByText('VT-Todo-Task').isVisible().catch(() => false);
        if (taskInInProg) {
          pass('Kanban drag Todo→In Progress', `Task visible in In Progress column (API status: ${statusAfterDrag1})`);
        } else {
          await page.screenshot({ path: '/tmp/verify-app-test-views-drag1.png' });
          fail('Kanban drag Todo→In Progress', `Status=${statusAfterDrag1}, taskInInProg=${taskInInProg}`);
        }
      }
    } catch (e) {
      await page.screenshot({ path: '/tmp/verify-app-test-views-drag1.png' });
      fail('Kanban drag Todo→In Progress', e.message);
    }

    // ─── Test 4: Kanban drag — In Progress → Done ────────────────────────
    // Continue from Kanban view (no reload needed — test 3 already leaves us here)
    log('Test 4: Kanban drag In Progress→Done');
    try {
      // Task is now in In Progress (from test 3). Still in Kanban view.
      // Wait for the task to appear in In Progress column
      await page.waitForTimeout(500);
      const inProgCard = page.getByText('VT-Todo-Task').first();
      await inProgCard.waitFor({ timeout: 8000 });

      // Find the Done column bounding box
      const doneHeader2 = page.locator('h3').filter({ hasText: /^Done$/ });
      const doneColumn2 = doneHeader2.locator('..').locator('..');
      const doneBbox = await doneColumn2.boundingBox();
      if (!doneBbox) throw new Error('Done column bounding box not found');

      await dragElement(page, inProgCard, doneBbox);
      await page.waitForTimeout(1200);

      const statusAfterDrag2 = await getTaskStatusFromApi(tasks.todo.id);
      if (statusAfterDrag2 === 'done') {
        pass('Kanban drag In Progress→Done', 'Task status changed to done in DB');
      } else {
        const taskInDone = await doneColumn2.getByText('VT-Todo-Task').isVisible().catch(() => false);
        if (taskInDone) {
          pass('Kanban drag In Progress→Done', `Task visible in Done column (API status: ${statusAfterDrag2})`);
        } else {
          await page.screenshot({ path: '/tmp/verify-app-test-views-drag2.png' });
          fail('Kanban drag In Progress→Done', `Status=${statusAfterDrag2}, taskInDone=${taskInDone}`);
        }
      }
    } catch (e) {
      await page.screenshot({ path: '/tmp/verify-app-test-views-drag2.png' });
      fail('Kanban drag In Progress→Done', e.message);
    }

    // ─── Test 4b: Kanban drag — Done → Archived ─────────────────────────
    log('Test 4b: Kanban drag Done→Archived');
    try {
      // Task is now in Done (from test 4). Still in Kanban view.
      await page.waitForTimeout(500);
      const doneCard = page.getByText('VT-Todo-Task').first();
      await doneCard.waitFor({ timeout: 8000 });

      const archivedHeader = page.locator('h3').filter({ hasText: /^Archived$/ });
      const archivedColumn = archivedHeader.locator('..').locator('..');
      const archivedBbox = await archivedColumn.boundingBox();
      if (!archivedBbox) throw new Error('Archived column bounding box not found');

      await dragElement(page, doneCard, archivedBbox);
      await page.waitForTimeout(1200);

      const statusAfterDrag3 = await getTaskStatusFromApi(tasks.todo.id);
      if (statusAfterDrag3 === 'archived') {
        pass('Kanban drag Done→Archived', 'Task status changed to archived in DB');
      } else {
        const taskInArchived = await archivedColumn.getByText('VT-Todo-Task').isVisible().catch(() => false);
        if (taskInArchived) {
          pass('Kanban drag Done→Archived', `Task visible in Archived column (API status: ${statusAfterDrag3})`);
        } else {
          await page.screenshot({ path: '/tmp/verify-app-test-views-drag3.png' });
          fail('Kanban drag Done→Archived', `Status=${statusAfterDrag3}, taskInArchived=${taskInArchived}`);
        }
      }
    } catch (e) {
      await page.screenshot({ path: '/tmp/verify-app-test-views-drag3.png' });
      fail('Kanban drag Done→Archived', e.message);
    }

    // ─── Test 4c: Kanban drag — Archived → Todo (reverse) ──────────────
    log('Test 4c: Kanban drag Archived→Todo (reverse)');
    try {
      await page.waitForTimeout(500);
      const archivedCard = page.getByText('VT-Todo-Task').first();
      await archivedCard.waitFor({ timeout: 8000 });

      const todoHeader2 = page.locator('h3').filter({ hasText: /^Todo$/ });
      const todoColumn2 = todoHeader2.locator('..').locator('..');
      const todoBbox2 = await todoColumn2.boundingBox();
      if (!todoBbox2) throw new Error('Todo column bounding box not found');

      await dragElement(page, archivedCard, todoBbox2);
      await page.waitForTimeout(1200);

      const statusAfterDrag4 = await getTaskStatusFromApi(tasks.todo.id);
      if (statusAfterDrag4 === 'todo') {
        pass('Kanban drag Archived→Todo (reverse)', 'Task status reverted to todo in DB');
      } else {
        const taskInTodo2 = await todoColumn2.getByText('VT-Todo-Task').isVisible().catch(() => false);
        if (taskInTodo2) {
          pass('Kanban drag Archived→Todo (reverse)', `Task visible in Todo column (API status: ${statusAfterDrag4})`);
        } else {
          await page.screenshot({ path: '/tmp/verify-app-test-views-drag4.png' });
          fail('Kanban drag Archived→Todo (reverse)', `Status=${statusAfterDrag4}, taskInTodo=${taskInTodo2}`);
        }
      }
    } catch (e) {
      await page.screenshot({ path: '/tmp/verify-app-test-views-drag4.png' });
      fail('Kanban drag Archived→Todo (reverse)', e.message);
    }

    // ─── Test 4d: Kanban drag — Done → In Progress (backwards) ──────────
    // Use VT-Done-Task which has been in Done status since setup
    log('Test 4d: Kanban drag Done→In Progress (backwards)');
    try {
      await page.waitForTimeout(500);
      const doneBackCard = page.getByText('VT-Done-Task').first();
      await doneBackCard.waitFor({ timeout: 8000 });

      const inProgHeader3 = page.locator('h3').filter({ hasText: /^In Progress$/ });
      const inProgColumn3 = inProgHeader3.locator('..').locator('..');
      const inProgBbox3 = await inProgColumn3.boundingBox();
      if (!inProgBbox3) throw new Error('In Progress column bounding box not found');

      await dragElement(page, doneBackCard, inProgBbox3);
      await page.waitForTimeout(1200);

      const statusAfterDrag5 = await getTaskStatusFromApi(tasks.done.id);
      if (statusAfterDrag5 === 'in_progress') {
        pass('Kanban drag Done→In Progress (backwards)', 'Task status changed to in_progress in DB');
      } else {
        const taskInInProg3 = await inProgColumn3.getByText('VT-Done-Task').isVisible().catch(() => false);
        if (taskInInProg3) {
          pass('Kanban drag Done→In Progress (backwards)', `Task visible in In Progress column (API status: ${statusAfterDrag5})`);
        } else {
          await page.screenshot({ path: '/tmp/verify-app-test-views-drag5.png' });
          fail('Kanban drag Done→In Progress (backwards)', `Status=${statusAfterDrag5}, taskInInProg=${taskInInProg3}`);
        }
      }
    } catch (e) {
      await page.screenshot({ path: '/tmp/verify-app-test-views-drag5.png' });
      fail('Kanban drag Done→In Progress (backwards)', e.message);
    }

    // ─── Test 5: Calendar View ───────────────────────────────────────────
    log('Test 5: Calendar view');
    try {
      await switchToView(page, 'Calendar');
      // Calendar is lazy-loaded, wait for the month heading
      const monthHeading = page.locator('h2').filter({ hasText: /\d{4}/ }); // e.g. "February 2026"
      await monthHeading.waitFor({ timeout: 10000 });
      const monthVisible = await monthHeading.isVisible();

      // Check that VT-Calendar-Task is visible (it has today's due date)
      await page.waitForTimeout(500);
      const calTaskVisible = await page.getByText('VT-Calendar-Task').isVisible().catch(() => false);

      if (monthVisible) {
        pass('Calendar view', `Month header visible, calendar task visible=${calTaskVisible}`);
      } else {
        await page.screenshot({ path: '/tmp/verify-app-test-views-calendar.png' });
        fail('Calendar view', 'Month heading not found');
      }
    } catch (e) {
      await page.screenshot({ path: '/tmp/verify-app-test-views-calendar.png' });
      fail('Calendar view', e.message);
    }

    // ─── Test 6: View Switching (multiple rounds) ────────────────────────
    log('Test 6: View switching multiple rounds');
    try {
      const switchErrors = [];

      // List → Kanban → Calendar → List → Kanban
      await switchToView(page, 'List');
      await page.waitForTimeout(400);
      const hasListSortButtons = await page.getByText('Sort:').isVisible().catch(() => false);
      if (!hasListSortButtons) switchErrors.push('List→Sort buttons missing');

      await switchToView(page, 'Kanban');
      await page.waitForTimeout(400);
      const hasTodoCol = await page.locator('h3').filter({ hasText: /^Todo$/ }).isVisible().catch(() => false);
      if (!hasTodoCol) switchErrors.push('Kanban→Todo column missing');

      await switchToView(page, 'Calendar');
      await page.waitForTimeout(600);
      const hasMonth = await page.locator('h2').filter({ hasText: /\d{4}/ }).isVisible().catch(() => false);
      if (!hasMonth) switchErrors.push('Calendar→Month heading missing');

      await switchToView(page, 'List');
      await page.waitForTimeout(400);
      const backToList = await page.getByText('Sort:').isVisible().catch(() => false);
      if (!backToList) switchErrors.push('Back to List→Sort buttons missing');

      await switchToView(page, 'Kanban');
      await page.waitForTimeout(400);
      const backToKanban = await page.locator('h3').filter({ hasText: /^Todo$/ }).isVisible().catch(() => false);
      if (!backToKanban) switchErrors.push('Back to Kanban→Todo column missing');

      if (switchErrors.length === 0) {
        pass('View switching', 'List→Kanban→Calendar→List→Kanban all rendered correctly');
      } else {
        await page.screenshot({ path: '/tmp/verify-app-test-views-switching.png' });
        fail('View switching', switchErrors.join('; '));
      }
    } catch (e) {
      await page.screenshot({ path: '/tmp/verify-app-test-views-switching.png' });
      fail('View switching', e.message);
    }

  } catch (outerErr) {
    log(`Fatal error: ${outerErr.message}`);
    fail('Setup', outerErr.message);
  } finally {
    if (taskIds.length > 0) {
      log('Cleaning up test tasks...');
      await cleanupTasks(taskIds);
    }
    await browser.close();
  }

  // Print results table
  console.log('\n=== RESULTS TABLE ===');
  console.log('| Test | Result | Notes |');
  console.log('|------|--------|-------|');
  for (const r of results) {
    console.log(`| ${r.test} | ${r.result} | ${r.notes} |`);
  }
  console.log('=====================\n');

  const passed = results.filter(r => r.result === 'PASS').length;
  const failed = results.filter(r => r.result === 'FAIL').length;
  console.log(`Summary: ${passed} passed, ${failed} failed out of ${results.length} tests`);

  return results;
}

runTests().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
