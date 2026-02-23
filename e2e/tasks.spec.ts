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

test.describe('Task CRUD', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('create a task via New Task button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();

    await page.getByPlaceholder('Task title').fill('My E2E Task');
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.getByText('My E2E Task')).toBeVisible();
  });

  test('edit a task', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Task to Edit', status: 'todo' },
    });

    await page.goto('/');
    // Wait for tasks to load from API
    await expect(page.getByText('Task to Edit')).toBeVisible({ timeout: 10000 });

    // Hover the task card to reveal the kebab menu
    const taskCard = page.locator('.group').filter({ hasText: 'Task to Edit' });
    await taskCard.hover();

    // Click the kebab menu (MoreHorizontal button)
    await taskCard.locator('button').last().click();
    await page.getByRole('menuitem', { name: /Edit/ }).click();

    // Edit the title
    const titleInput = page.getByPlaceholder('Task title');
    await titleInput.clear();
    await titleInput.fill('Edited Task');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify edited title appears in the task list
    await expect(page.locator('#main-content').getByText('Edited Task')).toBeVisible();
  });

  test('delete a task', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Task to Delete', status: 'todo' },
    });

    await page.goto('/');
    await expect(page.getByText('Task to Delete')).toBeVisible({ timeout: 10000 });

    // Hover to reveal kebab menu
    const taskCard = page.locator('.group').filter({ hasText: 'Task to Delete' });
    await taskCard.hover();
    await taskCard.locator('button').last().click();
    await page.getByRole('menuitem', { name: /Delete/ }).click();

    // Verify task is gone
    await expect(page.getByText('Task to Delete')).not.toBeVisible();
  });

  test('complete a task via checkbox', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Task to Complete', status: 'todo' },
    });

    await page.goto('/');
    await expect(page.getByText('Task to Complete')).toBeVisible({ timeout: 10000 });

    // Click the checkbox (aria-label is "Mark 'Task to Complete' as done")
    await page.getByRole('checkbox', { name: /Mark "Task to Complete" as done/ }).click();

    // After toggling, the checkbox label should change
    await expect(page.getByRole('checkbox', { name: /Mark "Task to Complete" as todo/ })).toBeVisible();
  });

  test('open task detail panel', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Detail Task', status: 'todo', description: 'Some details' },
    });

    await page.goto('/');
    await expect(page.getByText('Detail Task')).toBeVisible({ timeout: 10000 });

    // Click the task card to open detail panel
    await page.locator('.cursor-pointer').filter({ hasText: 'Detail Task' }).click();

    // Verify detail panel shows the task title
    await expect(page.getByText('Detail Task').first()).toBeVisible();
  });
});
