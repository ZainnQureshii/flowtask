import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3001/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

async function resetData(request: APIRequestContext) {
  const res = await request.get(`${API}/tasks`);
  const { data } = await res.json();
  for (const task of data) {
    await request.delete(`${API}/tasks/${task.id}`);
  }
}

test.describe('Calendar View', () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test('task with due date appears in calendar', async ({ page, request }) => {
    // Create task with dueDate = today (full ISO 8601 datetime required by backend schema)
    const today = new Date();
    const todayISO = today.toISOString(); // e.g. "2026-02-23T12:00:00.000Z"
    const monthYear = `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

    await request.post(`${API}/tasks`, {
      data: { title: 'Calendar Due Task', status: 'todo', dueDate: todayISO },
    });

    await page.goto('/');
    await expect(page.getByText('Calendar Due Task')).toBeVisible({ timeout: 10000 });

    // Switch to Calendar view
    await page.getByRole('button', { name: /Calendar/i }).click();

    // CalendarView lazy loads — wait for the month heading to appear
    await expect(page.getByText(monthYear)).toBeVisible({ timeout: 10000 });

    // Task title should appear in the calendar grid cell for today
    await expect(page.getByText('Calendar Due Task')).toBeVisible({ timeout: 5000 });
  });
});
