import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function resetData(request: APIRequestContext) {
  const res = await request.get(`${API}/tasks`);
  const { data } = await res.json();
  for (const task of data) {
    await request.delete(`${API}/tasks/${task.id}`);
  }
}

test.describe('Time Tracking', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('start and stop time tracking from task detail', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Timer Task', status: 'todo' },
    });

    await page.goto('/');
    await expect(page.getByText('Timer Task')).toBeVisible({ timeout: 10000 });

    // Open task detail
    await page.locator('.cursor-pointer').filter({ hasText: 'Timer Task' }).click();
    await expect(page.getByRole('heading', { name: 'Timer Task' })).toBeVisible();

    // Click the Time tab
    await page.getByRole('tab', { name: 'Time' }).click();

    // Start timer
    await page.getByRole('button', { name: 'Start Timer' }).click();

    // Verify timer is running — the Stop button should appear
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();

    // Wait a moment so the timer records some time
    await page.waitForTimeout(1500);

    // Stop timer
    await page.getByRole('button', { name: 'Stop' }).click();

    // After stopping, Start Timer should reappear
    await expect(page.getByRole('button', { name: 'Start Timer' })).toBeVisible();
  });

  test('add manual time entry via API after UI interaction', async ({ page, request }) => {
    const createRes = await request.post(`${API}/tasks`, {
      data: { title: 'Manual Time Task', status: 'todo' },
    });
    const { data: task } = await createRes.json();

    await page.goto('/');
    await expect(page.getByText('Manual Time Task')).toBeVisible({ timeout: 10000 });

    // Open task detail
    await page.locator('.cursor-pointer').filter({ hasText: 'Manual Time Task' }).click();

    // Click Time tab
    await page.getByRole('tab', { name: 'Time' }).click();

    // Fill in manual time entry form
    await page.getByPlaceholder('Minutes').fill('30');
    await page.getByPlaceholder('Note...').fill('Research time');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for API call to complete
    await page.waitForTimeout(1000);

    // Verify the entry was created via API
    const taskRes = await request.get(`${API}/tasks/${task.id}`);
    const { data: refreshedTask } = await taskRes.json();
    expect(refreshedTask.timeEntries.length).toBe(1);
    expect(refreshedTask.timeEntries[0].durationSeconds).toBe(1800);
    expect(refreshedTask.timeEntries[0].note).toBe('Research time');
  });
});
