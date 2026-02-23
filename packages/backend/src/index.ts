import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { runMigrations } from './db/migrate.js';
import taskRoutes from './routes/tasks.js';
import subtaskRoutes from './routes/subtasks.js';
import tagRoutes from './routes/tags.js';
import pomodoroRoutes from './routes/pomodoro.js';
import timeTrackingRoutes from './routes/timeTracking.js';
import preferenceRoutes from './routes/preferences.js';
import dataRoutes from './routes/data.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Run migrations on startup
runMigrations();

const isProduction = process.env.NODE_ENV === 'production';

const app = new Hono();

// Middleware
app.use('*', logger());

if (!isProduction) {
  // Only enable permissive CORS in development (Vite dev server proxies in prod)
  app.use(
    '*',
    cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  );
}

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// API Routes (must come before static file serving)
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

if (isProduction) {
  // serveStatic root must be relative to process.cwd().
  // In production the Docker WORKDIR is /app, so the frontend dist is at:
  //   /app/packages/frontend/dist  -> relative: packages/frontend/dist
  const STATIC_ROOT = 'packages/frontend/dist';

  // Serve static assets (JS, CSS, images, etc.)
  app.use(
    '*',
    serveStatic({
      root: STATIC_ROOT,
    })
  );

  // SPA fallback: serve index.html for all non-API routes that didn't match a static file
  app.use('*', async (c) => {
    const indexPath = resolve(process.cwd(), STATIC_ROOT, 'index.html');
    if (existsSync(indexPath)) {
      const html = readFileSync(indexPath, 'utf-8');
      return c.html(html);
    }
    return c.text('Not found', 404);
  });
} else {
  // 404 handler for development (Vite handles frontend)
  app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
  });
}

const port = parseInt(process.env.PORT || '3001', 10);
console.log(`FlowTask backend starting on port ${port}...`);
console.log(`Environment: ${isProduction ? 'production' : 'development'}`);

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});

console.log(`FlowTask backend running at http://localhost:${port}`);
