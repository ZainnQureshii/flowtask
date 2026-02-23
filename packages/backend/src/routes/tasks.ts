import { Hono } from 'hono';
import { eq, like, or, gte, lte, inArray, sql, asc, desc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { parseBody } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  reorderSchema,
  generateId,
} from '@flowtask/shared';

const app = new Hono();

function nowISO(): string {
  return new Date().toISOString();
}

type SubtaskRow = typeof schema.subtasks.$inferSelect;
type PomodoroRow = typeof schema.pomodoroSessions.$inferSelect;
type TimeEntryRow = typeof schema.timeEntries.$inferSelect;
type TagRow = typeof schema.tags.$inferSelect;
type RecurringRow = typeof schema.recurringConfigs.$inferSelect;

// Batch-load all relations for a set of task IDs (fixes N+1 query problem)
function batchLoadRelations(taskIds: string[]) {
  if (taskIds.length === 0) {
    return {
      tagsMap: new Map<string, TagRow[]>(),
      subtasksMap: new Map<string, SubtaskRow[]>(),
      recurringMap: new Map<string, RecurringRow>(),
      pomodoroMap: new Map<string, PomodoroRow[]>(),
      timeEntriesMap: new Map<string, TimeEntryRow[]>(),
    };
  }

  // 1. All task-tag mappings + tags
  const allTaskTags = db
    .select()
    .from(schema.taskTags)
    .where(inArray(schema.taskTags.taskId, taskIds))
    .all();

  const allTagIds = [...new Set(allTaskTags.map((tt) => tt.tagId))];
  const allTags =
    allTagIds.length > 0
      ? db
          .select()
          .from(schema.tags)
          .where(inArray(schema.tags.id, allTagIds))
          .all()
      : [];
  const tagById = new Map(allTags.map((t) => [t.id, t]));

  const tagsMap = new Map<string, TagRow[]>();
  for (const tt of allTaskTags) {
    const tag = tagById.get(tt.tagId);
    if (!tag) continue;
    const list = tagsMap.get(tt.taskId) ?? [];
    list.push(tag);
    tagsMap.set(tt.taskId, list);
  }

  // 2. All subtasks
  const allSubtasks = db
    .select()
    .from(schema.subtasks)
    .where(inArray(schema.subtasks.taskId, taskIds))
    .orderBy(asc(schema.subtasks.position))
    .all();

  const subtasksMap = new Map<string, SubtaskRow[]>();
  for (const s of allSubtasks) {
    const list = subtasksMap.get(s.taskId) ?? [];
    list.push(s);
    subtasksMap.set(s.taskId, list);
  }

  // 3. All recurring configs
  const allRecurring = db
    .select()
    .from(schema.recurringConfigs)
    .where(inArray(schema.recurringConfigs.taskId, taskIds))
    .all();

  const recurringMap = new Map(allRecurring.map((r) => [r.taskId, r]));

  // 4. All pomodoro sessions
  const allPomodoro = db
    .select()
    .from(schema.pomodoroSessions)
    .where(inArray(schema.pomodoroSessions.taskId, taskIds))
    .all();

  const pomodoroMap = new Map<string, PomodoroRow[]>();
  for (const p of allPomodoro) {
    const list = pomodoroMap.get(p.taskId) ?? [];
    list.push(p);
    pomodoroMap.set(p.taskId, list);
  }

  // 5. All time entries
  const allTimeEntries = db
    .select()
    .from(schema.timeEntries)
    .where(inArray(schema.timeEntries.taskId, taskIds))
    .all();

  const timeEntriesMap = new Map<string, TimeEntryRow[]>();
  for (const te of allTimeEntries) {
    const list = timeEntriesMap.get(te.taskId) ?? [];
    list.push(te);
    timeEntriesMap.set(te.taskId, list);
  }

  return { tagsMap, subtasksMap, recurringMap, pomodoroMap, timeEntriesMap };
}

