import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function resetData(request: APIRequestContext) {
  const res = await request.get(`${API}/tasks`);
  const { data } = await res.json();
  for (const task of data) {
    await request.delete(`${API}/tasks/${task.id}`);
  }
}

async function createTask(request: any, title: string) {
  const res = await request.post(`${API}/tasks`, { data: { title, status: 'todo' } });
  const { data } = await res.json();
  return data;
}

async function openTaskDetail(page: any, taskTitle: string) {
  // Click the task card (cursor-pointer, avoid clicking the checkbox)
  await page.locator('.cursor-pointer').filter({ hasText: taskTitle }).click();
  await expect(page.getByRole('heading', { name: taskTitle })).toBeVisible({ timeout: 10000 });
}

test.describe('Subtasks', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('add a subtask from task detail', async ({ page, request }) => {
    await createTask(request, 'Subtask Parent Task');

    await page.goto('/');
    await expect(page.getByText('Subtask Parent Task')).toBeVisible({ timeout: 10000 });

    await openTaskDetail(page, 'Subtask Parent Task');

    // The SubtaskList is in "Subtasks" tab (default tab)
    const subtaskInput = page.getByPlaceholder('Add subtask...');
    await expect(subtaskInput).toBeVisible();

    await subtaskInput.fill('My New Subtask');
    await subtaskInput.press('Enter');

    // Verify subtask appears in the list
    await expect(page.getByText('My New Subtask')).toBeVisible({ timeout: 5000 });
  });

  test('complete a subtask', async ({ page, request }) => {
    const task = await createTask(request, 'Task With Subtask');

    // Create subtask via API
    await request.post(`${API}/tasks/${task.id}/subtasks`, {
      data: { title: 'Subtask To Complete' },
    });

    await page.goto('/');
    await expect(page.getByText('Task With Subtask')).toBeVisible({ timeout: 10000 });

    await openTaskDetail(page, 'Task With Subtask');

    // Find and click the subtask checkbox
    const checkbox = page.getByRole('checkbox', { name: /Mark subtask "Subtask To Complete"/ });
    await expect(checkbox).toBeVisible({ timeout: 5000 });
    await checkbox.click();

    // Verify strikethrough / line-through styling appears on the subtask text
    const subtaskText = page.locator('span.line-through', { hasText: 'Subtask To Complete' });
    await expect(subtaskText).toBeVisible({ timeout: 5000 });
  });

  test('delete a subtask', async ({ page, request }) => {
    const task = await createTask(request, 'Task For Subtask Delete');

    await request.post(`${API}/tasks/${task.id}/subtasks`, {
      data: { title: 'Subtask To Delete' },
    });

    await page.goto('/');
    await expect(page.getByText('Task For Subtask Delete')).toBeVisible({ timeout: 10000 });

    await openTaskDetail(page, 'Task For Subtask Delete');

    await expect(page.getByText('Subtask To Delete')).toBeVisible({ timeout: 5000 });

    // Hover the subtask row to reveal the delete button
    const subtaskRow = page.locator('.group.rounded').filter({ hasText: 'Subtask To Delete' });
    await subtaskRow.hover();

    // Click the delete button (aria-label "Delete subtask")
    await page.getByRole('button', { name: 'Delete subtask' }).click();

    // Subtask should disappear
    await expect(page.getByText('Subtask To Delete')).not.toBeVisible({ timeout: 5000 });
  });

  test('subtask progress indicator', async ({ page, request }) => {
    const task = await createTask(request, 'Task With Progress');

    // Create 2 subtasks via API
    const res1 = await request.post(`${API}/tasks/${task.id}/subtasks`, {
      data: { title: 'Subtask One' },
    });
    const { data: subtask1 } = await res1.json();

    await request.post(`${API}/tasks/${task.id}/subtasks`, {
      data: { title: 'Subtask Two' },
    });

    // Complete the first subtask via API (endpoint is /api/subtasks/:id)
    await request.patch(`${API}/subtasks/${subtask1.id}`, {
      data: { completed: true },
    });

    await page.goto('/');
    await expect(page.getByText('Task With Progress')).toBeVisible({ timeout: 10000 });

    await openTaskDetail(page, 'Task With Progress');

    // Progress indicator should show "1/2" in the detail panel subtask list
    // Scope to the tab panel to avoid ambiguity with the task card's progress text
    await expect(page.getByRole('tabpanel').getByText('1/2')).toBeVisible({ timeout: 5000 });
  });
});
