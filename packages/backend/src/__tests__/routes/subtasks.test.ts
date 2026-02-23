import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/connection.js', async () => {
  const setup = await import('../helpers/setup.js');
  return {
    get db() { return setup.testDb; },
    get sqlite() { return setup.testSqlite; },
  };
});

import { Hono } from 'hono';
import type { Task, Subtask } from '@flowtask/shared';
import type { ApiResponse, SuccessResponse } from '../helpers/setup.js';
import taskRoutes from '../../routes/tasks.js';
import subtaskRoutes from '../../routes/subtasks.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api/tasks', taskRoutes);
  app.route('/api', subtaskRoutes);
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

async function createTask(app: Hono): Promise<Task> {
  const res = await app.request('/api/tasks', json({ title: 'Parent task' }));
  return (await res.json() as ApiResponse<Task>).data;
}

async function createSubtask(app: Hono, taskId: string, title = 'Subtask'): Promise<Subtask> {
  const res = await app.request(`/api/tasks/${taskId}/subtasks`, json({ title }));
  return (await res.json() as ApiResponse<Subtask>).data;
}

describe('Subtasks API', () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/tasks/:taskId/subtasks', () => {
    it('should return empty list for task with no subtasks', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/subtasks`);
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Subtask[]>;
      expect(body.data).toEqual([]);
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent/subtasks');
      expect(res.status).toBe(404);
    });

    it('should return subtasks ordered by position', async () => {
      const task = await createTask(app);
      await createSubtask(app, task.id, 'First');
      await createSubtask(app, task.id, 'Second');
      const res = await app.request(`/api/tasks/${task.id}/subtasks`);
      const body = await res.json() as ApiResponse<Subtask[]>;
      expect(body.data).toHaveLength(2);
      expect(body.data[0].title).toBe('First');
      expect(body.data[0].position).toBe(0);
      expect(body.data[1].title).toBe('Second');
      expect(body.data[1].position).toBe(1);
    });
  });

  describe('POST /api/tasks/:taskId/subtasks', () => {
    it('should create a subtask', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/subtasks`, json({ title: 'Sub 1' }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Subtask>;
      expect(body.data.title).toBe('Sub 1');
      expect(body.data.completed).toBe(false);
      expect(body.data.position).toBe(0);
    });

    it('should auto-increment position', async () => {
      const task = await createTask(app);
      const s1 = await createSubtask(app, task.id, 'A');
      const s2 = await createSubtask(app, task.id, 'B');
      expect(s1.position).toBe(0);
      expect(s2.position).toBe(1);
    });

    it('should return 404 for nonexistent parent task', async () => {
      const res = await app.request('/api/tasks/nonexistent/subtasks', json({ title: 'Sub' }));
      expect(res.status).toBe(404);
    });

    it('should reject empty title', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/subtasks`, json({ title: '' }));
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/subtasks/:id', () => {
    it('should update subtask title', async () => {
      const task = await createTask(app);
      const sub = await createSubtask(app, task.id);
      const res = await app.request(`/api/subtasks/${sub.id}`, patch({ title: 'Updated' }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Subtask>;
      expect(body.data.title).toBe('Updated');
    });

    it('should update subtask completed status', async () => {
      const task = await createTask(app);
      const sub = await createSubtask(app, task.id);
      const res = await app.request(`/api/subtasks/${sub.id}`, patch({ completed: true }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Subtask>;
      expect(body.data.completed).toBe(true);
    });

    it('should update subtask position', async () => {
      const task = await createTask(app);
      const sub = await createSubtask(app, task.id);
      const res = await app.request(`/api/subtasks/${sub.id}`, patch({ position: 5 }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Subtask>;
      expect(body.data.position).toBe(5);
    });

    it('should return 404 for nonexistent subtask', async () => {
      const res = await app.request('/api/subtasks/nonexistent', patch({ title: 'Nope' }));
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/subtasks/:id', () => {
    it('should delete a subtask', async () => {
      const task = await createTask(app);
      const sub = await createSubtask(app, task.id);
      const res = await app.request(`/api/subtasks/${sub.id}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.data.success).toBe(true);

      // Verify it's gone
      const list = await app.request(`/api/tasks/${task.id}/subtasks`);
      expect((await list.json() as ApiResponse<Subtask[]>).data).toHaveLength(0);
    });

    it('should return 404 for nonexistent subtask', async () => {
      const res = await app.request('/api/subtasks/nonexistent', { method: 'DELETE' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tasks/:taskId/subtasks/reorder', () => {
    it('should reorder subtasks', async () => {
      const task = await createTask(app);
      const s1 = await createSubtask(app, task.id, 'A');
      const s2 = await createSubtask(app, task.id, 'B');

      const res = await app.request(`/api/tasks/${task.id}/subtasks/reorder`, json({
        items: [
          { id: s1.id, position: 1 },
          { id: s2.id, position: 0 },
        ],
      }));
      expect(res.status).toBe(200);

      // Verify new order
      const list = await app.request(`/api/tasks/${task.id}/subtasks`);
      const body = await list.json() as ApiResponse<Subtask[]>;
      expect(body.data[0].title).toBe('B');
      expect(body.data[1].title).toBe('A');
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent/subtasks/reorder', json({
        items: [{ id: 'x', position: 0 }],
      }));
      expect(res.status).toBe(404);
    });
  });
});
