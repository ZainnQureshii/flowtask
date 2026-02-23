import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/connection.js', async () => {
  const setup = await import('../helpers/setup.js');
  return {
    get db() { return setup.testDb; },
    get sqlite() { return setup.testSqlite; },
  };
});

import { Hono } from 'hono';
import type { Task, PomodoroSession } from '@flowtask/shared';
import type { ApiResponse, SuccessResponse } from '../helpers/setup.js';
import taskRoutes from '../../routes/tasks.js';
import pomodoroRoutes from '../../routes/pomodoro.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api/tasks', taskRoutes);
  app.route('/api', pomodoroRoutes);
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
  const res = await app.request('/api/tasks', json({ title: 'Test task' }));
  return (await res.json() as ApiResponse<Task>).data;
}

describe('Pomodoro API', () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/tasks/:taskId/pomodoro', () => {
    it('should return empty list initially', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/pomodoro`);
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<PomodoroSession[]>;
      expect(body.data).toEqual([]);
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent/pomodoro');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tasks/:taskId/pomodoro/start', () => {
    it('should start a work session', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'work',
        durationMinutes: 25,
      }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<PomodoroSession>;
      expect(body.data.taskId).toBe(task.id);
      expect(body.data.type).toBe('work');
      expect(body.data.durationMinutes).toBe(25);
      expect(body.data.completed).toBe(false);
      expect(body.data.endedAt).toBeNull();
    });

    it('should start a short break session', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'short_break',
        durationMinutes: 5,
      }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<PomodoroSession>;
      expect(body.data.type).toBe('short_break');
    });

    it('should start a long break session', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'long_break',
        durationMinutes: 15,
      }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<PomodoroSession>;
      expect(body.data.type).toBe('long_break');
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent/pomodoro/start', json({
        type: 'work',
        durationMinutes: 25,
      }));
      expect(res.status).toBe(404);
    });

    it('should reject invalid type', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'invalid',
        durationMinutes: 25,
      }));
      expect(res.status).toBe(400);
    });

    it('should reject durationMinutes of 0', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'work',
        durationMinutes: 0,
      }));
      expect(res.status).toBe(400);
    });

    it('should reject durationMinutes over 120', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'work',
        durationMinutes: 121,
      }));
      expect(res.status).toBe(400);
    });

    it('should accept durationMinutes at boundary value 120', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'work',
        durationMinutes: 120,
      }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<PomodoroSession>;
      expect(body.data.durationMinutes).toBe(120);
    });
  });

  describe('PATCH /api/pomodoro/:id/complete', () => {
    it('should complete a pomodoro session', async () => {
      const task = await createTask(app);
      const startRes = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'work',
        durationMinutes: 25,
      }));
      const session = (await startRes.json() as ApiResponse<PomodoroSession>).data;

      const res = await app.request(`/api/pomodoro/${session.id}/complete`, patch({ completed: true }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<PomodoroSession>;
      expect(body.data.completed).toBe(true);
      expect(body.data.endedAt).not.toBeNull();
    });

    it('should mark session as not completed (cancelled)', async () => {
      const task = await createTask(app);
      const startRes = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'work',
        durationMinutes: 25,
      }));
      const session = (await startRes.json() as ApiResponse<PomodoroSession>).data;

      const res = await app.request(`/api/pomodoro/${session.id}/complete`, patch({ completed: false }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<PomodoroSession>;
      expect(body.data.completed).toBe(false);
      expect(body.data.endedAt).not.toBeNull();
    });

    it('should return 404 for nonexistent session', async () => {
      const res = await app.request('/api/pomodoro/nonexistent/complete', patch({ completed: true }));
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/pomodoro/:id', () => {
    it('should delete a pomodoro session', async () => {
      const task = await createTask(app);
      const startRes = await app.request(`/api/tasks/${task.id}/pomodoro/start`, json({
        type: 'work',
        durationMinutes: 25,
      }));
      const session = (await startRes.json() as ApiResponse<PomodoroSession>).data;

      const res = await app.request(`/api/pomodoro/${session.id}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.data.success).toBe(true);

      // Verify it's gone
      const list = await app.request(`/api/tasks/${task.id}/pomodoro`);
      expect((await list.json() as ApiResponse<PomodoroSession[]>).data).toHaveLength(0);
    });

    it('should return 404 for nonexistent session', async () => {
      const res = await app.request('/api/pomodoro/nonexistent', { method: 'DELETE' });
      expect(res.status).toBe(404);
    });
  });
});
