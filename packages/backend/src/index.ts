import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { runMigrations } from './db/migrate.js';
import taskRoutes from './routes/tasks.js';
import subtaskRoutes from './routes/subtasks.js';
import tagRoutes from './routes/tags.js';
import pomodoroRoutes from './routes/pomodoro.js';
import timeTrackingRoutes from './routes/timeTracking.js';
import preferenceRoutes from './routes/preferences.js';
import dataRoutes from './routes/data.js';

// Run migrations on startup
runMigrations();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Routes
app.route('/api/tasks', taskRoutes);
app.route('/api', subtaskRoutes);
app.route('/api/tags', tagRoutes);
app.route('/api', pomodoroRoutes);
app.route('/api', timeTrackingRoutes);
app.route('/api/preferences', preferenceRoutes);
app.route('/api/data', dataRoutes);

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

const port = parseInt(process.env.PORT || '3001', 10);
console.log(`FlowTask backend starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`FlowTask backend running at http://localhost:${port}`);
