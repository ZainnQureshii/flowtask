import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/connection.js', async () => {
  const setup = await import('../helpers/setup.js');
  return {
    get db() { return setup.testDb; },
    get sqlite() { return setup.testSqlite; },
  };
});

import { Hono } from 'hono';
import type { Task, TimeEntry } from '@flowtask/shared';
import type { ApiResponse, SuccessResponse, ErrorResponse } from '../helpers/setup.js';
import taskRoutes from '../../routes/tasks.js';
import timeTrackingRoutes from '../../routes/timeTracking.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api/tasks', taskRoutes);
  app.route('/api', timeTrackingRoutes);
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

describe('Time Tracking API', () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/tasks/:taskId/time-entries', () => {
    it('should return empty list initially', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/time-entries`);
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<TimeEntry[]>;
      expect(body.data).toEqual([]);
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent/time-entries');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tasks/:taskId/time-entries/start', () => {
    it('should start a time entry', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/time-entries/start`, json({ note: 'Working' }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<TimeEntry>;
      expect(body.data.taskId).toBe(task.id);
      expect(body.data.note).toBe('Working');
      expect(body.data.endedAt).toBeNull();
      expect(body.data.durationSeconds).toBe(0);
    });

    it('should start with empty note by default', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/time-entries/start`, json({}));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<TimeEntry>;
      expect(body.data.note).toBe('');
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent/time-entries/start', json({}));
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/time-entries/:id/stop', () => {
    it('should stop a running time entry and calculate duration', async () => {
      const task = await createTask(app);
      const startRes = await app.request(`/api/tasks/${task.id}/time-entries/start`, json({}));
      const entry = (await startRes.json() as ApiResponse<TimeEntry>).data;

      const res = await app.request(`/api/time-entries/${entry.id}/stop`, patch({}));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<TimeEntry>;
      expect(body.data.endedAt).not.toBeNull();
      expect(body.data.durationSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should reject stopping an already-stopped entry', async () => {
      const task = await createTask(app);
      const startRes = await app.request(`/api/tasks/${task.id}/time-entries/start`, json({}));
      const entry = (await startRes.json() as ApiResponse<TimeEntry>).data;

      // Stop it once
      await app.request(`/api/time-entries/${entry.id}/stop`, patch({}));
      // Try to stop again
      const res = await app.request(`/api/time-entries/${entry.id}/stop`, patch({}));
      expect(res.status).toBe(400);
      const body = await res.json() as ErrorResponse;
      expect(body.error).toContain('already stopped');
    });

    it('should return 404 for nonexistent entry', async () => {
      const res = await app.request('/api/time-entries/nonexistent/stop', patch({}));
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tasks/:taskId/time-entries (manual)', () => {
    it('should create a manual time entry', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/time-entries`, json({
        durationSeconds: 3600,
        note: 'Manual entry',
      }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<TimeEntry>;
      expect(body.data.durationSeconds).toBe(3600);
      expect(body.data.note).toBe('Manual entry');
      expect(body.data.endedAt).not.toBeNull();
    });

    it('should use provided startedAt', async () => {
      const task = await createTask(app);
      const startedAt = '2026-02-20T10:00:00.000Z';
      const res = await app.request(`/api/tasks/${task.id}/time-entries`, json({
        durationSeconds: 1800,
        startedAt,
      }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<TimeEntry>;
      expect(body.data.startedAt).toBe(startedAt);
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent/time-entries', json({ durationSeconds: 60 }));
      expect(res.status).toBe(404);
    });

    it('should reject manual entry with durationSeconds of 0', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}/time-entries`, json({
        durationSeconds: 0,
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('Time entry integration with task GET', () => {
    it('should reflect time entries and totalTimeSpent when fetching task', async () => {
      const task = await createTask(app);
      // Add a manual time entry
      await app.request(`/api/tasks/${task.id}/time-entries`, json({
        durationSeconds: 3600,
        note: 'One hour of work',
      }));
      // Fetch the task via tasks route
      const res = await app.request(`/api/tasks/${task.id}`);
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.timeEntries).toHaveLength(1);
      expect(body.data.timeEntries[0].durationSeconds).toBe(3600);
      expect(body.data.totalTimeSpent).toBe(3600);
    });
  });

  describe('DELETE /api/time-entries/:id', () => {
    it('should delete a time entry', async () => {
      const task = await createTask(app);
      const startRes = await app.request(`/api/tasks/${task.id}/time-entries/start`, json({}));
      const entry = (await startRes.json() as ApiResponse<TimeEntry>).data;

      const res = await app.request(`/api/time-entries/${entry.id}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.data.success).toBe(true);

      // Verify it's gone
      const list = await app.request(`/api/tasks/${task.id}/time-entries`);
      expect((await list.json() as ApiResponse<TimeEntry[]>).data).toHaveLength(0);
    });

    it('should return 404 for nonexistent entry', async () => {
      const res = await app.request('/api/time-entries/nonexistent', { method: 'DELETE' });
      expect(res.status).toBe(404);
    });
  });
});
