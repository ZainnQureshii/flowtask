import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Tag, Subtask, TaskFilters, CreateTaskInput, UpdateTaskInput, ReorderInput } from '@flowtask/shared';
import { api } from '@/lib/api';

interface TaskStore {
  tasks: Task[];
  tags: Tag[];
  filters: TaskFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;

  fetchTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (items: ReorderInput[]) => Promise<void>;

  createSubtask: (taskId: string, title: string) => Promise<Subtask>;
  updateSubtask: (id: string, input: Partial<Subtask>) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;

  deleteTimeEntry: (taskId: string, entryId: string) => Promise<void>;

  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;

  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setSortBy: (field: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      tags: [],
      filters: {},
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isLoading: false,

      fetchTasks: async () => {
        set({ isLoading: true });
        try {
          const tasks = await api.getTasks();
          set({ tasks, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      createTask: async (input) => {
        const task = await api.createTask(input);
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },

      updateTask: async (id, input) => {
        // Optimistic update
        const prev = get().tasks;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...input, recurringConfig: t.recurringConfig, updatedAt: new Date().toISOString() } as Task : t,
          ),
        }));
        try {
          const task = await api.updateTask(id, input);
          set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
          return task;
        } catch {
          set({ tasks: prev });
          throw new Error('Failed to update task');
        }
      },

      deleteTask: async (id) => {
        const prev = get().tasks;
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        try {
          await api.deleteTask(id);
        } catch {
          set({ tasks: prev });
        }
      },

      reorderTasks: async (items) => {
        const prev = get().tasks;
        // Optimistic update
        set((s) => {
          const tasks = [...s.tasks];
          for (const item of items) {
            const idx = tasks.findIndex((t) => t.id === item.taskId);
            if (idx !== -1) {
              tasks[idx] = {
                ...tasks[idx],
                position: item.newPosition,
                ...(item.newStatus ? { status: item.newStatus } : {}),
              };
            }
          }
          return { tasks };
        });
        try {
          await api.reorderTasks(items);
        } catch {
          set({ tasks: prev });
        }
      },

      createSubtask: async (taskId, title) => {
        const subtask = await api.createSubtask(taskId, title);
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask] } : t,
          ),
        }));
        return subtask;
      },

      updateSubtask: async (id, input) => {
        set((s) => ({
          tasks: s.tasks.map((t) => ({
            ...t,
            subtasks: t.subtasks.map((st) => (st.id === id ? { ...st, ...input } : st)),
          })),
        }));
        await api.updateSubtask(id, input);
      },

      deleteSubtask: async (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) => ({
            ...t,
            subtasks: t.subtasks.filter((st) => st.id !== id),
          })),
        }));
        await api.deleteSubtask(id);
      },

      deleteTimeEntry: async (taskId, entryId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  timeEntries: t.timeEntries.filter((e) => e.id !== entryId),
                  totalTimeSpent: t.totalTimeSpent - (t.timeEntries.find((e) => e.id === entryId)?.durationSeconds ?? 0),
                }
              : t,
          ),
        }));
        await api.deleteTimeEntry(entryId);
      },

      fetchTags: async () => {
        try {
          const tags = await api.getTags();
          set({ tags });
        } catch {
          // keep existing
        }
      },

      createTag: async (name, color) => {
        const tag = await api.createTag(name, color);
        set((s) => ({ tags: [...s.tags, tag] }));
        return tag;
      },

      deleteTag: async (id) => {
        set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
        await api.deleteTag(id);
      },

      setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
      clearFilters: () => set({ filters: {} }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
    }),
    {
      name: 'flowtask-tasks',
      partialize: (s) => ({ tasks: s.tasks, tags: s.tags }),
    },
  ),
);
