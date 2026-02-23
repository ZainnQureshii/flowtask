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

test.describe('Settings Advanced', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('import invalid JSON schema shows error', async ({ page }) => {
    await page.goto('/settings');

    // Upload a file with valid JSON but invalid schema for import
    // The component parses the JSON successfully (opens dialog), but backend
    // validates via importDataSchema (Zod). Missing required 'tasks' and 'tags'
    // arrays means backend returns 400, and the UI shows "Failed to import data"
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ foo: 'bar' })),
    });

    // Dialog opens (JSON is valid, but schema is wrong)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Shows 0 tasks and 0 tags
    await expect(page.getByText('Tasks to import:')).toBeVisible();

    // Click Import to trigger backend validation
    await page.getByRole('dialog').getByRole('button', { name: 'Import' }).click();

    // Backend rejects invalid schema — error message shown
    await expect(page.getByText('Failed to import data')).toBeVisible({ timeout: 5000 });
  });

  test('export and re-import round trip', async ({ page, request }) => {
    // Create task and tag via API
    const tagRes = await request.post(`${API}/tags`, {
      data: { name: 'roundtrip-tag', color: '#3b82f6' },
    });
    const { data: tag } = await tagRes.json();

    await request.post(`${API}/tasks`, {
      data: { title: 'Round Trip Task', status: 'todo', tagIds: [tag.id] },
    });

    // Export via API
    const exportRes = await request.get(`${API}/data/export`);
    const { data: exportData } = await exportRes.json();

    // Clear all data
    await resetData(request);

    // Verify data is cleared
    const tasksAfterClear = await request.get(`${API}/tasks`);
    const { data: clearedTasks } = await tasksAfterClear.json();
    expect(clearedTasks.length).toBe(0);

    // Import via UI file upload
    await page.goto('/settings');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'flowtask-export.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exportData)),
    });

    // Confirm dialog
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Tasks to import:')).toBeVisible();

    await page.getByRole('dialog').getByRole('button', { name: 'Import' }).click();

    // Success message
    await expect(page.getByText('Data imported successfully')).toBeVisible({ timeout: 5000 });

    // Verify task and tag are restored via API
    const restoredTasks = await request.get(`${API}/tasks`);
    const { data: tasks } = await restoredTasks.json();
    const roundTripTask = tasks.find((t: any) => t.title === 'Round Trip Task');
    expect(roundTripTask).toBeTruthy();

    const restoredTags = await request.get(`${API}/tags`);
    const { data: restoredTagsList } = await restoredTags.json();
    const roundTripTag = restoredTagsList.find((t: any) => t.name === 'roundtrip-tag');
    expect(roundTripTag).toBeTruthy();
  });

  test('tag badge visible on task card after creation with tag', async ({ page, request }) => {
    // Create tag via API
    const tagRes = await request.post(`${API}/tags`, {
      data: { name: 'e2e-badge-tag', color: '#8b5cf6' },
    });
    const { data: tag } = await tagRes.json();

    // Create task with that tag via API
    await request.post(`${API}/tasks`, {
      data: { title: 'Tagged Badge Task', status: 'todo', tagIds: [tag.id] },
    });

    // Navigate to the main view
    await page.goto('/');

    // Task card should be visible
    await expect(page.getByText('Tagged Badge Task')).toBeVisible({ timeout: 10000 });

    // Tag badge should be visible on the task card in main content
    const tagBadge = page.locator('#main-content').getByText('e2e-badge-tag');
    await expect(tagBadge).toBeVisible({ timeout: 5000 });
  });
});
