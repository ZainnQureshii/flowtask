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

test.describe('Tag Management', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('create a tag in settings', async ({ page }) => {
    // Visit tasks page first so tags get fetched into store
    await page.goto('/');
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.locator('h1')).toContainText('Settings');

    await page.getByPlaceholder('Tag name...').fill('work');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Verify tag appears in settings tag manager
    await expect(page.locator('#main-content').getByText('work')).toBeVisible();
  });

  test('delete a tag in settings', async ({ page, request }) => {
    await request.post(`${API}/tags`, { data: { name: 'delete-me', color: '#ef4444' } });

    // Visit tasks page first to trigger tag fetch, then navigate via sidebar
    await page.goto('/');
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.locator('#main-content').getByText('delete-me')).toBeVisible();

    await page.getByRole('button', { name: /Delete tag delete-me/ }).click();

    await expect(page.locator('#main-content').getByText('delete-me')).not.toBeVisible();
  });

  test('assign a tag to a task via task form', async ({ page, request }) => {
    await request.post(`${API}/tags`, { data: { name: 'urgent', color: '#ef4444' } });

    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();

    await page.getByPlaceholder('Task title').fill('My Tagged Task');

    // Open tag picker
    await page.getByRole('button', { name: /Tags/ }).click();

    // Wait for tags to load in popover, then select
    await expect(page.getByRole('button', { name: 'urgent' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'urgent' }).click();

    // Close popover
    await page.getByPlaceholder('Task title').click();

    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.getByText('My Tagged Task', { exact: true })).toBeVisible();
  });

  test('filter tasks by tag in sidebar', async ({ page, request }) => {
    const tagRes = await request.post(`${API}/tags`, { data: { name: 'filterable', color: '#3b82f6' } });
    const { data: tag } = await tagRes.json();

    await request.post(`${API}/tasks`, { data: { title: 'Has Filter Tag', status: 'todo', tagIds: [tag.id] } });
    await request.post(`${API}/tasks`, { data: { title: 'No Filter Tag', status: 'todo' } });

    await page.goto('/');
    await expect(page.getByText('Has Filter Tag', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('No Filter Tag', { exact: true })).toBeVisible();

    // Click the tag in sidebar to filter
    await page.locator('aside').getByText('filterable').click();

    await expect(page.getByText('Has Filter Tag', { exact: true })).toBeVisible();
    await expect(page.getByText('No Filter Tag', { exact: true })).not.toBeVisible();
  });
});
