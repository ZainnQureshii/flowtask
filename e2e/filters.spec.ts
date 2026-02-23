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

test.describe('Task Filters', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('filter by status via filter panel', async ({ page, request }) => {
    await request.post(`${API}/tasks`, { data: { title: 'Filter Todo Task', status: 'todo' } });
    await request.post(`${API}/tasks`, { data: { title: 'Filter Done Task', status: 'done' } });

    await page.goto('/');
    await expect(page.getByText('Filter Todo Task')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Filter Done Task')).toBeVisible();

    // Open filter panel
    await page.getByRole('button', { name: /Filters/i }).click();
    await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();

    // Click the Done status button
    await page.getByRole('button', { name: 'Done' }).click();

    // Only done task should be visible
    await expect(page.getByText('Filter Done Task')).toBeVisible();
    await expect(page.getByText('Filter Todo Task')).not.toBeVisible();
  });

  test('filter by priority via filter panel', async ({ page, request }) => {
    await request.post(`${API}/tasks`, { data: { title: 'Urgent Task', status: 'todo', priority: 'urgent' } });
    await request.post(`${API}/tasks`, { data: { title: 'Low Task', status: 'todo', priority: 'low' } });

    await page.goto('/');
    await expect(page.getByText('Urgent Task')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Low Task')).toBeVisible();

    // Open filter panel
    await page.getByRole('button', { name: /Filters/i }).click();
    await expect(page.getByRole('button', { name: 'Urgent' })).toBeVisible();

    // Click Urgent priority button
    await page.getByRole('button', { name: 'Urgent' }).click();

    // Only urgent task should be visible
    await expect(page.getByText('Urgent Task')).toBeVisible();
    await expect(page.getByText('Low Task')).not.toBeVisible();
  });

  test('clear all filters', async ({ page, request }) => {
    await request.post(`${API}/tasks`, { data: { title: 'Task Alpha', status: 'todo' } });
    await request.post(`${API}/tasks`, { data: { title: 'Task Beta', status: 'done' } });

    await page.goto('/');
    await expect(page.getByText('Task Alpha')).toBeVisible({ timeout: 10000 });

    // Apply a filter
    await page.getByRole('button', { name: /Filters/i }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Verify filter is applied (alpha hidden)
    await expect(page.getByText('Task Beta')).toBeVisible();
    await expect(page.getByText('Task Alpha')).not.toBeVisible();

    // Clear all filters
    await page.getByRole('button', { name: 'Clear all' }).click();

    // Both tasks should be visible again
    await expect(page.getByText('Task Alpha')).toBeVisible();
    await expect(page.getByText('Task Beta')).toBeVisible();
  });

  test('combined status and priority filter', async ({ page, request }) => {
    await request.post(`${API}/tasks`, { data: { title: 'Todo High', status: 'todo', priority: 'high' } });
    await request.post(`${API}/tasks`, { data: { title: 'Todo Low', status: 'todo', priority: 'low' } });
    await request.post(`${API}/tasks`, { data: { title: 'Done High', status: 'done', priority: 'high' } });

    await page.goto('/');
    await expect(page.getByText('Todo High')).toBeVisible({ timeout: 10000 });

    // Open filter panel
    await page.getByRole('button', { name: /Filters/i }).click();

    // Filter: status=todo AND priority=high
    await page.getByRole('button', { name: 'Todo' }).click();
    await page.getByRole('button', { name: 'High' }).click();

    // Only "Todo High" should be visible
    await expect(page.getByText('Todo High')).toBeVisible();
    await expect(page.getByText('Todo Low')).not.toBeVisible();
    await expect(page.getByText('Done High')).not.toBeVisible();
  });
});
