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

test.describe('Settings', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('toggle theme to dark mode', async ({ page }) => {
    await page.goto('/settings');

    await page.getByRole('button', { name: 'Dark' }).click();

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('toggle theme to light mode', async ({ page }) => {
    await page.goto('/settings');

    await page.getByRole('button', { name: 'Light' }).click();

    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('export data', async ({ page, request }) => {
    await request.post(`${API}/tasks`, { data: { title: 'Export Test Task', status: 'todo' } });

    await page.goto('/settings');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Data' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('flowtask');
  });

  test('import data via file upload', async ({ page, request }) => {
    // Create some data, then export it to get a valid format
    await request.post(`${API}/tasks`, { data: { title: 'Pre-Import Task', status: 'todo' } });
    const exportRes = await request.get(`${API}/data/export`);
    const { data: exportData } = await exportRes.json();

    // Clear data so we can verify import restores it
    await resetData(request);

    await page.goto('/settings');

    // Set the valid export file on the hidden input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'flowtask-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exportData)),
    });

    // The import confirmation dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Tasks to import:')).toBeVisible();

    // Click Import to confirm
    await page.getByRole('dialog').getByRole('button', { name: 'Import' }).click();

    // Verify success message
    await expect(page.getByText('Data imported successfully')).toBeVisible();
  });
});
