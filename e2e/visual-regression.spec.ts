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

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
    await request.post(`${API}/tasks`, { data: { title: 'Screenshot Task 1', status: 'todo', priority: 'high' } });
    await request.post(`${API}/tasks`, { data: { title: 'Screenshot Task 2', status: 'in_progress' } });
    await request.post(`${API}/tasks`, { data: { title: 'Screenshot Task 3', status: 'done' } });
  });

  test('list view', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Screenshot Task 1')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveScreenshot('list-view.png', { fullPage: true });
  });

  test('kanban view', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Screenshot Task 1')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Kanban/i }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('kanban-view.png', { fullPage: true });
  });

  test('calendar view', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Calendar/i }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('calendar-view.png', { fullPage: true });
  });

  test('settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('settings.png', { fullPage: true });
  });

  test('dark mode', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Dark' }).click();
    await page.goto('/');
    await expect(page.getByText('Screenshot Task 1')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveScreenshot('dark-mode.png', { fullPage: true });
  });

  test('task form dialog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('task-form.png');
  });

  test('task detail panel', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Screenshot Task 1')).toBeVisible({ timeout: 10000 });
    await page.locator('.cursor-pointer').filter({ hasText: 'Screenshot Task 1' }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('task-detail.png', { fullPage: true });
  });
});
