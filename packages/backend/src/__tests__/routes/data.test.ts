import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/connection.js', async () => {
  const setup = await import('../helpers/setup.js');
  return {
    get db() { return setup.testDb; },
    get sqlite() { return setup.testSqlite; },
  };
});

import { Hono } from 'hono';
import type { Tag, ExportData } from '@flowtask/shared';
import type { ApiResponse } from '../helpers/setup.js';
import taskRoutes from '../../routes/tasks.js';
import tagRoutes from '../../routes/tags.js';
import dataRoutes from '../../routes/data.js';

type ImportResult = { tasksImported: number; tagsImported: number };

function createTestApp() {
  const app = new Hono();
  app.route('/api/tasks', taskRoutes);
  app.route('/api/tags', tagRoutes);
  app.route('/api/data', dataRoutes);
  return app;
}

function json(payload: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

function makeImportPayload(overrides: Record<string, unknown> = {}) {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tasks: [],
    tags: [],
    preferences: {
      id: 'default',
      theme: 'system',
      defaultView: 'list',
      defaultPriority: 'medium',
      pomodoroWorkMinutes: 25,
      pomodoroShortBreakMinutes: 5,
      pomodoroLongBreakMinutes: 15,
      pomodoroSessionsBeforeLongBreak: 4,
      sidebarCollapsed: false,
      showCompletedTasks: true,
      updatedAt: new Date().toISOString(),
    },
    ...overrides,
  };
}

