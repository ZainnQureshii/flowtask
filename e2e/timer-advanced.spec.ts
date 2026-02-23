import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function resetData(request: APIRequestContext) {
  const res = await request.get(`${API}/tasks`);
  const { data } = await res.json();
  for (const task of data) {
    await request.delete(`${API}/tasks/${task.id}`);
  }
}

test.describe('Time Tracking Advanced', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('delete a time entry', async ({ page, request }) => {
    // Create task and add a time entry via API so it's present on page load
    const createRes = await request.post(`${API}/tasks`, {
      data: { title: 'Delete Entry Task', status: 'todo' },
    });
    const { data: task } = await createRes.json();

    // Add a 30-minute time entry via API directly
    await request.post(`${API}/tasks/${task.id}/time-entries`, {
      data: { durationSeconds: 1800 },
    });

    // Navigate — fetchTasks on load populates the store with the entry
    await page.goto('/');
    await expect(page.getByText('Delete Entry Task')).toBeVisible({ timeout: 10000 });

    // Open task detail
    await page.locator('.cursor-pointer').filter({ hasText: 'Delete Entry Task' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Entry Task' })).toBeVisible();

    // Click Time tab
    await page.getByRole('tab', { name: 'Time' }).click();

    // Entry should be visible — formatDuration(1800) = "30m 0s"
    const entryRow = page.locator('div.space-y-1').locator('div').filter({ hasText: '30m 0s' }).first();
    await expect(entryRow).toBeVisible({ timeout: 5000 });

    // Hover to reveal the delete button (opacity-0 → opacity-100 on group hover)
    await entryRow.hover();

    // Wait for the browser's DELETE API call to complete when we click delete
    const deleteResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/time-entries') && resp.request().method() === 'DELETE'
    );

    // Click delete button (aria-label="Delete time entry")
    await page.getByRole('button', { name: 'Delete time entry' }).click();

    // Store optimistically removes the entry — it should disappear from UI
    await expect(entryRow).not.toBeVisible({ timeout: 5000 });

    // Wait for the browser's DELETE network request to actually complete
    await deleteResponsePromise;

    // Verify via API that entry is gone
    const taskRes = await request.get(`${API}/tasks/${task.id}`);
    const { data: refreshedTask } = await taskRes.json();
    expect(refreshedTask).toBeDefined();
    expect(refreshedTask.timeEntries.length).toBe(0);
  });

  test('verify total time updates after manual entry via UI', async ({ page, request }) => {
    // Note: addTimeEntry in the component calls api directly without updating the store.
    // Entries added via UI are visible only after a page reload (fetchTasks on load).
    // We add via UI, reload, check total — then add again via UI, reload, check updated total.
    const createRes = await request.post(`${API}/tasks`, {
      data: { title: 'Total Time Task', status: 'todo' },
    });
    const { data: task } = await createRes.json();

    await page.goto('/');
    await expect(page.getByText('Total Time Task')).toBeVisible({ timeout: 10000 });

    // Open task detail
    await page.locator('.cursor-pointer').filter({ hasText: 'Total Time Task' }).click();
    await expect(page.getByRole('heading', { name: 'Total Time Task' })).toBeVisible();

    // Go to Time tab
    await page.getByRole('tab', { name: 'Time' }).click();

    // Add 30 min via UI
    await page.getByPlaceholder('Minutes').fill('30');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for the API call to complete
    await page.waitForTimeout(1000);

    // Verify via API that entry was created
    const taskRes1 = await request.get(`${API}/tasks/${task.id}`);
    const { data: t1 } = await taskRes1.json();
    expect(t1.timeEntries.length).toBe(1);
    expect(t1.timeEntries[0].durationSeconds).toBe(1800);

    // Reload page so the store picks up the new entry
    await page.reload();
    await expect(page.getByText('Total Time Task')).toBeVisible({ timeout: 10000 });

    // Reopen task detail
    await page.locator('.cursor-pointer').filter({ hasText: 'Total Time Task' }).click();
    await page.getByRole('tab', { name: 'Time' }).click();

    // Total should now show "30m 0s" — formatDuration(1800) = "30m 0s"
    await expect(page.getByText('Total: 30m 0s')).toBeVisible({ timeout: 5000 });

    // Add another 15 min via UI
    await page.getByPlaceholder('Minutes').fill('15');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.waitForTimeout(1000);

    // Reload again to see updated total
    await page.reload();
    await expect(page.getByText('Total Time Task')).toBeVisible({ timeout: 10000 });
    await page.locator('.cursor-pointer').filter({ hasText: 'Total Time Task' }).click();
    await page.getByRole('tab', { name: 'Time' }).click();

    // Total should now show "45m 0s" — formatDuration(2700) = "45m 0s"
    await expect(page.getByText('Total: 45m 0s')).toBeVisible({ timeout: 5000 });
  });
});
