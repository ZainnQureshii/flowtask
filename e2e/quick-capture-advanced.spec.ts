import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function resetData(request: APIRequestContext) {
  const res = await request.get(`${API}/tasks`);
  const { data } = await res.json();
  for (const task of data) {
    await request.delete(`${API}/tasks/${task.id}`);
  }
  const tagsRes = await request.get(`${API}/tags`);
  const { data: tags } = await tagsRes.json();
  for (const tag of tags) {
    await request.delete(`${API}/tags/${tag.id}`);
  }
}

test.describe('Quick Capture Advanced', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('create task with #tag syntax', async ({ page, request }) => {
    await page.goto('/');

    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await expect(input).toBeVisible();

    await input.fill('Buy milk #shopping');
    await page.keyboard.press('Enter');

    await expect(input).not.toBeVisible();
    await expect(page.getByText('Buy milk')).toBeVisible({ timeout: 10000 });

    // Verify tag "shopping" was created via API
    const tagsRes = await request.get(`${API}/tags`);
    const { data: tags } = await tagsRes.json();
    const shoppingTag = tags.find((t: any) => t.name === 'shopping');
    expect(shoppingTag).toBeTruthy();

    // Verify task has the tag
    const tasksRes = await request.get(`${API}/tasks`);
    const { data: tasks } = await tasksRes.json();
    const buyMilkTask = tasks.find((t: any) => t.title === 'Buy milk');
    expect(buyMilkTask).toBeTruthy();
    expect(buyMilkTask.tags.some((tag: any) => tag.name === 'shopping')).toBe(true);
  });

  test('create task with @today date syntax', async ({ page, request }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await expect(input).toBeVisible();

    await input.fill('Meeting @today');
    await page.keyboard.press('Enter');

    await expect(input).not.toBeVisible();

    const tasksRes = await request.get(`${API}/tasks`);
    const { data: tasks } = await tasksRes.json();
    const meetingTask = tasks.find((t: any) => t.title === 'Meeting');
    expect(meetingTask).toBeTruthy();
    // dueDate should be today in ISO format
    const today = new Date().toISOString().split('T')[0];
    expect(meetingTask.dueDate).toContain(today);
  });

  test('create task with @tomorrow date syntax', async ({ page, request }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await expect(input).toBeVisible();

    await input.fill('Call dentist @tomorrow');
    await page.keyboard.press('Enter');

    await expect(input).not.toBeVisible();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tasksRes = await request.get(`${API}/tasks`);
    const { data: tasks } = await tasksRes.json();
    const dentistTask = tasks.find((t: any) => t.title === 'Call dentist');
    expect(dentistTask).toBeTruthy();
    expect(dentistTask.dueDate).toContain(tomorrowStr);
  });

  test('search mode with /prefix', async ({ page, request }) => {
    await request.post(`${API}/tasks`, { data: { title: 'Searchable Task', status: 'todo' } });
    await page.goto('/');
    await expect(page.getByText('Searchable Task')).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await expect(input).toBeVisible();

    await input.fill('/Searchable');

    // Search results should show the task
    const cmdkList = page.locator('[cmdk-list]');
    await expect(cmdkList.getByText('Searchable Task')).toBeVisible({ timeout: 5000 });

    // Click to open task detail
    await cmdkList.getByText('Searchable Task').click();
    await expect(input).not.toBeVisible();
  });

  test('command mode with >prefix — dark theme', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await expect(input).toBeVisible();

    await input.fill('>');

    const cmdkList = page.locator('[cmdk-list]');
    await expect(cmdkList.getByText('Dark theme')).toBeVisible({ timeout: 5000 });

    await cmdkList.getByText('Dark theme').click();
    await expect(input).not.toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });
  });

  test('command mode switch to kanban', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await expect(input).toBeVisible();

    await input.fill('>');

    const cmdkList = page.locator('[cmdk-list]');
    await expect(cmdkList.getByText('Go to Kanban')).toBeVisible({ timeout: 5000 });

    await cmdkList.getByText('Go to Kanban').click();
    await expect(input).not.toBeVisible();

    // Verify kanban view loaded
    await expect(page.getByRole('heading', { name: 'Todo' })).toBeVisible({ timeout: 5000 });
  });
});
