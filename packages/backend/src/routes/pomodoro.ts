import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { parseBody } from '../middleware/validate.js';
import {
  startPomodoroSchema,
  completePomodoroSchema,
  generateId,
} from '@flowtask/shared';

const app = new Hono();

function nowISO(): string {
  return new Date().toISOString();
}

// GET /tasks/:taskId/pomodoro
app.get('/tasks/:taskId/pomodoro', async (c) => {
  const { taskId } = c.req.param();

  const task = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, taskId))
    .get();
  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  const sessions = db
    .select()
    .from(schema.pomodoroSessions)
    .where(eq(schema.pomodoroSessions.taskId, taskId))
    .all();

  return c.json({
    data: sessions.map((s) => ({
      ...s,
      completed: Boolean(s.completed),
    })),
  });
});

// POST /tasks/:taskId/pomodoro/start
app.post('/tasks/:taskId/pomodoro/start', async (c) => {
  const { taskId } = c.req.param();
  const parsed = await parseBody(c, startPomodoroSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const task = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, taskId))
    .get();
  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  const id = generateId();
  db.insert(schema.pomodoroSessions)
    .values({
      id,
      taskId,
      startedAt: nowISO(),
      endedAt: null,
      durationMinutes: body.durationMinutes,
      completed: false,
      type: body.type,
    })
    .run();

  const session = db
    .select()
    .from(schema.pomodoroSessions)
    .where(eq(schema.pomodoroSessions.id, id))
    .get()!;

  return c.json(
    { data: { ...session, completed: Boolean(session.completed) } },
    201
  );
});

// PATCH /pomodoro/:id/complete
app.patch('/pomodoro/:id/complete', async (c) => {
  const { id } = c.req.param();
  const parsed = await parseBody(c, completePomodoroSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const existing = db
    .select()
    .from(schema.pomodoroSessions)
    .where(eq(schema.pomodoroSessions.id, id))
    .get();
  if (!existing) {
    return c.json({ error: 'Pomodoro session not found' }, 404);
  }

  db.update(schema.pomodoroSessions)
    .set({
      completed: body.completed,
      endedAt: nowISO(),
    })
    .where(eq(schema.pomodoroSessions.id, id))
    .run();

  const updated = db
    .select()
    .from(schema.pomodoroSessions)
    .where(eq(schema.pomodoroSessions.id, id))
    .get()!;

  return c.json({
    data: { ...updated, completed: Boolean(updated.completed) },
  });
});

// DELETE /pomodoro/:id
app.delete('/pomodoro/:id', async (c) => {
  const { id } = c.req.param();

  const existing = db
    .select()
    .from(schema.pomodoroSessions)
    .where(eq(schema.pomodoroSessions.id, id))
    .get();
  if (!existing) {
    return c.json({ error: 'Pomodoro session not found' }, 404);
  }

  db.delete(schema.pomodoroSessions)
    .where(eq(schema.pomodoroSessions.id, id))
    .run();

  return c.json({ data: { success: true } });
});

export default app;