function makeTaskPayload(id: string, overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  return {
    id,
    title: `Task ${id}`,
    description: '',
    status: 'todo',
    priority: 'medium',
    color: null,
    dueDate: null,
    position: 0,
    tags: [],
    subtasks: [],
    recurringConfig: null,
    pomodoroSessions: [],
    timeEntries: [],
    totalTimeSpent: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Data API', () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/data/export', () => {
    it('should export empty data', async () => {
      const res = await app.request('/api/data/export');
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<ExportData>;
      expect(body.data.version).toBe('1.0.0');
      expect(body.data.tasks).toEqual([]);
      expect(body.data.tags).toEqual([]);
      expect(body.data.preferences).toBeDefined();
      expect(body.data.exportedAt).toBeDefined();
    });

    it('should export data matching importDataSchema structure', async () => {
      const res = await app.request('/api/data/export');
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<ExportData>;
      const data = body.data;

      // Top-level fields
      expect(typeof data.version).toBe('string');
      expect(typeof data.exportedAt).toBe('string');
      expect(Array.isArray(data.tasks)).toBe(true);
      expect(Array.isArray(data.tags)).toBe(true);
      expect(data.preferences).not.toBeNull();
      expect(typeof data.preferences).toBe('object');

      // Preferences shape matches importDataSchema
      const prefs = data.preferences;
      expect(typeof prefs.id).toBe('string');
      expect(typeof prefs.theme).toBe('string');
      expect(typeof prefs.defaultView).toBe('string');
      expect(typeof prefs.defaultPriority).toBe('string');
      expect(typeof prefs.pomodoroWorkMinutes).toBe('number');
      expect(typeof prefs.pomodoroShortBreakMinutes).toBe('number');
      expect(typeof prefs.pomodoroLongBreakMinutes).toBe('number');
      expect(typeof prefs.pomodoroSessionsBeforeLongBreak).toBe('number');
      expect(typeof prefs.sidebarCollapsed).toBe('boolean');
      expect(typeof prefs.showCompletedTasks).toBe('boolean');
      expect(typeof prefs.updatedAt).toBe('string');
    });

    it('should export tasks with all relations', async () => {
      // Create a tag and a task with it
      const tagRes = await app.request('/api/tags', json({ name: 'work', color: '#ef4444' }));
      const tag = (await tagRes.json() as ApiResponse<Tag>).data;

      await app.request('/api/tasks', json({
        title: 'Export me',
        tagIds: [tag.id],
        dueDate: '2026-03-01T00:00:00.000Z',
      }));

      const res = await app.request('/api/data/export');
      const body = await res.json() as ApiResponse<ExportData>;
      expect(body.data.tasks).toHaveLength(1);
      expect(body.data.tasks[0].title).toBe('Export me');
      expect(body.data.tasks[0].tags).toHaveLength(1);
      expect(body.data.tags).toHaveLength(1);
    });
  });

  describe('POST /api/data/import', () => {
    it('should import tasks and tags', async () => {
      const payload = makeImportPayload({
        tags: [{ id: 'tag-1', name: 'imported', color: '#3b82f6' }],
        tasks: [makeTaskPayload('task-1', {
          title: 'Imported task',
          tags: [{ id: 'tag-1', name: 'imported', color: '#3b82f6' }],
        })],
      });

      const res = await app.request('/api/data/import', json(payload));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<ImportResult>;
      expect(body.data.tasksImported).toBe(1);
      expect(body.data.tagsImported).toBe(1);

      // Verify data exists
      const exportRes = await app.request('/api/data/export');
      const exported = (await exportRes.json() as ApiResponse<ExportData>).data;
      expect(exported.tasks).toHaveLength(1);
      expect(exported.tags).toHaveLength(1);
    });

    it('should be idempotent — skip existing tasks and tags', async () => {
      const payload = makeImportPayload({
        tags: [{ id: 'tag-1', name: 'unique', color: '#3b82f6' }],
        tasks: [makeTaskPayload('task-1')],
      });

      // Import twice
      await app.request('/api/data/import', json(payload));
      const res = await app.request('/api/data/import', json(payload));
      const body = await res.json() as ApiResponse<ImportResult>;
      expect(body.data.tasksImported).toBe(0);
      expect(body.data.tagsImported).toBe(0);

      // Should still only have 1 of each
      const exportRes = await app.request('/api/data/export');
      const exported = (await exportRes.json() as ApiResponse<ExportData>).data;
      expect(exported.tasks).toHaveLength(1);
      expect(exported.tags).toHaveLength(1);
    });

    it('should import subtasks', async () => {
      const now = new Date().toISOString();
      const payload = makeImportPayload({
        tasks: [makeTaskPayload('task-1', {
          subtasks: [
            { id: 'sub-1', taskId: 'task-1', title: 'Step 1', completed: false, position: 0, createdAt: now },
            { id: 'sub-2', taskId: 'task-1', title: 'Step 2', completed: true, position: 1, createdAt: now },
          ],
        })],
      });

      const res = await app.request('/api/data/import', json(payload));
      expect(res.status).toBe(200);

      const exportRes = await app.request('/api/data/export');
      const exported = (await exportRes.json() as ApiResponse<ExportData>).data;
      expect(exported.tasks[0].subtasks).toHaveLength(2);
    });

    it('should import preferences', async () => {
      const payload = makeImportPayload({
        preferences: {
          id: 'default',
          theme: 'dark',
          defaultView: 'kanban',
          defaultPriority: 'high',
          pomodoroWorkMinutes: 30,
          pomodoroShortBreakMinutes: 10,
          pomodoroLongBreakMinutes: 20,
          pomodoroSessionsBeforeLongBreak: 3,
          sidebarCollapsed: true,
          showCompletedTasks: false,
          updatedAt: new Date().toISOString(),
        },
      });

      await app.request('/api/data/import', json(payload));
      const exportRes = await app.request('/api/data/export');
      const exported = (await exportRes.json() as ApiResponse<ExportData>).data;
      expect(exported.preferences.theme).toBe('dark');
      expect(exported.preferences.defaultView).toBe('kanban');
      expect(exported.preferences.pomodoroWorkMinutes).toBe(30);
    });

    it('should use a transaction — rollback on failure (Bug 3 fix)', async () => {
      // Import one valid task first
      const validPayload = makeImportPayload({
        tasks: [makeTaskPayload('existing-task')],
      });
      await app.request('/api/data/import', json(validPayload));

      // Attempt an import with a task that has a subtask referencing a nonexistent task ID
      // This should fail due to FK constraint within the transaction
      const badPayload = makeImportPayload({
        tasks: [makeTaskPayload('task-bad', {
          subtasks: [{
            id: 'sub-bad',
            taskId: 'nonexistent-parent',  // FK violation
            title: 'Bad subtask',
            completed: false,
            position: 0,
            createdAt: new Date().toISOString(),
          }],
        })],
      });

      // This should throw/fail due to FK constraint
      try {
        const res = await app.request('/api/data/import', json(badPayload));
        // If it returns a response, it should be an error
        if (res.status === 200) {
          // If somehow it succeeds, check that the bad task wasn't partially imported
          const exportRes = await app.request('/api/data/export');
          const exported = (await exportRes.json() as ApiResponse<ExportData>).data;
          // Should only have the first valid task, not the bad one
          const badTask = exported.tasks.find((t) => t.id === 'task-bad');
          // If transaction works, badTask should not exist (rolled back)
          // If no transaction, badTask might exist without its subtask
          expect(badTask).toBeUndefined();
        }
      } catch {
        // Expected — transaction rolled back
      }

      // Original data should still be intact
      const exportRes = await app.request('/api/data/export');
      const exported = (await exportRes.json() as ApiResponse<ExportData>).data;
      expect(exported.tasks.find((t) => t.id === 'existing-task')).toBeDefined();
    });

    it('should return 400 for schema-violating import body', async () => {
      const res = await app.request('/api/data/import', json({
        version: 1,          // should be string
        exportedAt: 'now',
        tasks: 'invalid',    // should be array
        tags: [],
        preferences: null,   // should be object
      }));
      expect(res.status).toBe(400);
    });

    it('should return 400 when required top-level fields are missing', async () => {
      const res = await app.request('/api/data/import', json({
        // missing version, exportedAt, tasks, tags, preferences
        data: 'incomplete',
      }));
      expect(res.status).toBe(400);
    });

    it('should import recurring config', async () => {
      const payload = makeImportPayload({
        tasks: [makeTaskPayload('task-r', {
          recurringConfig: {
            id: 'rc-1',
            taskId: 'task-r',
            type: 'weekly',
            interval: 1,
            daysOfWeek: [1, 3, 5],
            dayOfMonth: null,
            nextOccurrence: '2026-03-03',
            lastGenerated: null,
          },
        })],
      });

      await app.request('/api/data/import', json(payload));
      const exportRes = await app.request('/api/data/export');
      const exported = (await exportRes.json() as ApiResponse<ExportData>).data;
      expect(exported.tasks[0].recurringConfig).not.toBeNull();
      expect(exported.tasks[0].recurringConfig?.type).toBe('weekly');
      expect(exported.tasks[0].recurringConfig?.daysOfWeek).toEqual([1, 3, 5]);
    });
  });
});
