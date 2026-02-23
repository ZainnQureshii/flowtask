import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function resetData(request: APIRequestContext) {
  const res = await request.get(`${API}/tasks`);
  const { data } = await res.json();
  for (const task of data) {
    await request.delete(`${API}/tasks/${task.id}`);
  }
}

test.describe('Task Card Actions', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('change priority via kebab menu', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Priority Change Task', status: 'todo', priority: 'medium' },
    });

    await page.goto('/');
    await expect(page.getByText('Priority Change Task')).toBeVisible({ timeout: 10000 });

    // Hover the task card to reveal the kebab menu
    const card = page.locator('.group').filter({ hasText: 'Priority Change Task' });
    await card.hover();

    // Click the kebab menu button (last button in the card)
    await card.locator('button').last().click();

    // Click "Set urgent" menu item
    await page.getByRole('menuitem', { name: /Set urgent/i }).click();

    // The list view badge only shows an icon, not the label text.
    // Open the task detail panel to verify the priority label change.
    await page.locator('.cursor-pointer').filter({ hasText: 'Priority Change Task' }).click();
    await expect(page.getByRole('heading', { name: 'Priority Change Task' })).toBeVisible({ timeout: 5000 });

    // The detail panel priority badge shows the label text
    await expect(page.locator('.fixed.right-0').getByText('Urgent')).toBeVisible({ timeout: 5000 });
  });

  test('start timer from kebab menu', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Timer Kebab Task', status: 'todo' },
    });

    await page.goto('/');
    await expect(page.getByText('Timer Kebab Task')).toBeVisible({ timeout: 10000 });

    // Hover and open kebab menu
    const card = page.locator('.group').filter({ hasText: 'Timer Kebab Task' });
    await card.hover();
    await card.locator('button').last().click();

    // Click "Start Timer"
    await page.getByRole('menuitem', { name: /Start Timer/i }).click();

    // Verify some timer indicator appears — the task detail panel opens
    // with a running timer (red pulse dot and elapsed time visible)
    // OR the global timer header indicator appears.
    // The TimeTracker shows a red pulsing dot when tracking is active.
    await expect(page.locator('.animate-pulse')).toBeVisible({ timeout: 5000 });
  });
});
