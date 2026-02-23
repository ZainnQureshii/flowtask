import { Hono } from 'hono';
import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { parseBody } from '../middleware/validate.js';
import {
  createSubtaskSchema,
  updateSubtaskSchema,
  reorderSubtasksSchema,
  generateId,
} from '@flowtask/shared';

const app = new Hono();

function nowISO(): string {
  return new Date().toISOString();
}

// GET /tasks/:taskId/subtasks
app.get('/tasks/:taskId/subtasks', async (c) => {
  const { taskId } = c.req.param();

  const task = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, taskId))
    .get();
  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  const subtasksList = db
    .select()
    .from(schema.subtasks)
    .where(eq(schema.subtasks.taskId, taskId))
    .orderBy(asc(schema.subtasks.position))
    .all();

  return c.json({
    data: subtasksList.map((s) => ({ ...s, completed: Boolean(s.completed) })),
  });
});

// POST /tasks/:taskId/subtasks
app.post('/tasks/:taskId/subtasks', async (c) => {
  const { taskId } = c.req.param();
  const parsed = await parseBody(c, createSubtaskSchema);
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

  const maxPos = db
    .select({ maxPosition: sql<number>`COALESCE(MAX(position), -1)` })
    .from(schema.subtasks)
    .where(eq(schema.subtasks.taskId, taskId))
    .get();
  const position = (maxPos?.maxPosition ?? -1) + 1;

  const id = generateId();
  db.insert(schema.subtasks)
    .values({
      id,
      taskId,
      title: body.title,
      completed: false,
      position,
      createdAt: nowISO(),
    })
    .run();

  db.update(schema.tasks)
    .set({ updatedAt: nowISO() })
    .where(eq(schema.tasks.id, taskId))
    .run();

  const subtask = db
    .select()
    .from(schema.subtasks)
    .where(eq(schema.subtasks.id, id))
    .get()!;

  return c.json(
    { data: { ...subtask, completed: Boolean(subtask.completed) } },
    201
  );
});

// PATCH /subtasks/:id
app.patch('/subtasks/:id', async (c) => {
  const { id } = c.req.param();
  const parsed = await parseBody(c, updateSubtaskSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const existing = db
    .select()
    .from(schema.subtasks)
    .where(eq(schema.subtasks.id, id))
    .get();

  if (!existing) {
    return c.json({ error: 'Subtask not found' }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.completed !== undefined) updates.completed = body.completed;
  if (body.position !== undefined) updates.position = body.position;

  db.update(schema.subtasks).set(updates).where(eq(schema.subtasks.id, id)).run();

  db.update(schema.tasks)
    .set({ updatedAt: nowISO() })
    .where(eq(schema.tasks.id, existing.taskId))
    .run();

  const updated = db
    .select()
    .from(schema.subtasks)
    .where(eq(schema.subtasks.id, id))
    .get()!;

  return c.json({
    data: { ...updated, completed: Boolean(updated.completed) },
  });
});

// DELETE /subtasks/:id
app.delete('/subtasks/:id', async (c) => {
  const { id } = c.req.param();

  const existing = db
    .select()
    .from(schema.subtasks)
    .where(eq(schema.subtasks.id, id))
    .get();

  if (!existing) {
    return c.json({ error: 'Subtask not found' }, 404);
  }

  db.delete(schema.subtasks).where(eq(schema.subtasks.id, id)).run();

  db.update(schema.tasks)
    .set({ updatedAt: nowISO() })
    .where(eq(schema.tasks.id, existing.taskId))
    .run();

  return c.json({ data: { success: true } });
});

// POST /tasks/:taskId/subtasks/reorder
app.post('/tasks/:taskId/subtasks/reorder', async (c) => {
  const { taskId } = c.req.param();
  const parsed = await parseBody(c, reorderSubtasksSchema);
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

  for (const item of body.items) {
    db.update(schema.subtasks)
      .set({ position: item.position })
      .where(eq(schema.subtasks.id, item.id))
      .run();
  }

  db.update(schema.tasks)
    .set({ updatedAt: nowISO() })
    .where(eq(schema.tasks.id, taskId))
    .run();

  return c.json({ data: { success: true } });
});

export default app;
