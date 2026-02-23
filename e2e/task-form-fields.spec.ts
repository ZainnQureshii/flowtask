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

test.describe('TaskForm Fields', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('create task with due date', async ({ page, request }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();

    await page.getByPlaceholder('Task title').fill('Due Date Task');
    await page.locator('input[type="date"]').fill('2030-06-15');
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Verify task appears on page
    await expect(page.getByText('Due Date Task')).toBeVisible({ timeout: 10000 });

    // Verify due date badge is visible on the card
    const taskCard = page.locator('.group').filter({ hasText: 'Due Date Task' });
    await expect(taskCard.getByText('Jun 15')).toBeVisible();

    // Verify via API that the task has dueDate set
    const tasksRes = await request.get(`${API}/tasks`);
    const { data } = await tasksRes.json();
    const created = data.find((t: any) => t.title === 'Due Date Task');
    expect(created.dueDate).toBeTruthy();
  });

  test('create task with description', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();

    await page.getByPlaceholder('Task title').fill('Described Task');
    await page.getByPlaceholder('Description (supports markdown)...').fill('My task description text');
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Click the task card to open the detail panel
    await expect(page.getByText('Described Task')).toBeVisible({ timeout: 10000 });
    await page.locator('.cursor-pointer').filter({ hasText: 'Described Task' }).click();

    // Verify description appears in the detail panel
    await expect(page.getByText('My task description text')).toBeVisible({ timeout: 10000 });
  });

  test('create task with color', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();

    await page.getByPlaceholder('Task title').fill('Colored Task');
    // Click the first color swatch (#ef4444 = red)
    await page.getByRole('button', { name: 'Color #ef4444' }).click();
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Verify task card has a colored left border
    await expect(page.getByText('Colored Task')).toBeVisible({ timeout: 10000 });
    const taskCard = page.locator('.group').filter({ hasText: 'Colored Task' });
    await expect(taskCard).toHaveCSS('border-left-color', 'rgb(239, 68, 68)');
  });

  test('create task with urgent priority', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();

    await page.getByPlaceholder('Task title').fill('Urgent Priority Task');
    // Change priority select from default "Medium" to "Urgent"
    await page.getByRole('combobox').filter({ hasText: 'Medium' }).click();
    await page.getByRole('option', { name: 'Urgent' }).click();
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Click the task card to open detail panel where priority label is shown
    await expect(page.getByText('Urgent Priority Task')).toBeVisible({ timeout: 10000 });
    await page.locator('.cursor-pointer').filter({ hasText: 'Urgent Priority Task' }).click();

    // Verify "Urgent" label appears in the detail panel
    await expect(page.getByText('Urgent').first()).toBeVisible({ timeout: 10000 });
  });

  test('create task with in_progress status', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();

    await page.getByPlaceholder('Task title').fill('In Progress Task');
    // Change status select from default "Todo" to "In Progress"
    await page.getByRole('combobox').filter({ hasText: 'Todo' }).click();
    await page.getByRole('option', { name: 'In Progress' }).click();
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Wait for task to appear
    await expect(page.getByText('In Progress Task')).toBeVisible({ timeout: 10000 });

    // Switch to Kanban view via sidebar
    await page.getByRole('button', { name: 'Kanban' }).click();

    // Verify the "In Progress" column heading exists
    await expect(page.locator('h3').filter({ hasText: 'In Progress' })).toBeVisible({ timeout: 10000 });

    // Verify task appears in the kanban view
    await expect(page.getByText('In Progress Task')).toBeVisible();
  });

  test('edit task to add due date', async ({ page, request }) => {
    // Create task via API without due date
    await request.post(`${API}/tasks`, {
      data: { title: 'Edit Due Date Task', status: 'todo' },
    });

    await page.goto('/');
    await expect(page.getByText('Edit Due Date Task')).toBeVisible({ timeout: 10000 });

    // Open edit form via kebab menu
    const taskCard = page.locator('.group').filter({ hasText: 'Edit Due Date Task' });
    await taskCard.hover();
    await taskCard.locator('button').last().click();
    await page.getByRole('menuitem', { name: /Edit/ }).click();

    // Set a due date
    await page.locator('input[type="date"]').fill('2030-08-20');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify date appears on the card
    const updatedCard = page.locator('.group').filter({ hasText: 'Edit Due Date Task' });
    await expect(updatedCard.getByText('Aug 20')).toBeVisible({ timeout: 10000 });
  });

  test('edit task to change priority', async ({ page, request }) => {
    // Create task via API with priority=low
    await request.post(`${API}/tasks`, {
      data: { title: 'Edit Priority Task', status: 'todo', priority: 'low' },
    });

    await page.goto('/');
    await expect(page.getByText('Edit Priority Task')).toBeVisible({ timeout: 10000 });

    // Open edit form via kebab menu
    const taskCard = page.locator('.group').filter({ hasText: 'Edit Priority Task' });
    await taskCard.hover();
    await taskCard.locator('button').last().click();
    await page.getByRole('menuitem', { name: /Edit/ }).click();

    // Change priority select from "Low" to "Urgent"
    await page.getByRole('combobox').filter({ hasText: 'Low' }).click();
    await page.getByRole('option', { name: 'Urgent' }).click();
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Open task detail panel and verify priority changed to Urgent
    await page.locator('.cursor-pointer').filter({ hasText: 'Edit Priority Task' }).click();
    await expect(page.getByText('Urgent').first()).toBeVisible({ timeout: 10000 });
  });

  test('edit task to clear color', async ({ page, request }) => {
    // Create task via API with a color
    await request.post(`${API}/tasks`, {
      data: { title: 'Clear Color Task', status: 'todo', color: '#ef4444' },
    });

    await page.goto('/');
    await expect(page.getByText('Clear Color Task')).toBeVisible({ timeout: 10000 });

    // Verify the task card has a colored left border initially
    const taskCard = page.locator('.group').filter({ hasText: 'Clear Color Task' });
    await expect(taskCard).toHaveCSS('border-left-color', 'rgb(239, 68, 68)');

    // Open edit form via kebab menu
    await taskCard.hover();
    await taskCard.locator('button').last().click();
    await page.getByRole('menuitem', { name: /Edit/ }).click();

    // Click "No color" button to clear the color
    await page.getByRole('button', { name: 'No color' }).click();
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify the colored border is gone
    const updatedCard = page.locator('.group').filter({ hasText: 'Clear Color Task' });
    await expect(updatedCard).not.toHaveCSS('border-left-color', 'rgb(239, 68, 68)');
  });

  test('create task with tag and verify badge on card', async ({ page, request }) => {
    // Create a tag via API
    await request.post(`${API}/tags`, {
      data: { name: 'e2e-tag', color: '#3b82f6' },
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();

    await page.getByPlaceholder('Task title').fill('Tagged Task');

    // Open the Tags picker
    await page.getByRole('button', { name: /Tags/ }).click();
    await expect(page.getByPlaceholder('Search tags...')).toBeVisible();

    // Select the tag (use getByRole to target the popover button, not the sidebar tag)
    await page.getByRole('button', { name: 'e2e-tag' }).click();

    // Close the popover by clicking the title input (Escape would close the whole dialog)
    await page.getByPlaceholder('Task title').click();
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Verify the tag badge appears on the task card
    await expect(page.getByText('Tagged Task')).toBeVisible({ timeout: 10000 });
    const taskCard = page.locator('.group').filter({ hasText: 'Tagged Task' });
    await expect(taskCard.getByText('e2e-tag')).toBeVisible();
  });
});
