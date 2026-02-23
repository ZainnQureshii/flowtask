import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/connection.js', async () => {
  const setup = await import('../helpers/setup.js');
  return {
    get db() { return setup.testDb; },
    get sqlite() { return setup.testSqlite; },
  };
});

import { Hono } from 'hono';
import type { Task, Tag } from '@flowtask/shared';
import type { ApiResponse, SuccessResponse, ErrorResponse } from '../helpers/setup.js';
import tagRoutes from '../../routes/tags.js';
import taskRoutes from '../../routes/tasks.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api/tags', tagRoutes);
  app.route('/api/tasks', taskRoutes);
  return app;
}

function json(payload: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

function patch(payload: unknown) {
  return {
    method: 'PATCH' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

describe('Tags API', () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/tags', () => {
    it('should return empty list initially', async () => {
      const res = await app.request('/api/tags');
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Tag[]>;
      expect(body.data).toEqual([]);
    });

    it('should return all created tags', async () => {
      await app.request('/api/tags', json({ name: 'work', color: '#ef4444' }));
      await app.request('/api/tags', json({ name: 'personal', color: '#3b82f6' }));
      const res = await app.request('/api/tags');
      const body = await res.json() as ApiResponse<Tag[]>;
      expect(body.data).toHaveLength(2);
    });
  });

  describe('POST /api/tags', () => {
    it('should create a tag', async () => {
      const res = await app.request('/api/tags', json({ name: 'Work', color: '#ef4444' }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Tag>;
      expect(body.data.name).toBe('work'); // transformed to lowercase
      expect(body.data.color).toBe('#ef4444');
      expect(body.data.id).toBeDefined();
    });

    it('should reject duplicate tag name', async () => {
      await app.request('/api/tags', json({ name: 'work', color: '#ef4444' }));
      const res = await app.request('/api/tags', json({ name: 'work', color: '#3b82f6' }));
      expect(res.status).toBe(409);
      const body = await res.json() as ErrorResponse;
      expect(body.error).toContain('already exists');
    });

    it('should reject invalid color', async () => {
      const res = await app.request('/api/tags', json({ name: 'test', color: 'invalid' }));
      expect(res.status).toBe(400);
    });

    it('should reject empty name', async () => {
      const res = await app.request('/api/tags', json({ name: '', color: '#ef4444' }));
      expect(res.status).toBe(400);
    });

    it('should store name with padded spaces as trimmed lowercase', async () => {
      const res = await app.request('/api/tags', json({ name: '  Work  ', color: '#ef4444' }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Tag>;
      expect(body.data.name).toBe('work');
    });

    it('should treat padded-space names as same as trimmed for uniqueness', async () => {
      await app.request('/api/tags', json({ name: 'work', color: '#ef4444' }));
      // Padded-space "work" trims to same name — should conflict
      const res = await app.request('/api/tags', json({ name: '  work  ', color: '#3b82f6' }));
      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/tags/:id', () => {
    it('should update tag name', async () => {
      const createRes = await app.request('/api/tags', json({ name: 'old', color: '#ef4444' }));
      const tag = (await createRes.json() as ApiResponse<Tag>).data;
      const res = await app.request(`/api/tags/${tag.id}`, patch({ name: 'New' }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Tag>;
      expect(body.data.name).toBe('new'); // transformed
    });

    it('should update tag color', async () => {
      const createRes = await app.request('/api/tags', json({ name: 'tag', color: '#ef4444' }));
      const tag = (await createRes.json() as ApiResponse<Tag>).data;
      const res = await app.request(`/api/tags/${tag.id}`, patch({ color: '#3b82f6' }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Tag>;
      expect(body.data.color).toBe('#3b82f6');
    });

    it('should reject duplicate name on update', async () => {
      await app.request('/api/tags', json({ name: 'existing', color: '#ef4444' }));
      const createRes = await app.request('/api/tags', json({ name: 'other', color: '#3b82f6' }));
      const tag = (await createRes.json() as ApiResponse<Tag>).data;
      const res = await app.request(`/api/tags/${tag.id}`, patch({ name: 'existing' }));
      expect(res.status).toBe(409);
    });

    it('should return 404 for nonexistent tag', async () => {
      const res = await app.request('/api/tags/nonexistent', patch({ name: 'nope' }));
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('should delete a tag', async () => {
      const createRes = await app.request('/api/tags', json({ name: 'delete-me', color: '#ef4444' }));
      const tag = (await createRes.json() as ApiResponse<Tag>).data;
      const res = await app.request(`/api/tags/${tag.id}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.data.success).toBe(true);

      // Verify tag list is empty
      const list = await app.request('/api/tags');
      expect((await list.json() as ApiResponse<Tag[]>).data).toHaveLength(0);
    });

    it('should return 404 for nonexistent tag', async () => {
      const res = await app.request('/api/tags/nonexistent', { method: 'DELETE' });
      expect(res.status).toBe(404);
    });

    it('should cascade delete task_tags when tag is deleted', async () => {
      const tagRes = await app.request('/api/tags', json({ name: 'temp', color: '#ef4444' }));
      const tag = (await tagRes.json() as ApiResponse<Tag>).data;

      // Create a task linked to this tag
      const taskRes = await app.request('/api/tasks', json({ title: 'Task', tagIds: [tag.id] }));
      const task = (await taskRes.json() as ApiResponse<Task>).data;
      expect(task.tags).toHaveLength(1);

      // Delete the tag
      await app.request(`/api/tags/${tag.id}`, { method: 'DELETE' });

      // Task should no longer have that tag
      const getRes = await app.request(`/api/tasks/${task.id}`);
      const updated = (await getRes.json() as ApiResponse<Task>).data;
      expect(updated.tags).toHaveLength(0);
    });
  });
});
