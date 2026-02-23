import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../db/schema.js';
import { beforeEach } from 'vitest';

export type ApiResponse<T> = { data: T };
export type SuccessResponse = { data: { success: boolean } };
export type ErrorResponse = { error: string };

// Mutable test DB references — reassigned each beforeEach
export let testSqlite: InstanceType<typeof Database>;
export let testDb: ReturnType<typeof drizzle>;

function runTestMigrations(db: InstanceType<typeof Database>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      color TEXT,
      due_date TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, tag_id)
    );
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_minutes INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS recurring_configs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      interval INTEGER NOT NULL DEFAULT 1,
      days_of_week TEXT,
      day_of_month INTEGER,
      next_occurrence TEXT NOT NULL,
      last_generated TEXT
    );
    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY DEFAULT 'default',
      theme TEXT NOT NULL DEFAULT 'system',
      default_view TEXT NOT NULL DEFAULT 'list',
      default_priority TEXT NOT NULL DEFAULT 'medium',
      pomodoro_work_minutes INTEGER NOT NULL DEFAULT 25,
      pomodoro_short_break_minutes INTEGER NOT NULL DEFAULT 5,
      pomodoro_long_break_minutes INTEGER NOT NULL DEFAULT 15,
      pomodoro_sessions_before_long_break INTEGER NOT NULL DEFAULT 4,
      sidebar_collapsed INTEGER NOT NULL DEFAULT 0,
      show_completed_tasks INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_id ON pomodoro_sessions(task_id);
    CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
    CREATE INDEX IF NOT EXISTS idx_recurring_configs_task_id ON recurring_configs(task_id);
  `);
  db.prepare(`INSERT OR IGNORE INTO user_preferences (id, updated_at) VALUES ('default', ?)`).run(new Date().toISOString());
}

beforeEach(() => {
  testSqlite = new Database(':memory:');
  testSqlite.pragma('journal_mode = WAL');
  testSqlite.pragma('foreign_keys = ON');
  testDb = drizzle(testSqlite, { schema });
  runTestMigrations(testSqlite);
});