function assembleFullTasks(taskRows: (typeof schema.tasks.$inferSelect)[]) {
  const taskIds = taskRows.map((t) => t.id);
  const { tagsMap, subtasksMap, recurringMap, pomodoroMap, timeEntriesMap } =
    batchLoadRelations(taskIds);

  return taskRows.map((task) => {
    const timeEntries = timeEntriesMap.get(task.id) ?? [];
    const totalTimeSpent = timeEntries.reduce(
      (sum, te) => sum + te.durationSeconds,
      0
    );
    const recurConfig = recurringMap.get(task.id) ?? null;

    return {
      ...task,
      tags: tagsMap.get(task.id) ?? [],
      subtasks: (subtasksMap.get(task.id) ?? []).map((s) => ({
        ...s,
        completed: Boolean(s.completed),
      })),
      recurringConfig: recurConfig
        ? {
            ...recurConfig,
            daysOfWeek: recurConfig.daysOfWeek
              ? JSON.parse(recurConfig.daysOfWeek)
              : null,
          }
        : null,
      pomodoroSessions: (pomodoroMap.get(task.id) ?? []).map((p) => ({
        ...p,
        completed: Boolean(p.completed),
      })),
      timeEntries,
      totalTimeSpent,
    };
  });
}

// Single-task convenience wrapper (used by GET/:id, POST, PATCH)
function buildFullTask(taskRow: typeof schema.tasks.$inferSelect) {
  return assembleFullTasks([taskRow])[0];
}

// GET /tasks
app.get('/', async (c) => {
  const {
    status,
    priority,
    tagIds,
    search,
    dueDateFrom,
    dueDateTo,
    page: pageStr,
    pageSize: pageSizeStr,
    sortBy,
    sortOrder,
  } = c.req.query();

  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeStr || '50', 10)));

  const conditions = [];

  if (status) {
    const statuses = status.split(',');
    conditions.push(inArray(schema.tasks.status, statuses));
  }

  if (priority) {
    const priorities = priority.split(',');
    conditions.push(inArray(schema.tasks.priority, priorities));
  }

  if (search) {
    conditions.push(
      or(
        like(schema.tasks.title, `%${search}%`),
        like(schema.tasks.description, `%${search}%`)
      )!
    );
  }

  if (dueDateFrom) {
    conditions.push(gte(schema.tasks.dueDate, dueDateFrom));
  }

  if (dueDateTo) {
    conditions.push(lte(schema.tasks.dueDate, dueDateTo));
  }

  // Tag filter: JOIN into task_tags BEFORE pagination so counts are correct
  if (tagIds) {
    const tagIdList = tagIds.split(',');
    const taskIdsWithTags = db
      .select({ taskId: schema.taskTags.taskId })
      .from(schema.taskTags)
      .where(inArray(schema.taskTags.tagId, tagIdList))
      .all()
      .map((r) => r.taskId);

    if (taskIdsWithTags.length === 0) {
      return c.json({ data: [], total: 0 });
    }
    conditions.push(inArray(schema.tasks.id, [...new Set(taskIdsWithTags)]));
  }

  // Combine conditions
  const whereClause =
    conditions.length > 0
      ? conditions.reduce((acc, cond, i) =>
          i === 0 ? cond : sql`${acc} AND ${cond}`
        )
      : undefined;

  // Determine sort
  const sortColumn =
    sortBy === 'title'
      ? schema.tasks.title
      : sortBy === 'priority'
        ? schema.tasks.priority
        : sortBy === 'dueDate'
          ? schema.tasks.dueDate
          : sortBy === 'createdAt'
            ? schema.tasks.createdAt
            : schema.tasks.position;
  const sortDir = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

  // Count + fetch in two queries
  const totalResult = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.tasks)
    .where(whereClause)
    .get();
  const total = totalResult?.count ?? 0;

  const taskRows = db
    .select()
    .from(schema.tasks)
    .where(whereClause)
    .orderBy(sortDir)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();

  // Batch-load all relations in 5 queries (not 5*N)
  const fullTasks = assembleFullTasks(taskRows);

  return c.json({ data: fullTasks, total });
});

// GET /tasks/:id
app.get('/:id', async (c) => {
  const { id } = c.req.param();
  const taskRow = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, id))
    .get();

  if (!taskRow) {
    return c.json({ error: 'Task not found' }, 404);
  }

  return c.json({ data: buildFullTask(taskRow) });
});

