import type {
  Task, Tag, Subtask, CreateTaskInput, UpdateTaskInput, ReorderInput,
  PomodoroSession, TimeEntry, UserPreferences, ExportData,
} from '@flowtask/shared';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export const api = {
  // Tasks
  getTasks: (params?: Record<string, string>): Promise<Task[]> => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Task[]>(`/tasks${qs}`).catch(() => []);
  },
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  createTask: (data: CreateTaskInput) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: UpdateTaskInput) => request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<{ success: true }>(`/tasks/${id}`, { method: 'DELETE' }),
  reorderTasks: (items: ReorderInput[]) => request<{ success: true }>('/tasks/reorder', { method: 'POST', body: JSON.stringify({ items }) }),

  // Subtasks
  getSubtasks: (taskId: string) => request<Subtask[]>(`/tasks/${taskId}/subtasks`),
  createSubtask: (taskId: string, title: string) =>
    request<Subtask>(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) }),
  updateSubtask: (id: string, data: Partial<Pick<Subtask, 'title' | 'completed' | 'position'>>) =>
    request<Subtask>(`/subtasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSubtask: (id: string) => request<{ success: true }>(`/subtasks/${id}`, { method: 'DELETE' }),

  // Tags
  getTags: (): Promise<Tag[]> => request<Tag[]>('/tags').catch(() => []),
  createTag: (name: string, color: string) =>
    request<Tag>('/tags', { method: 'POST', body: JSON.stringify({ name, color }) }),
  updateTag: (id: string, data: Partial<Pick<Tag, 'name' | 'color'>>) =>
    request<Tag>(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTag: (id: string) => request<{ success: true }>(`/tags/${id}`, { method: 'DELETE' }),

  // Pomodoro
  getPomodoroSessions: (taskId: string) => request<PomodoroSession[]>(`/tasks/${taskId}/pomodoro`),
  startPomodoro: (taskId: string, type: PomodoroSession['type'], durationMinutes: number) =>
    request<PomodoroSession>(`/tasks/${taskId}/pomodoro/start`, {
      method: 'POST',
      body: JSON.stringify({ type, durationMinutes }),
    }),
  completePomodoro: (id: string, completed: boolean) =>
    request<PomodoroSession>(`/pomodoro/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ completed }) }),

  // Time tracking
  getTimeEntries: (taskId: string) => request<TimeEntry[]>(`/tasks/${taskId}/time-entries`),
  startTimeEntry: (taskId: string, note?: string) =>
    request<TimeEntry>(`/tasks/${taskId}/time-entries/start`, { method: 'POST', body: JSON.stringify({ note }) }),
  stopTimeEntry: (id: string) => request<TimeEntry>(`/time-entries/${id}/stop`, { method: 'PATCH' }),
  addTimeEntry: (taskId: string, durationSeconds: number, note?: string) =>
    request<TimeEntry>(`/tasks/${taskId}/time-entries`, {
      method: 'POST',
      body: JSON.stringify({ durationSeconds, note }),
    }),
  deleteTimeEntry: (id: string) => request<{ success: true }>(`/time-entries/${id}`, { method: 'DELETE' }),

  // Preferences
  getPreferences: (): Promise<UserPreferences | null> => request<UserPreferences>('/preferences').catch(() => null),
  updatePreferences: (data: Partial<UserPreferences>) =>
    request<UserPreferences>('/preferences', { method: 'PATCH', body: JSON.stringify(data) }),

  // Data
  exportData: () => request<ExportData>('/data/export'),
  importData: (data: ExportData) =>
    request<{ tasksImported: number; tagsImported: number }>('/data/import', { method: 'POST', body: JSON.stringify(data) }),
};
