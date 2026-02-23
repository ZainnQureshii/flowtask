import { Hono } from 'hono';
import { eq, asc } from 'drizzle-orm';
import { db, sqlite } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { parseBody } from '../middleware/validate.js';
import { importDataSchema, generateId } from '@flowtask/shared';
import type { Task, ExportData } from '@flowtask/shared';

const app = new Hono();

function nowISO(): string {
  return new Date().toISOString();
}

// GET /data/export
app.get('/export', async (c) => {
  const allTasks = db.select().from(schema.tasks).all();
  const allTags = db.select().from(schema.tags).all();
  const allSubtasks = db
    .select()
    .from(schema.subtasks)
    .orderBy(asc(schema.subtasks.position))
    .all();
  const allTaskTags = db.select().from(schema.taskTags).all();
  const allPomodoro = db.select().from(schema.pomodoroSessions).all();
  const allTimeEntries = db.select().from(schema.timeEntries).all();
  const allRecurring = db.select().from(schema.recurringConfigs).all();
  const prefs = db
    .select()
    .from(schema.userPreferences)
    .where(eq(schema.userPreferences.id, 'default'))
    .get()!;

  const fullTasks = allTasks.map((task) => {
    const taskTagIds = allTaskTags
      .filter((tt) => tt.taskId === task.id)
      .map((tt) => tt.tagId);
    const taskTags = allTags.filter((t) => taskTagIds.includes(t.id));
    const taskSubtasks = allSubtasks
      .filter((s) => s.taskId === task.id)
      .map((s) => ({ ...s, completed: Boolean(s.completed) }));
    const taskPomodoro = allPomodoro
      .filter((p) => p.taskId === task.id)
      .map((p) => ({ ...p, completed: Boolean(p.completed) }));
    const taskTimeEntries = allTimeEntries.filter(
      (te) => te.taskId === task.id
    );
    const recurConfig = allRecurring.find((r) => r.taskId === task.id);
    const totalTimeSpent = taskTimeEntries.reduce(
      (sum, te) => sum + te.durationSeconds,
      0
    );

    return {
      ...task,
      tags: taskTags,
      subtasks: taskSubtasks,
      recurringConfig: recurConfig
        ? {
            ...recurConfig,
            daysOfWeek: recurConfig.daysOfWeek
              ? JSON.parse(recurConfig.daysOfWeek)
              : null,
          }
        : null,
      pomodoroSessions: taskPomodoro,
      timeEntries: taskTimeEntries,
      totalTimeSpent,
    };
  });

  const exportData = {
    version: '1.0.0',
    exportedAt: nowISO(),
    tasks: fullTasks,
    tags: allTags,
    preferences: {
      ...prefs,
      sidebarCollapsed: Boolean(prefs.sidebarCollapsed),
      showCompletedTasks: Boolean(prefs.showCompletedTasks),
    },
  };

  return c.json({ data: exportData });
});

// POST /data/import
app.post('/import', async (c) => {
  const parsed = await parseBody(c, importDataSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;
  const now = nowISO();

  let tasksImported = 0;
  let tagsImported = 0;

  sqlite.transaction(() => {
    // Import tags first
    for (const tag of body.tags) {
      const existing = db
        .select()
        .from(schema.tags)
        .where(eq(schema.tags.id, tag.id))
        .get();
      if (!existing) {
        db.insert(schema.tags)
          .values({ id: tag.id, name: tag.name, color: tag.color })
          .run();
        tagsImported++;
      }
    }

    // Import tasks
    for (const task of body.tasks) {
      const existing = db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, task.id))
        .get();
      if (existing) continue;

      db.insert(schema.tasks)
        .values({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          color: task.color,
          dueDate: task.dueDate,
          position: task.position,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        })
        .run();

      for (const sub of task.subtasks) {
        db.insert(schema.subtasks)
          .values({
            id: sub.id,
            taskId: task.id,
            title: sub.title,
            completed: sub.completed,
            position: sub.position,
            createdAt: sub.createdAt,
          })
          .run();
      }

      for (const tag of task.tags) {
        db.insert(schema.taskTags)
          .values({ taskId: task.id, tagId: tag.id })
          .run();
      }

      if (task.recurringConfig) {
        db.insert(schema.recurringConfigs)
          .values({
            id: task.recurringConfig.id,
            taskId: task.id,
            type: task.recurringConfig.type,
            interval: task.recurringConfig.interval,
            daysOfWeek: task.recurringConfig.daysOfWeek
              ? JSON.stringify(task.recurringConfig.daysOfWeek)
              : null,
            dayOfMonth: task.recurringConfig.dayOfMonth,
            nextOccurrence: task.recurringConfig.nextOccurrence,
            lastGenerated: task.recurringConfig.lastGenerated,
          })
          .run();
      }

      for (const session of task.pomodoroSessions) {
        db.insert(schema.pomodoroSessions)
          .values({
            id: session.id,
            taskId: task.id,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            durationMinutes: session.durationMinutes,
            completed: session.completed,
            type: session.type,
          })
          .run();
      }

      for (const entry of task.timeEntries) {
        db.insert(schema.timeEntries)
          .values({
            id: entry.id,
            taskId: task.id,
            startedAt: entry.startedAt,
            endedAt: entry.endedAt,
            durationSeconds: entry.durationSeconds,
            note: entry.note,
          })
          .run();
      }

      tasksImported++;
    }

    // Import preferences
    if (body.preferences) {
      db.update(schema.userPreferences)
        .set({
          theme: body.preferences.theme,
          defaultView: body.preferences.defaultView,
          defaultPriority: body.preferences.defaultPriority,
          pomodoroWorkMinutes: body.preferences.pomodoroWorkMinutes,
          pomodoroShortBreakMinutes: body.preferences.pomodoroShortBreakMinutes,
          pomodoroLongBreakMinutes: body.preferences.pomodoroLongBreakMinutes,
          pomodoroSessionsBeforeLongBreak:
            body.preferences.pomodoroSessionsBeforeLongBreak,
          sidebarCollapsed: body.preferences.sidebarCollapsed,
          showCompletedTasks: body.preferences.showCompletedTasks,
          updatedAt: now,
        })
        .where(eq(schema.userPreferences.id, 'default'))
        .run();
    }
  })();

  return c.json({ data: { tasksImported, tagsImported } });
});

export default app;
