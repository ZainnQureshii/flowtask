import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  color: text('color'),
  dueDate: text('due_date'),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const subtasks = sqliteTable('subtasks', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
});

export const taskTags = sqliteTable('task_tags', {
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});

export const pomodoroSessions = sqliteTable('pomodoro_sessions', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  durationMinutes: integer('duration_minutes').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  type: text('type').notNull(),
});

export const timeEntries = sqliteTable('time_entries', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  note: text('note').notNull().default(''),
});

export const recurringConfigs = sqliteTable('recurring_configs', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  interval: integer('interval').notNull().default(1),
  daysOfWeek: text('days_of_week'),
  dayOfMonth: integer('day_of_month'),
  nextOccurrence: text('next_occurrence').notNull(),
  lastGenerated: text('last_generated'),
});

export const userPreferences = sqliteTable('user_preferences', {
  id: text('id').primaryKey().default('default'),
  theme: text('theme').notNull().default('system'),
  defaultView: text('default_view').notNull().default('list'),
  defaultPriority: text('default_priority').notNull().default('medium'),
  pomodoroWorkMinutes: integer('pomodoro_work_minutes').notNull().default(25),
  pomodoroShortBreakMinutes: integer('pomodoro_short_break_minutes').notNull().default(5),
  pomodoroLongBreakMinutes: integer('pomodoro_long_break_minutes').notNull().default(15),
  pomodoroSessionsBeforeLongBreak: integer('pomodoro_sessions_before_long_break').notNull().default(4),
  sidebarCollapsed: integer('sidebar_collapsed', { mode: 'boolean' }).notNull().default(false),
  showCompletedTasks: integer('show_completed_tasks', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});
