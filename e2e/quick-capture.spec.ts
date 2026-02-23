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

test.describe('Quick Capture', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('open quick capture with Ctrl+K and create a task', async ({ page }) => {
    await page.goto('/');

    // Open quick capture
    await page.keyboard.press('Control+k');

    // Verify the command palette is open
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await expect(input).toBeVisible();

    // Type a task title
    await input.fill('Quick task from E2E');

    // Click the "Create" item or press Enter
    await page.keyboard.press('Enter');

    // Quick capture should close
    await expect(input).not.toBeVisible();

    // Verify the task was created and shows in the list
    await expect(page.getByText('Quick task from E2E').first()).toBeVisible();
  });

  test('create task with inline priority syntax', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Control+k');

    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await input.fill('Buy groceries !high');
    await page.keyboard.press('Enter');

    // Task should be created
    await expect(page.getByText('Buy groceries')).toBeVisible();
  });

  test('close quick capture with Escape', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a task, /search, or >command...');
    await expect(input).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(input).not.toBeVisible();
  });
});
