import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/connection.js', async () => {
  const setup = await import('../helpers/setup.js');
  return {
    get db() { return setup.testDb; },
    get sqlite() { return setup.testSqlite; },
  };
});

import { Hono } from 'hono';
import type { Task, Tag, PaginatedResponse } from '@flowtask/shared';
import type { ApiResponse, SuccessResponse } from '../helpers/setup.js';
import taskRoutes from '../../routes/tasks.js';
import tagRoutes from '../../routes/tags.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api/tasks', taskRoutes);
  app.route('/api/tags', tagRoutes);
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

async function createTask(app: Hono, overrides: Record<string, unknown> = {}): Promise<Task> {
  const res = await app.request('/api/tasks', json({ title: 'Test task', ...overrides }));
  return (await res.json() as ApiResponse<Task>).data;
}

async function createTag(app: Hono, name: string, color = '#ef4444'): Promise<Tag> {
  const res = await app.request('/api/tags', json({ name, color }));
  return (await res.json() as ApiResponse<Tag>).data;
}

describe('Tasks API', () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/tasks', () => {
    it('should create a task with defaults', async () => {
      const res = await app.request('/api/tasks', json({ title: 'My task' }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.title).toBe('My task');
      expect(body.data.status).toBe('todo');
      expect(body.data.priority).toBe('medium');
      expect(body.data.description).toBe('');
      expect(body.data.tags).toEqual([]);
      expect(body.data.subtasks).toEqual([]);
      expect(body.data.recurringConfig).toBeNull();
    });

    it('should create a task with all fields', async () => {
      const res = await app.request('/api/tasks', json({
        title: 'Full task',
        description: 'A description',
        status: 'in_progress',
        priority: 'high',
        color: '#ef4444',
        dueDate: '2026-03-01T00:00:00.000Z',
      }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.title).toBe('Full task');
      expect(body.data.description).toBe('A description');
      expect(body.data.status).toBe('in_progress');
      expect(body.data.priority).toBe('high');
      expect(body.data.color).toBe('#ef4444');
      expect(body.data.dueDate).toBe('2026-03-01T00:00:00.000Z');
    });

    it('should reject empty title', async () => {
      const res = await app.request('/api/tasks', json({ title: '' }));
      expect(res.status).toBe(400);
    });

    it('should reject empty string dueDate', async () => {
      const res = await app.request('/api/tasks', json({ title: 'Task', dueDate: '' }));
      expect(res.status).toBe(400);
    });

    it('should accept title at exactly 500 characters', async () => {
      const title = 'a'.repeat(500);
      const res = await app.request('/api/tasks', json({ title }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.title).toBe(title);
    });

    it('should reject title exceeding 500 characters', async () => {
      const title = 'a'.repeat(501);
      const res = await app.request('/api/tasks', json({ title }));
      expect(res.status).toBe(400);
    });

    it('should accept whitespace-only title (passes min(1) length check — no trim on tasks schema)', async () => {
      const res = await app.request('/api/tasks', json({ title: '   ' }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.title).toBe('   ');
    });

    it('should reject non-hex color string', async () => {
      const res = await app.request('/api/tasks', json({ title: 'Task', color: 'red' }));
      expect(res.status).toBe(400);
    });

    it('should accept valid 6-digit hex color', async () => {
      const res = await app.request('/api/tasks', json({ title: 'Task', color: '#ff0000' }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.color).toBe('#ff0000');
    });

    it('should auto-assign position based on max for status', async () => {
      const t1 = await createTask(app);
      const t2 = await createTask(app);
      expect(t1.position).toBe(0);
      expect(t2.position).toBe(1);
    });

    it('should create a task with tags', async () => {
      const tag = await createTag(app, 'work');
      const res = await app.request('/api/tasks', json({
        title: 'Tagged task',
        tagIds: [tag.id],
      }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.tags).toHaveLength(1);
      expect(body.data.tags[0].name).toBe('work');
    });

    it('should create a task with recurring config', async () => {
      const res = await app.request('/api/tasks', json({
        title: 'Daily task',
        recurringConfig: {
          type: 'daily',
          interval: 1,
          nextOccurrence: '2026-03-01',
        },
      }));
      expect(res.status).toBe(201);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.recurringConfig).not.toBeNull();
      expect(body.data.recurringConfig?.type).toBe('daily');
    });
  });

  describe('GET /api/tasks', () => {
    it('should return empty list initially', async () => {
      const res = await app.request('/api/tasks');
      expect(res.status).toBe(200);
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should return created tasks', async () => {
      await createTask(app, { title: 'Task A' });
      await createTask(app, { title: 'Task B' });
      const res = await app.request('/api/tasks');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(2);
      expect(body.total).toBe(2);
    });

    it('should filter by status', async () => {
      await createTask(app, { title: 'Todo', status: 'todo' });
      await createTask(app, { title: 'Done', status: 'done' });
      const res = await app.request('/api/tasks?status=todo');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Todo');
    });

    it('should filter by priority', async () => {
      await createTask(app, { title: 'High', priority: 'high' });
      await createTask(app, { title: 'Low', priority: 'low' });
      const res = await app.request('/api/tasks?priority=high');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('High');
    });

    it('should filter by search term', async () => {
      await createTask(app, { title: 'Buy groceries' });
      await createTask(app, { title: 'Write code' });
      const res = await app.request('/api/tasks?search=groceries');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Buy groceries');
    });

    it('should filter by tag', async () => {
      const tag = await createTag(app, 'urgent');
      await createTask(app, { title: 'Tagged', tagIds: [tag.id] });
      await createTask(app, { title: 'Untagged' });
      const res = await app.request(`/api/tasks?tagIds=${tag.id}`);
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Tagged');
    });

    it('should filter by dueDate range', async () => {
      await createTask(app, { title: 'Early', dueDate: '2026-01-01T00:00:00.000Z' });
      await createTask(app, { title: 'Late', dueDate: '2026-12-01T00:00:00.000Z' });
      const res = await app.request('/api/tasks?dueDateFrom=2026-06-01&dueDateTo=2026-12-31');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Late');
    });

    it('should paginate results', async () => {
      for (let i = 0; i < 5; i++) {
        await createTask(app, { title: `Task ${i}` });
      }
      const res = await app.request('/api/tasks?page=2&pageSize=2');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(2);
      expect(body.total).toBe(5);
    });

    it('should sort by createdAt desc', async () => {
      await createTask(app, { title: 'First' });
      await createTask(app, { title: 'Second' });
      const res = await app.request('/api/tasks?sortBy=createdAt&sortOrder=desc');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data[0].title).toBe('Second');
    });

    it('should filter by combined status and priority', async () => {
      await createTask(app, { title: 'High todo', status: 'todo', priority: 'high' });
      await createTask(app, { title: 'Low todo', status: 'todo', priority: 'low' });
      await createTask(app, { title: 'High done', status: 'done', priority: 'high' });
      const res = await app.request('/api/tasks?status=todo&priority=high');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('High todo');
    });

    it('should filter by combined search and tagIds', async () => {
      const tag = await createTag(app, 'combo');
      await createTask(app, { title: 'Foo with tag', tagIds: [tag.id] });
      await createTask(app, { title: 'Foo without tag' });
      await createTask(app, { title: 'Bar with tag', tagIds: [tag.id] });
      const res = await app.request(`/api/tasks?search=Foo&tagIds=${tag.id}`);
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Foo with tag');
    });

    it('should sort by priority asc', async () => {
      await createTask(app, { title: 'Low', priority: 'low' });
      await createTask(app, { title: 'High', priority: 'high' });
      await createTask(app, { title: 'Medium', priority: 'medium' });
      const res = await app.request('/api/tasks?sortBy=priority&sortOrder=asc');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toHaveLength(3);
      // Sorted alphabetically: 'high' < 'low' < 'medium'
      expect(body.data[0].priority).toBe('high');
      expect(body.data[1].priority).toBe('low');
      expect(body.data[2].priority).toBe('medium');
    });

    it('should sort by dueDate asc', async () => {
      await createTask(app, { title: 'Late', dueDate: '2026-12-01T00:00:00.000Z' });
      await createTask(app, { title: 'Early', dueDate: '2026-01-01T00:00:00.000Z' });
      const res = await app.request('/api/tasks?sortBy=dueDate&sortOrder=asc');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data[0].title).toBe('Early');
      expect(body.data[1].title).toBe('Late');
    });

    it('should return empty for tag filter with no matches', async () => {
      await createTask(app, { title: 'No tag' });
      const res = await app.request('/api/tasks?tagIds=nonexistent');
      const body = await res.json() as PaginatedResponse<Task>;
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a task by id', async () => {
      const task = await createTask(app, { title: 'Find me' });
      const res = await app.request(`/api/tasks/${task.id}`);
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.title).toBe('Find me');
      expect(body.data.tags).toEqual([]);
      expect(body.data.subtasks).toEqual([]);
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update task title', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}`, patch({ title: 'Updated' }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.title).toBe('Updated');
    });

    it('should update task status', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}`, patch({ status: 'done' }));
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.status).toBe('done');
    });

    it('should update task tags', async () => {
      const tag1 = await createTag(app, 'tag1');
      const tag2 = await createTag(app, 'tag2');
      const task = await createTask(app, { tagIds: [tag1.id] });
      const res = await app.request(`/api/tasks/${task.id}`, patch({ tagIds: [tag2.id] }));
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.tags).toHaveLength(1);
      expect(body.data.tags[0].name).toBe('tag2');
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent', patch({ title: 'Nope' }));
      expect(res.status).toBe(404);
    });

    it('should reject invalid dueDate (Bug 1 fix)', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}`, patch({ dueDate: 'not-a-date' }));
      expect(res.status).toBe(400);
    });

    it('should accept valid ISO dueDate', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}`, patch({ dueDate: '2026-06-15T12:00:00.000Z' }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.dueDate).toBe('2026-06-15T12:00:00.000Z');
    });

    it('should accept null dueDate', async () => {
      const task = await createTask(app, { dueDate: '2026-06-15T12:00:00.000Z' });
      const res = await app.request(`/api/tasks/${task.id}`, patch({ dueDate: null }));
      expect(res.status).toBe(200);
      const body = await res.json() as ApiResponse<Task>;
      expect(body.data.dueDate).toBeNull();
    });

    it('should reject non-hex color string on update', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}`, patch({ color: 'invalidcolor' }));
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const task = await createTask(app);
      const res = await app.request(`/api/tasks/${task.id}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.data.success).toBe(true);

      // Verify deleted
      const get = await app.request(`/api/tasks/${task.id}`);
      expect(get.status).toBe(404);
    });

    it('should return 404 for nonexistent task', async () => {
      const res = await app.request('/api/tasks/nonexistent', { method: 'DELETE' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tasks/reorder', () => {
    it('should reorder tasks', async () => {
      const t1 = await createTask(app, { title: 'A' });
      const t2 = await createTask(app, { title: 'B' });
      const res = await app.request('/api/tasks/reorder', json({
        items: [
          { taskId: t1.id, newPosition: 1 },
          { taskId: t2.id, newPosition: 0 },
        ],
      }));
      expect(res.status).toBe(200);

      // Verify new positions
      const get1 = await app.request(`/api/tasks/${t1.id}`);
      const get2 = await app.request(`/api/tasks/${t2.id}`);
      expect((await get1.json() as ApiResponse<Task>).data.position).toBe(1);
      expect((await get2.json() as ApiResponse<Task>).data.position).toBe(0);
    });

    it('should update status during reorder', async () => {
      const task = await createTask(app);
      await app.request('/api/tasks/reorder', json({
        items: [{ taskId: task.id, newPosition: 0, newStatus: 'in_progress' }],
      }));
      const get = await app.request(`/api/tasks/${task.id}`);
      expect((await get.json() as ApiResponse<Task>).data.status).toBe('in_progress');
    });

    it('should handle empty items array as a no-op', async () => {
      const res = await app.request('/api/tasks/reorder', json({ items: [] }));
      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.data.success).toBe(true);
    });

    it('should silently ignore non-existent taskIds (no-op update)', async () => {
      const res = await app.request('/api/tasks/reorder', json({
        items: [{ taskId: 'nonexistent-id', newPosition: 5 }],
      }));
      expect(res.status).toBe(200);
      const body = await res.json() as SuccessResponse;
      expect(body.data.success).toBe(true);
    });
  });

  describe('Recurring task completion (Bug 2 fix)', () => {
    it('should clone task with correct position when completing recurring task', async () => {
      // Create a non-recurring task at position 0
      await createTask(app, { title: 'Existing todo' });

      // Create a recurring task
      const recurRes = await app.request('/api/tasks', json({
        title: 'Recurring task',
        recurringConfig: {
          type: 'daily',
          interval: 1,
          nextOccurrence: '2026-03-01',
        },
      }));
      const recurTask = (await recurRes.json() as ApiResponse<Task>).data;

      // Mark it as done
      await app.request(`/api/tasks/${recurTask.id}`, patch({ status: 'done' }));

      // List todo tasks — the clone should have a non-colliding position
      const listRes = await app.request('/api/tasks?status=todo');
      const listBody = await listRes.json() as PaginatedResponse<Task>;
      const todoTasks = listBody.data;
      const positions = todoTasks.map((t) => t.position);
      // All positions should be unique
      expect(new Set(positions).size).toBe(positions.length);
    });

    it('should generate a new task with the next due date', async () => {
      const res = await app.request('/api/tasks', json({
        title: 'Daily standup',
        dueDate: '2026-03-01T09:00:00.000Z',
        recurringConfig: {
          type: 'daily',
          interval: 1,
          nextOccurrence: '2026-03-01',
        },
      }));
      const task = (await res.json() as ApiResponse<Task>).data;

      // Complete the task
      await app.request(`/api/tasks/${task.id}`, patch({ status: 'done' }));

      // The new task should exist
      const listRes = await app.request('/api/tasks?status=todo');
      const listBody = await listRes.json() as PaginatedResponse<Task>;
      const newTask = listBody.data.find((t) => t.id !== task.id);
      expect(newTask).toBeDefined();
      expect(newTask?.title).toBe('Daily standup');
      expect(newTask?.recurringConfig).not.toBeNull();
      // Next occurrence should be the day after
      expect(newTask?.dueDate).toBe('2026-03-02');
    });

    it('should clone tags and subtasks for recurring task', async () => {
      const tag = await createTag(app, 'daily');
      const res = await app.request('/api/tasks', json({
        title: 'With extras',
        tagIds: [tag.id],
        recurringConfig: {
          type: 'daily',
          interval: 1,
          nextOccurrence: '2026-03-01',
        },
      }));
      const task = (await res.json() as ApiResponse<Task>).data;

      // Complete it
      await app.request(`/api/tasks/${task.id}`, patch({ status: 'done' }));

      // Find the cloned task
      const listRes = await app.request('/api/tasks?status=todo');
      const listBody = await listRes.json() as PaginatedResponse<Task>;
      const clone = listBody.data.find((t) => t.id !== task.id);
      expect(clone).toBeDefined();
      expect(clone?.tags).toHaveLength(1);
      expect(clone?.tags[0].name).toBe('daily');
    });
  });
});
