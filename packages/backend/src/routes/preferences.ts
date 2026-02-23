import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { parseBody } from '../middleware/validate.js';
import { updatePreferencesSchema } from '@flowtask/shared';

const app = new Hono();

function nowISO(): string {
  return new Date().toISOString();
}

// GET /preferences
app.get('/', async (c) => {
  const prefs = db
    .select()
    .from(schema.userPreferences)
    .where(eq(schema.userPreferences.id, 'default'))
    .get();

  if (!prefs) {
    return c.json({ error: 'Preferences not found' }, 404);
  }

  return c.json({
    data: {
      ...prefs,
      sidebarCollapsed: Boolean(prefs.sidebarCollapsed),
      showCompletedTasks: Boolean(prefs.showCompletedTasks),
    },
  });
});

// PATCH /preferences
app.patch('/', async (c) => {
  const parsed = await parseBody(c, updatePreferencesSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const existing = db
    .select()
    .from(schema.userPreferences)
    .where(eq(schema.userPreferences.id, 'default'))
    .get();

  if (!existing) {
    return c.json({ error: 'Preferences not found' }, 404);
  }

  const updates: Record<string, unknown> = { updatedAt: nowISO() };
  if (body.theme !== undefined) updates.theme = body.theme;
  if (body.defaultView !== undefined) updates.defaultView = body.defaultView;
  if (body.defaultPriority !== undefined)
    updates.defaultPriority = body.defaultPriority;
  if (body.pomodoroWorkMinutes !== undefined)
    updates.pomodoroWorkMinutes = body.pomodoroWorkMinutes;
  if (body.pomodoroShortBreakMinutes !== undefined)
    updates.pomodoroShortBreakMinutes = body.pomodoroShortBreakMinutes;
  if (body.pomodoroLongBreakMinutes !== undefined)
    updates.pomodoroLongBreakMinutes = body.pomodoroLongBreakMinutes;
  if (body.pomodoroSessionsBeforeLongBreak !== undefined)
    updates.pomodoroSessionsBeforeLongBreak =
      body.pomodoroSessionsBeforeLongBreak;
  if (body.sidebarCollapsed !== undefined)
    updates.sidebarCollapsed = body.sidebarCollapsed;
  if (body.showCompletedTasks !== undefined)
    updates.showCompletedTasks = body.showCompletedTasks;

  db.update(schema.userPreferences)
    .set(updates)
    .where(eq(schema.userPreferences.id, 'default'))
    .run();

  const updated = db
    .select()
    .from(schema.userPreferences)
    .where(eq(schema.userPreferences.id, 'default'))
    .get()!;

  return c.json({
    data: {
      ...updated,
      sidebarCollapsed: Boolean(updated.sidebarCollapsed),
      showCompletedTasks: Boolean(updated.showCompletedTasks),
    },
  });
});

export default app;
