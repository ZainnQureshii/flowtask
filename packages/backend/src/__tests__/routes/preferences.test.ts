import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/connection.js', async () => {
  const setup = await import('../helpers/setup.js');
  return {
    get db() { return setup.testDb; },
    get sqlite() { return setup.testSqlite; },
  };
});

import { Hono } from 'hono';
import type { UserPreferences } from '@flowtask/shared';
import type { ApiResponse } from '../helpers/setup.js';
import preferenceRoutes from '../../routes/preferences.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api/preferences', preferenceRoutes);
  return app;
}

function patch(payload: unknown) {
  return {
    method: 'PATCH' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

describe('Preferences API', () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/preferences', () => {
    it('should return default preferences', async () => {
      const res = await app.request('/api/preferences');
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<UserPreferences>;
      expect(body.data.theme).toBe('system');
      expect(body.data.defaultView).toBe('list');
      expect(body.data.defaultPriority).toBe('medium');
      expect(body.data.pomodoroWorkMinutes).toBe(25);
      expect(body.data.pomodoroShortBreakMinutes).toBe(5);
      expect(body.data.pomodoroLongBreakMinutes).toBe(15);
      expect(body.data.pomodoroSessionsBeforeLongBreak).toBe(4);
      expect(body.data.sidebarCollapsed).toBe(false);
      expect(body.data.showCompletedTasks).toBe(true);
    });
  });

  describe('PATCH /api/preferences', () => {
    it('should update theme', async () => {
      const res = await app.request('/api/preferences', patch({ theme: 'dark' }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<UserPreferences>;
      expect(body.data.theme).toBe('dark');
    });

    it('should update default view', async () => {
      const res = await app.request('/api/preferences', patch({ defaultView: 'kanban' }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<UserPreferences>;
      expect(body.data.defaultView).toBe('kanban');
    });

    it('should update pomodoro settings', async () => {
      const res = await app.request('/api/preferences', patch({
        pomodoroWorkMinutes: 30,
        pomodoroShortBreakMinutes: 10,
      }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<UserPreferences>;
      expect(body.data.pomodoroWorkMinutes).toBe(30);
      expect(body.data.pomodoroShortBreakMinutes).toBe(10);
    });

    it('should update sidebar and completed tasks visibility', async () => {
      const res = await app.request('/api/preferences', patch({
        sidebarCollapsed: true,
        showCompletedTasks: false,
      }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<UserPreferences>;
      expect(body.data.sidebarCollapsed).toBe(true);
      expect(body.data.showCompletedTasks).toBe(false);
    });

    it('should reject invalid theme', async () => {
      const res = await app.request('/api/preferences', patch({ theme: 'neon' }));
      expect(res.status).toBe(400);
    });

    it('should reject invalid view', async () => {
      const res = await app.request('/api/preferences', patch({ defaultView: 'timeline' }));
      expect(res.status).toBe(400);
    });

    it('should preserve unchanged fields', async () => {
      // Set theme to dark
      await app.request('/api/preferences', patch({ theme: 'dark' }));
      // Update only view
      await app.request('/api/preferences', patch({ defaultView: 'calendar' }));
      // Check both persisted
      const res = await app.request('/api/preferences');
      const body = await res.json() as ApiResponse<UserPreferences>;
      expect(body.data.theme).toBe('dark');
      expect(body.data.defaultView).toBe('calendar');
    });

    it('should update and read back defaultPriority field', async () => {
      const res = await app.request('/api/preferences', patch({ defaultPriority: 'high' }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<UserPreferences>;
      expect(body.data.defaultPriority).toBe('high');

      // Verify it persists on subsequent GET
      const getRes = await app.request('/api/preferences');
      const getBody = await getRes.json() as ApiResponse<UserPreferences>;
      expect(getBody.data.defaultPriority).toBe('high');
    });

    it('should reject invalid defaultPriority value', async () => {
      const res = await app.request('/api/preferences', patch({ defaultPriority: 'critical' }));
      expect(res.status).toBe(400);
    });
  });
});