// POST /tasks
app.post('/', async (c) => {
  const parsed = await parseBody(c, createTaskSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const now = nowISO();
  const id = generateId();

  // Get max position for the status
  const maxPos = db
    .select({ maxPosition: sql<number>`COALESCE(MAX(position), -1)` })
    .from(schema.tasks)
    .where(eq(schema.tasks.status, body.status ?? 'todo'))
    .get();
  const position = (maxPos?.maxPosition ?? -1) + 1;

  db.insert(schema.tasks)
    .values({
      id,
      title: body.title,
      description: body.description ?? '',
      status: body.status ?? 'todo',
      priority: body.priority ?? 'medium',
      color: body.color ?? null,
      dueDate: body.dueDate ?? null,
      position,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  // Link tags
  if (body.tagIds && body.tagIds.length > 0) {
    for (const tagId of body.tagIds) {
      db.insert(schema.taskTags).values({ taskId: id, tagId }).run();
    }
  }

  // Create recurring config
  if (body.recurringConfig) {
    db.insert(schema.recurringConfigs)
      .values({
        id: generateId(),
        taskId: id,
        type: body.recurringConfig.type,
        interval: body.recurringConfig.interval,
        daysOfWeek: body.recurringConfig.daysOfWeek
          ? JSON.stringify(body.recurringConfig.daysOfWeek)
          : null,
        dayOfMonth: body.recurringConfig.dayOfMonth ?? null,
        nextOccurrence: body.recurringConfig.nextOccurrence,
        lastGenerated: null,
      })
      .run();
  }

  const taskRow = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, id))
    .get()!;

  return c.json({ data: buildFullTask(taskRow) }, 201);
});

// PATCH /tasks/:id
app.patch('/:id', async (c) => {
  const { id } = c.req.param();
  const parsed = await parseBody(c, updateTaskSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const existing = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, id))
    .get();

  if (!existing) {
    return c.json({ error: 'Task not found' }, 404);
  }

  const now = nowISO();
  const updates: Record<string, unknown> = { updatedAt: now };

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.color !== undefined) updates.color = body.color;
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
  if (body.position !== undefined) updates.position = body.position;

  // Handle status change - check for recurring task completion
  if (body.status !== undefined) {
    updates.status = body.status;

    if (body.status === 'done' && existing.status !== 'done') {
      const recurConfig = db
        .select()
        .from(schema.recurringConfigs)
        .where(eq(schema.recurringConfigs.taskId, id))
        .get();

      if (recurConfig) {
        const nextDate = calculateNextOccurrence(recurConfig);
        const newTaskId = generateId();

        // Get max position for 'todo' status to avoid collision
        const maxPos = db
          .select({ maxPosition: sql<number>`COALESCE(MAX(position), -1)` })
          .from(schema.tasks)
          .where(eq(schema.tasks.status, 'todo'))
          .get();
        const clonePosition = (maxPos?.maxPosition ?? -1) + 1;

        db.insert(schema.tasks)
          .values({
            id: newTaskId,
            title: existing.title,
            description: existing.description,
            status: 'todo',
            priority: existing.priority,
            color: existing.color,
            dueDate: nextDate,
            position: clonePosition,
            createdAt: now,
            updatedAt: now,
          })
          .run();

        // Clone tags
        const existingTags = db
          .select()
          .from(schema.taskTags)
          .where(eq(schema.taskTags.taskId, id))
          .all();
        for (const tag of existingTags) {
          db.insert(schema.taskTags)
            .values({ taskId: newTaskId, tagId: tag.tagId })
            .run();
        }

        // Clone subtask titles (reset completed)
        const existingSubtasks = db
          .select()
          .from(schema.subtasks)
          .where(eq(schema.subtasks.taskId, id))
          .orderBy(asc(schema.subtasks.position))
          .all();
        for (const sub of existingSubtasks) {
          db.insert(schema.subtasks)
            .values({
              id: generateId(),
              taskId: newTaskId,
              title: sub.title,
              completed: false,
              position: sub.position,
              createdAt: now,
            })
            .run();
        }

        // Clone recurring config
        const newNextDate = calculateNextOccurrence({
          ...recurConfig,
          nextOccurrence: nextDate,
        });
        db.insert(schema.recurringConfigs)
          .values({
            id: generateId(),
            taskId: newTaskId,
            type: recurConfig.type,
            interval: recurConfig.interval,
            daysOfWeek: recurConfig.daysOfWeek,
            dayOfMonth: recurConfig.dayOfMonth,
            nextOccurrence: newNextDate,
            lastGenerated: now,
          })
          .run();

        // Update last generated on original
        db.update(schema.recurringConfigs)
          .set({ lastGenerated: now })
          .where(eq(schema.recurringConfigs.id, recurConfig.id))
          .run();
      }
    }
  }

  // Handle tag updates
  if (body.tagIds !== undefined) {
    db.delete(schema.taskTags).where(eq(schema.taskTags.taskId, id)).run();
    for (const tagId of body.tagIds) {
      db.insert(schema.taskTags).values({ taskId: id, tagId }).run();
    }
  }

  // Handle recurring config update
  if (body.recurringConfig !== undefined) {
    db.delete(schema.recurringConfigs)
      .where(eq(schema.recurringConfigs.taskId, id))
      .run();
    if (body.recurringConfig) {
      db.insert(schema.recurringConfigs)
        .values({
          id: generateId(),
          taskId: id,
          type: body.recurringConfig.type,
          interval: body.recurringConfig.interval,
          daysOfWeek: body.recurringConfig.daysOfWeek
            ? JSON.stringify(body.recurringConfig.daysOfWeek)
            : null,
          dayOfMonth: body.recurringConfig.dayOfMonth ?? null,
          nextOccurrence: body.recurringConfig.nextOccurrence,
          lastGenerated: null,
        })
        .run();
    }
  }

  db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id)).run();

  const updatedRow = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, id))
    .get()!;

  return c.json({ data: buildFullTask(updatedRow) });
});

