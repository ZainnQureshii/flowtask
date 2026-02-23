import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { parseBody } from '../middleware/validate.js';
import { createTagSchema, updateTagSchema, generateId } from '@flowtask/shared';

const app = new Hono();

// GET /tags
app.get('/', async (c) => {
  const tagsList = db.select().from(schema.tags).all();
  return c.json({ data: tagsList });
});

// POST /tags
app.post('/', async (c) => {
  const parsed = await parseBody(c, createTagSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const existing = db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.name, body.name))
    .get();
  if (existing) {
    return c.json({ error: 'Tag with this name already exists' }, 409);
  }

  const id = generateId();
  db.insert(schema.tags)
    .values({ id, name: body.name, color: body.color })
    .run();

  const tag = db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.id, id))
    .get()!;
  return c.json({ data: tag }, 201);
});

// PATCH /tags/:id
app.patch('/:id', async (c) => {
  const { id } = c.req.param();
  const parsed = await parseBody(c, updateTagSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const existing = db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.id, id))
    .get();
  if (!existing) {
    return c.json({ error: 'Tag not found' }, 404);
  }

  if (body.name && body.name !== existing.name) {
    const duplicate = db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.name, body.name))
      .get();
    if (duplicate) {
      return c.json({ error: 'Tag with this name already exists' }, 409);
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.color !== undefined) updates.color = body.color;

  db.update(schema.tags).set(updates).where(eq(schema.tags.id, id)).run();

  const updated = db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.id, id))
    .get()!;
  return c.json({ data: updated });
});

// DELETE /tags/:id
app.delete('/:id', async (c) => {
  const { id } = c.req.param();

  const existing = db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.id, id))
    .get();
  if (!existing) {
    return c.json({ error: 'Tag not found' }, 404);
  }

  db.delete(schema.tags).where(eq(schema.tags.id, id)).run();

  return c.json({ data: { success: true } });
});

export default app;
