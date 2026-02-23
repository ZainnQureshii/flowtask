import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { parseBody } from '../middleware/validate.js';
import {
  startTimeEntrySchema,
  createManualTimeEntrySchema,
  generateId,
} from '@flowtask/shared';

const app = new Hono();

function nowISO(): string {
  return new Date().toISOString();
}

// GET /tasks/:taskId/time-entries
app.get('/tasks/:taskId/time-entries', async (c) => {
  const { taskId } = c.req.param();

  const task = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, taskId))
    .get();
  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  const entries = db
    .select()
    .from(schema.timeEntries)
    .where(eq(schema.timeEntries.taskId, taskId))
    .all();

  return c.json({ data: entries });
});

// POST /tasks/:taskId/time-entries/start
app.post('/tasks/:taskId/time-entries/start', async (c) => {
  const { taskId } = c.req.param();
  const parsed = await parseBody(c, startTimeEntrySchema);
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
  const now = nowISO();
  db.insert(schema.timeEntries)
    .values({
      id,
      taskId,
      startedAt: now,
      endedAt: null,
      durationSeconds: 0,
      note: body.note ?? '',
    })
    .run();

  const entry = db
    .select()
    .from(schema.timeEntries)
    .where(eq(schema.timeEntries.id, id))
    .get()!;

  return c.json({ data: entry }, 201);
});

// PATCH /time-entries/:id/stop
app.patch('/time-entries/:id/stop', async (c) => {
  const { id } = c.req.param();

  const existing = db
    .select()
    .from(schema.timeEntries)
    .where(eq(schema.timeEntries.id, id))
    .get();
  if (!existing) {
    return c.json({ error: 'Time entry not found' }, 404);
  }

  if (existing.endedAt) {
    return c.json({ error: 'Time entry already stopped' }, 400);
  }

  const now = nowISO();
  const startMs = new Date(existing.startedAt).getTime();
  const endMs = new Date(now).getTime();
  const durationSeconds = Math.floor((endMs - startMs) / 1000);

  db.update(schema.timeEntries)
    .set({
      endedAt: now,
      durationSeconds,
    })
    .where(eq(schema.timeEntries.id, id))
    .run();

  const updated = db
    .select()
    .from(schema.timeEntries)
    .where(eq(schema.timeEntries.id, id))
    .get()!;

  return c.json({ data: updated });
});

// POST /tasks/:taskId/time-entries (manual entry)
app.post('/tasks/:taskId/time-entries', async (c) => {
  const { taskId } = c.req.param();
  const parsed = await parseBody(c, createManualTimeEntrySchema);
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
  const startedAt = body.startedAt ?? nowISO();
  const endMs = new Date(startedAt).getTime() + body.durationSeconds * 1000;
  const endedAt = new Date(endMs).toISOString();

  db.insert(schema.timeEntries)
    .values({
      id,
      taskId,
      startedAt,
      endedAt,
      durationSeconds: body.durationSeconds,
      note: body.note ?? '',
    })
    .run();

  const entry = db
    .select()
    .from(schema.timeEntries)
    .where(eq(schema.timeEntries.id, id))
    .get()!;

  return c.json({ data: entry }, 201);
});

// DELETE /time-entries/:id
app.delete('/time-entries/:id', async (c) => {
  const { id } = c.req.param();

  const existing = db
    .select()
    .from(schema.timeEntries)
    .where(eq(schema.timeEntries.id, id))
    .get();
  if (!existing) {
    return c.json({ error: 'Time entry not found' }, 404);
  }

  db.delete(schema.timeEntries).where(eq(schema.timeEntries.id, id)).run();

  return c.json({ data: { success: true } });
});

export default app;