// DELETE /tasks/:id
app.delete('/:id', async (c) => {
  const { id } = c.req.param();
  const existing = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, id))
    .get();

  if (!existing) {
    return c.json({ error: 'Task not found' }, 404);
  }

  db.delete(schema.tasks).where(eq(schema.tasks.id, id)).run();

  return c.json({ data: { success: true } });
});

// POST /tasks/reorder
app.post('/reorder', async (c) => {
  const parsed = await parseBody(c, reorderSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  for (const item of body.items) {
    const updates: Record<string, unknown> = {
      position: item.newPosition,
      updatedAt: nowISO(),
    };
    if (item.newStatus) {
      updates.status = item.newStatus;
    }
    db.update(schema.tasks)
      .set(updates)
      .where(eq(schema.tasks.id, item.taskId))
      .run();
  }

  return c.json({ data: { success: true } });
});

function calculateNextOccurrence(config: {
  type: string;
  interval: number;
  daysOfWeek: string | null;
  dayOfMonth: number | null;
  nextOccurrence: string;
}): string {
  const current = new Date(config.nextOccurrence);

  switch (config.type) {
    case 'daily':
    case 'custom':
      current.setDate(current.getDate() + config.interval);
      break;
    case 'weekly': {
      const days: number[] = config.daysOfWeek
        ? JSON.parse(config.daysOfWeek)
        : [];
      if (days.length === 0) {
        current.setDate(current.getDate() + 7 * config.interval);
      } else {
        const currentDay = current.getDay();
        const sortedDays = [...days].sort((a, b) => a - b);
        const nextDay = sortedDays.find((d) => d > currentDay);
        if (nextDay !== undefined) {
          current.setDate(current.getDate() + (nextDay - currentDay));
        } else {
          const daysUntilFirst = 7 - currentDay + sortedDays[0];
          current.setDate(
            current.getDate() + daysUntilFirst + 7 * (config.interval - 1)
          );
        }
      }
      break;
    }
    case 'monthly':
      current.setMonth(current.getMonth() + config.interval);
      if (config.dayOfMonth) {
        const lastDay = new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          0
        ).getDate();
        current.setDate(Math.min(config.dayOfMonth, lastDay));
      }
      break;
  }

  return current.toISOString().split('T')[0];
}

export default app;
