import { describe, it, expect, vi } from 'vitest';

// Mock the DB connection to use in-memory test DB
vi.mock('../../db/connection.js', async () => {
  const setup = await import('../helpers/setup.js');
  return {
    get db() { return setup.testDb; },
    get sqlite() { return setup.testSqlite; },
  };
});

import { Hono } from 'hono';
import taskRoutes from '../../routes/tasks.js';
import tagRoutes from '../../routes/tags.js';

function createTestApp() {
  const app = new Hono();
  app.get('/api/health', (c) => c.json({ status: 'ok' }));
  app.route('/api/tasks', taskRoutes);
  app.route('/api/tags', tagRoutes);
  return app;
}

describe('Health check', () => {
  it('should return ok', async () => {
    const app = createTestApp();
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('should create a task', async () => {
    const app = createTestApp();
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.title).toBe('Test task');
    expect(body.data.status).toBe('todo');
  });

  it('should list tags (empty initially)', async () => {
    const app = createTestApp();
    const res = await app.request('/api/tags');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});
