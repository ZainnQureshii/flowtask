import type { TaskStatus, Priority, RecurrenceType, ViewMode, Theme } from './constants';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  color: string | null;
  dueDate: string | null;
  position: number;
  tags: Tag[];
  subtasks: Subtask[];
  recurringConfig: RecurringConfig | null;
  pomodoroSessions: PomodoroSession[];
  timeEntries: TimeEntry[];
  totalTimeSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskTag {
  taskId: string;
  tagId: string;
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  completed: boolean;
  type: 'work' | 'short_break' | 'long_break';
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  note: string;
}

export interface RecurringConfig {
  id: string;
  taskId: string;
  type: RecurrenceType;
  interval: number;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  nextOccurrence: string;
  lastGenerated: string | null;
}

export interface UserPreferences {
  id: string;
  theme: Theme;
  defaultView: ViewMode;
  defaultPriority: Priority;
  pomodoroWorkMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroSessionsBeforeLongBreak: number;
  sidebarCollapsed: boolean;
  showCompletedTasks: boolean;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  color?: string | null;
  dueDate?: string | null;
  tagIds?: string[];
  recurringConfig?: Omit<RecurringConfig, 'id' | 'taskId' | 'lastGenerated'> | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  color?: string | null;
  dueDate?: string | null;
  position?: number;
  tagIds?: string[];
  recurringConfig?: Omit<RecurringConfig, 'id' | 'taskId' | 'lastGenerated'> | null;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  tagIds?: string[];
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  hasTimeEntries?: boolean;
}

export interface ReorderInput {
  taskId: string;
  newStatus?: TaskStatus;
  newPosition: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  tasks: Task[];
  tags: Tag[];
  preferences: UserPreferences;
}
