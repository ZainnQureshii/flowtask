import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function resetData(request: APIRequestContext) {
  const res = await request.get(`${API}/tasks`);
  const { data } = await res.json();
  for (const task of data) {
    await request.delete(`${API}/tasks/${task.id}`);
  }
}

test.describe('View Switching', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
    await request.post(`${API}/tasks`, { data: { title: 'ViewTest Todo', status: 'todo' } });
    await request.post(`${API}/tasks`, { data: { title: 'ViewTest InProg', status: 'in_progress' } });
    await request.post(`${API}/tasks`, { data: { title: 'ViewTest Done', status: 'done' } });
  });

  test('list view shows all tasks', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('ViewTest Todo')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('ViewTest InProg')).toBeVisible();
    await expect(page.getByText('ViewTest Done')).toBeVisible();
  });

  test('switch to kanban view via sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ViewTest Todo')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Kanban/i }).click();

    // Kanban column headings
    await expect(page.getByRole('heading', { name: 'Todo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'In Progress' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Done' })).toBeVisible();

    // Tasks visible in kanban
    await expect(page.getByText('ViewTest Todo')).toBeVisible();
    await expect(page.getByText('ViewTest InProg')).toBeVisible();
    await expect(page.getByText('ViewTest Done')).toBeVisible();
  });

  test('switch to calendar view via sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ViewTest Todo')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Calendar/i }).click();

    // Calendar view should load (lazy loaded)
    await expect(page.locator('main')).toBeVisible();
  });
});
