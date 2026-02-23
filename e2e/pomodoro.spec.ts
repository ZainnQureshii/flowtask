import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3001/api';

async function resetData(request: APIRequestContext) {
  const res = await request.get(`${API}/tasks`);
  const { data } = await res.json();
  for (const task of data) {
    await request.delete(`${API}/tasks/${task.id}`);
  }
}

// The pomodoro widget renders state labels in two places:
// 1. <span> inside the collapsed toggle button (always visible)
// 2. <p> inside the expanded content (visible when expanded)
// We target the <p> element in the expanded section to avoid strict mode violations.
const stateLabel = (page: any, label: string) =>
  page.locator('div.fixed.bottom-4.right-4').locator('p').filter({ hasText: label });

async function expandWidget(page: any) {
  const widget = page.locator('div.fixed.bottom-4.right-4').locator('button').first();
  await expect(widget).toBeVisible();
  await widget.click();
}

test.describe('Pomodoro Timer', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('expand pomodoro widget and start timer', async ({ page, request }) => {
    // Need at least one task so the Start button is enabled
    await request.post(`${API}/tasks`, {
      data: { title: 'Pomodoro Task', status: 'todo' },
    });

    await page.goto('/');
    await expect(page.getByText('Pomodoro Task')).toBeVisible({ timeout: 10000 });

    // Click the collapsed widget button to expand
    await expandWidget(page);

    // Expanded view shows Start button
    const startButton = page.getByRole('button', { name: 'Start' });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // After starting, state label paragraph should show "Focus"
    await expect(stateLabel(page, 'Focus')).toBeVisible({ timeout: 5000 });
  });

  test('pause and resume pomodoro', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Pause Resume Task', status: 'todo' },
    });

    await page.goto('/');
    await expect(page.getByText('Pause Resume Task')).toBeVisible({ timeout: 10000 });

    // Expand widget and start
    await expandWidget(page);
    await page.getByRole('button', { name: 'Start' }).click();

    // Verify running — Pause button visible (aria-label="Pause")
    const pauseButton = page.getByRole('button', { name: 'Pause' });
    await expect(pauseButton).toBeVisible();
    await pauseButton.click();

    // After pausing — Resume button visible (aria-label="Resume")
    const resumeButton = page.getByRole('button', { name: 'Resume' });
    await expect(resumeButton).toBeVisible();

    // Resume
    await resumeButton.click();

    // Should be running again — Pause button visible
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('reset pomodoro', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Reset Task', status: 'todo' },
    });

    await page.goto('/');
    await expect(page.getByText('Reset Task')).toBeVisible({ timeout: 10000 });

    // Expand widget and start
    await expandWidget(page);
    await page.getByRole('button', { name: 'Start' }).click();

    // Verify running
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

    // Click Reset (aria-label="Reset")
    await page.getByRole('button', { name: 'Reset' }).click();

    // After reset — state is idle, Start button reappears
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible({ timeout: 5000 });

    // State label paragraph should show "Ready"
    await expect(stateLabel(page, 'Ready')).toBeVisible();
  });

  test('start pomodoro from task detail', async ({ page, request }) => {
    await request.post(`${API}/tasks`, {
      data: { title: 'Detail Pomodoro Task', status: 'todo' },
    });

    await page.goto('/');
    await expect(page.getByText('Detail Pomodoro Task')).toBeVisible({ timeout: 10000 });

    // Open task detail panel
    await page.locator('.cursor-pointer').filter({ hasText: 'Detail Pomodoro Task' }).click();
    await expect(page.getByRole('heading', { name: 'Detail Pomodoro Task' })).toBeVisible();

    // Click the Pomodoro button in task detail — this starts pomodoro linked to this task
    await page.getByRole('button', { name: 'Pomodoro' }).click();

    // Close the task detail panel so we can interact with the widget
    await page.getByRole('button', { name: 'Close detail panel' }).click();
    await expect(page.getByRole('heading', { name: 'Detail Pomodoro Task' })).not.toBeVisible();

    // Now expand the widget to verify pomodoro is running
    await expandWidget(page);

    // Focus state should be shown
    await expect(stateLabel(page, 'Focus')).toBeVisible({ timeout: 5000 });

    // Task title should appear in the pomodoro widget expanded view
    await expect(
      page.locator('div.fixed.bottom-4.right-4').getByText('Detail Pomodoro Task')
    ).toBeVisible();
  });
});
