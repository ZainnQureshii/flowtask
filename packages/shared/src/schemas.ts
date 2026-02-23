import { z } from 'zod';
import { TaskStatus, Priority, RecurrenceType, TASK_COLORS } from './constants.js';

const taskStatusValues = Object.values(TaskStatus) as [string, ...string[]];
const priorityValues = Object.values(Priority) as [string, ...string[]];
const recurrenceTypeValues = Object.values(RecurrenceType) as [string, ...string[]];

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(10000).optional().default(''),
  status: z.enum(taskStatusValues).optional().default('todo'),
  priority: z.enum(priorityValues).optional().default('medium'),
  color: z.string().regex(hexColorRegex, 'Invalid hex color').nullable().optional().default(null),
  dueDate: z.string().datetime({ offset: true }).nullable().optional().default(null),
  tagIds: z.array(z.string()).optional().default([]),
  recurringConfig: z
    .object({
      type: z.enum(recurrenceTypeValues),
      interval: z.number().int().min(1).default(1),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).nullable().optional().default(null),
      dayOfMonth: z.number().int().min(1).max(31).nullable().optional().default(null),
      nextOccurrence: z.string(),
    })
    .nullable()
    .optional()
    .default(null),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  color: z.string().regex(hexColorRegex).nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
  position: z.number().int().min(0).optional(),
  tagIds: z.array(z.string()).optional(),
  recurringConfig: z
    .object({
      type: z.enum(recurrenceTypeValues),
      interval: z.number().int().min(1).default(1),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).nullable().optional().default(null),
      dayOfMonth: z.number().int().min(1).max(31).nullable().optional().default(null),
      nextOccurrence: z.string(),
    })
    .nullable()
    .optional(),
});

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      taskId: z.string(),
      newStatus: z.enum(taskStatusValues).optional(),
      newPosition: z.number().int().min(0),
    })
  ),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export const reorderSubtasksSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      position: z.number().int().min(0),
    })
  ),
});

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50).transform((v) => v.toLowerCase().trim()),
  color: z.string().regex(hexColorRegex, 'Invalid hex color'),
});

export const updateTagSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .transform((v) => v.toLowerCase().trim())
    .optional(),
  color: z.string().regex(hexColorRegex).optional(),
});

export const startPomodoroSchema = z.object({
  type: z.enum(['work', 'short_break', 'long_break']),
  durationMinutes: z.number().int().min(1).max(120),
});

export const completePomodoroSchema = z.object({
  completed: z.boolean(),
});

export const startTimeEntrySchema = z.object({
  note: z.string().max(1000).optional().default(''),
});

export const createManualTimeEntrySchema = z.object({
  durationSeconds: z.number().int().min(1),
  note: z.string().max(1000).optional().default(''),
  startedAt: z.string().optional(),
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  defaultView: z.enum(['list', 'kanban', 'calendar']).optional(),
  defaultPriority: z.enum(priorityValues).optional(),
  pomodoroWorkMinutes: z.number().int().min(1).max(120).optional(),
  pomodoroShortBreakMinutes: z.number().int().min(1).max(60).optional(),
  pomodoroLongBreakMinutes: z.number().int().min(1).max(60).optional(),
  pomodoroSessionsBeforeLongBreak: z.number().int().min(1).max(20).optional(),
  sidebarCollapsed: z.boolean().optional(),
  showCompletedTasks: z.boolean().optional(),
});

export const importDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(taskStatusValues),
    priority: z.enum(priorityValues),
    color: z.string().nullable(),
    dueDate: z.string().nullable(),
    position: z.number(),
    tags: z.array(z.object({ id: z.string(), name: z.string(), color: z.string() })),
    subtasks: z.array(z.object({
      id: z.string(),
      taskId: z.string(),
      title: z.string(),
      completed: z.boolean(),
      position: z.number(),
      createdAt: z.string(),
    })),
    recurringConfig: z.object({
      id: z.string(),
      taskId: z.string(),
      type: z.enum(recurrenceTypeValues),
      interval: z.number(),
      daysOfWeek: z.array(z.number()).nullable(),
      dayOfMonth: z.number().nullable(),
      nextOccurrence: z.string(),
      lastGenerated: z.string().nullable(),
    }).nullable(),
    pomodoroSessions: z.array(z.object({
      id: z.string(),
      taskId: z.string(),
      startedAt: z.string(),
      endedAt: z.string().nullable(),
      durationMinutes: z.number(),
      completed: z.boolean(),
      type: z.enum(['work', 'short_break', 'long_break']),
    })),
    timeEntries: z.array(z.object({
      id: z.string(),
      taskId: z.string(),
      startedAt: z.string(),
      endedAt: z.string().nullable(),
      durationSeconds: z.number(),
      note: z.string(),
    })),
    totalTimeSpent: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
  tags: z.array(z.object({ id: z.string(), name: z.string(), color: z.string() })),
  preferences: z.object({
    id: z.string(),
    theme: z.enum(['light', 'dark', 'system']),
    defaultView: z.enum(['list', 'kanban', 'calendar']),
    defaultPriority: z.enum(priorityValues),
    pomodoroWorkMinutes: z.number(),
    pomodoroShortBreakMinutes: z.number(),
    pomodoroLongBreakMinutes: z.number(),
    pomodoroSessionsBeforeLongBreak: z.number(),
    sidebarCollapsed: z.boolean(),
    showCompletedTasks: z.boolean(),
    updatedAt: z.string(),
  }),
});
