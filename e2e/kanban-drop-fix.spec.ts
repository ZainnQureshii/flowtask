/**
 * Kanban Drag-and-Drop Fix Verification
 * Tests drops at upper half, middle, and lower half of each column.
 * Run in headed mode: pnpm exec playwright test e2e/kanban-drop-fix.spec.ts --headed
 */

import { test, expect, type Page, type Locator } from '@playwright/test';

const API = 'http://localhost:3001/api/tasks';
const TASK_A_ID = '64448998-af63-4d33-a910-a619d46c15ac';
const TASK_B_ID = '38fe6b56-dfe8-4c39-bf0c-3883dab3983e';

test.setTimeout(60000);

// Run with a large viewport so all columns are visible
test.use({
  viewport: { width: 1920, height: 1080 },
});

async function getTaskStatus(taskId: string): Promise<string> {
  const res = await fetch(`${API}/${taskId}`);
  const json = await res.json() as { data?: { status: string } };
  return json?.data?.status ?? 'unknown';
}

async function resetTask(taskId: string, status: string) {
  await fetch(`${API}/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  await new Promise(r => setTimeout(r, 600));
}

async function navigateToKanban(page: Page) {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Kanban', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'In Progress' })).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(500);
}

/** Find the droppable column div by its heading label text */
function getColumnByLabel(page: Page, label: string): Locator {
  // The column is the flex-col div that contains the h3 with the label
  return page.locator('div.rounded-lg').filter({
    has: page.locator('h3', { hasText: label }),
  }).first();
}

async function dragCardToColumnPosition(
  page: Page,
  cardText: string,
  column: Locator,
  yPercent: number  // 0.0 = top of column, 1.0 = bottom
) {
  const card = page.getByText(cardText, { exact: true }).first();
  await card.waitFor({ state: 'visible', timeout: 10000 });

  const cardBox = await card.boundingBox();
  if (!cardBox) throw new Error(`Card bounding box not found: ${cardText}`);

  const colBox = await column.boundingBox();
  if (!colBox) throw new Error(`Column bounding box not found`);

  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  const endX = colBox.x + colBox.width / 2;
  // Target Y within the column, clamped away from the very top/bottom header areas
  const endY = colBox.y + colBox.height * yPercent;

  console.log(`  Dragging from (${Math.round(startX)}, ${Math.round(startY)}) → (${Math.round(endX)}, ${Math.round(endY)}) [${Math.round(yPercent * 100)}% down column]`);

  // Pickup
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(300);

  // Move gradually — triggers dnd-kit drag events
  const steps = 15;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      startX + (endX - startX) * (i / steps),
      startY + (endY - startY) * (i / steps)
    );
    await page.waitForTimeout(30);
  }

  // Hold briefly to ensure collision detection fires
  await page.waitForTimeout(500);
  await page.mouse.up();
  await page.waitForTimeout(1500);
}

test.describe('Kanban Drop Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToKanban(page);
  });

  test('TEST 1: Drop in UPPER HALF (20%) of In Progress column', async ({ page }) => {
    await resetTask(TASK_A_ID, 'todo');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Kanban', exact: true }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/verify-kanban-fix-1-before.png' });

    const col = getColumnByLabel(page, 'In Progress');
    await dragCardToColumnPosition(page, 'Kanban Drop Test A', col, 0.20);
    await page.screenshot({ path: '/tmp/verify-kanban-fix-1-after.png' });

    const status = await getTaskStatus(TASK_A_ID);
    console.log(`  Status after drop: ${status}`);
    expect(status, `Expected in_progress, got "${status}"`).toBe('in_progress');
  });

  test('TEST 2: Drop in MIDDLE (50%) of Done column', async ({ page }) => {
    await resetTask(TASK_A_ID, 'todo');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Kanban', exact: true }).click();
    await page.waitForTimeout(800);

    const col = getColumnByLabel(page, 'Done');
    await dragCardToColumnPosition(page, 'Kanban Drop Test A', col, 0.50);
    await page.screenshot({ path: '/tmp/verify-kanban-fix-2-after.png' });

    const status = await getTaskStatus(TASK_A_ID);
    console.log(`  Status after drop: ${status}`);
    expect(status, `Expected done, got "${status}"`).toBe('done');
  });

  test('TEST 3: Drop in LOWER HALF (75%) of Archived column', async ({ page }) => {
    await resetTask(TASK_A_ID, 'todo');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Kanban', exact: true }).click();
    await page.waitForTimeout(800);

    const col = getColumnByLabel(page, 'Archived');
    await dragCardToColumnPosition(page, 'Kanban Drop Test A', col, 0.75);
    await page.screenshot({ path: '/tmp/verify-kanban-fix-3-after.png' });

    const status = await getTaskStatus(TASK_A_ID);
    console.log(`  Status after drop: ${status}`);
    expect(status, `Expected archived, got "${status}"`).toBe('archived');
  });

  test('TEST 4: Reverse — Archived to UPPER HALF (15%) of Todo', async ({ page }) => {
    await resetTask(TASK_A_ID, 'archived');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Kanban', exact: true }).click();
    await page.waitForTimeout(800);

    const col = getColumnByLabel(page, 'Todo');
    await dragCardToColumnPosition(page, 'Kanban Drop Test A', col, 0.15);
    await page.screenshot({ path: '/tmp/verify-kanban-fix-4-after.png' });

    const status = await getTaskStatus(TASK_A_ID);
    console.log(`  Status after drop: ${status}`);
    expect(status, `Expected todo, got "${status}"`).toBe('todo');
  });

  test('TEST 5: Task B drop onto In Progress at 25%', async ({ page }) => {
    await resetTask(TASK_B_ID, 'todo');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Kanban', exact: true }).click();
    await page.waitForTimeout(800);

    const col = getColumnByLabel(page, 'In Progress');
    await dragCardToColumnPosition(page, 'Kanban Drop Test B', col, 0.25);
    await page.screenshot({ path: '/tmp/verify-kanban-fix-5-after.png' });

    const status = await getTaskStatus(TASK_B_ID);
    console.log(`  Status after drop: ${status}`);
    expect(status, `Expected in_progress, got "${status}"`).toBe('in_progress');
  });

  test('TEST 6a: Drop at TOP 10% of Done column', async ({ page }) => {
    await resetTask(TASK_A_ID, 'todo');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Kanban', exact: true }).click();
    await page.waitForTimeout(800);

    const col = getColumnByLabel(page, 'Done');
    await dragCardToColumnPosition(page, 'Kanban Drop Test A', col, 0.10);
    await page.screenshot({ path: '/tmp/verify-kanban-fix-6a-after.png' });

    const status = await getTaskStatus(TASK_A_ID);
    console.log(`  Status after drop: ${status}`);
    expect(status, `Expected done, got "${status}"`).toBe('done');
  });

  test('TEST 6b: Drop at EXACT MIDDLE 50% of In Progress column', async ({ page }) => {
    await resetTask(TASK_A_ID, 'todo');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Kanban', exact: true }).click();
    await page.waitForTimeout(800);

    const col = getColumnByLabel(page, 'In Progress');
    await dragCardToColumnPosition(page, 'Kanban Drop Test A', col, 0.50);
    await page.screenshot({ path: '/tmp/verify-kanban-fix-6b-after.png' });

    const status = await getTaskStatus(TASK_A_ID);
    console.log(`  Status after drop: ${status}`);
    expect(status, `Expected in_progress, got "${status}"`).toBe('in_progress');
  });

  test('TEST 6c: Drop at BOTTOM 90% of Done column', async ({ page }) => {
    await resetTask(TASK_A_ID, 'todo');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Kanban', exact: true }).click();
    await page.waitForTimeout(800);

    const col = getColumnByLabel(page, 'Done');
    await dragCardToColumnPosition(page, 'Kanban Drop Test A', col, 0.90);
    await page.screenshot({ path: '/tmp/verify-kanban-fix-6c-after.png' });

    const status = await getTaskStatus(TASK_A_ID);
    console.log(`  Status after drop: ${status}`);
    expect(status, `Expected done, got "${status}"`).toBe('done');
  });
});
