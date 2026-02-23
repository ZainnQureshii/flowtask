import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from '../../stores/taskStore';
import type { Task, Tag } from '@flowtask/shared';

vi.mock('../../lib/api', () => ({
  api: {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    reorderTasks: vi.fn(),
    createSubtask: vi.fn(),
    updateSubtask: vi.fn(),
    deleteSubtask: vi.fn(),
    getTags: vi.fn(),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    deleteTimeEntry: vi.fn(),
  },
}));

import { api } from '../../lib/api';

const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Test Task',
  description: '',
  status: 'todo',
  priority: 'medium',
  color: null,
  dueDate: null,
  position: 0,
  tags: [],
  subtasks: [],
  recurringConfig: null,
  pomodoroSessions: [],
  timeEntries: [],
  totalTimeSpent: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const initialState = {
  tasks: [],
  tags: [],
  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
  isLoading: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  useTaskStore.setState(initialState);
});

describe('taskStore', () => {
  describe('fetchTasks', () => {
    it('should fetch tasks and set loading state', async () => {
      const tasks = [mockTask()];
      vi.mocked(api.getTasks).mockResolvedValue(tasks);

      await useTaskStore.getState().fetchTasks();

      expect(api.getTasks).toHaveBeenCalled();
      expect(useTaskStore.getState().tasks).toEqual(tasks);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('should set isLoading true during fetch', async () => {
      let resolvePromise: (v: Task[]) => void;
      vi.mocked(api.getTasks).mockReturnValue(
        new Promise((r) => { resolvePromise = r; })
      );

      const fetchPromise = useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().isLoading).toBe(true);

      resolvePromise!([]);
      await fetchPromise;
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('should handle fetch error gracefully', async () => {
      vi.mocked(api.getTasks).mockRejectedValue(new Error('Network error'));

      await useTaskStore.getState().fetchTasks();

      expect(useTaskStore.getState().isLoading).toBe(false);
      expect(useTaskStore.getState().tasks).toEqual([]);
    });
  });

  describe('createTask', () => {
    it('should create task and prepend to list', async () => {
      const existing = mockTask({ id: '0', title: 'Existing' });
      useTaskStore.setState({ tasks: [existing] });

      const newTask = mockTask({ id: '1', title: 'New' });
      vi.mocked(api.createTask).mockResolvedValue(newTask);

      const result = await useTaskStore.getState().createTask({ title: 'New' });

      expect(result).toEqual(newTask);
      expect(useTaskStore.getState().tasks[0]).toEqual(newTask);
      expect(useTaskStore.getState().tasks).toHaveLength(2);
    });
  });

  describe('updateTask', () => {
    it('should optimistically update then reconcile', async () => {
      const task = mockTask();
      useTaskStore.setState({ tasks: [task] });

      const updated = mockTask({ title: 'Updated from server' });
      vi.mocked(api.updateTask).mockResolvedValue(updated);

      // After call, should have server response
      const result = await useTaskStore.getState().updateTask('1', { title: 'Updated' });
      expect(result.title).toBe('Updated from server');
      expect(useTaskStore.getState().tasks[0].title).toBe('Updated from server');
    });

    it('should rollback on API failure', async () => {
      const task = mockTask({ title: 'Original' });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.updateTask).mockRejectedValue(new Error('Server error'));

      await expect(
        useTaskStore.getState().updateTask('1', { title: 'Changed' })
      ).rejects.toThrow('Failed to update task');

      expect(useTaskStore.getState().tasks[0].title).toBe('Original');
    });
  });

  describe('deleteTask', () => {
    it('should optimistically remove task', async () => {
      const task = mockTask();
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.deleteTask).mockResolvedValue({ success: true });

      await useTaskStore.getState().deleteTask('1');

      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });

    it('should rollback on API failure', async () => {
      const task = mockTask();
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.deleteTask).mockRejectedValue(new Error('fail'));

      await useTaskStore.getState().deleteTask('1');

      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });
  });

  describe('reorderTasks', () => {
    it('should optimistically reorder tasks', async () => {
      const tasks = [
        mockTask({ id: '1', position: 0 }),
        mockTask({ id: '2', position: 1 }),
      ];
      useTaskStore.setState({ tasks });

      vi.mocked(api.reorderTasks).mockResolvedValue({ success: true });

      await useTaskStore.getState().reorderTasks([
        { taskId: '1', newPosition: 1 },
        { taskId: '2', newPosition: 0 },
      ]);

      const state = useTaskStore.getState();
      expect(state.tasks.find((t) => t.id === '1')?.position).toBe(1);
      expect(state.tasks.find((t) => t.id === '2')?.position).toBe(0);
    });

    it('should update status during reorder', async () => {
      const task = mockTask({ id: '1', status: 'todo', position: 0 });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.reorderTasks).mockResolvedValue({ success: true });

      await useTaskStore.getState().reorderTasks([
        { taskId: '1', newPosition: 0, newStatus: 'in_progress' },
      ]);

      expect(useTaskStore.getState().tasks[0].status).toBe('in_progress');
    });

    it('should rollback on reorder failure', async () => {
      const tasks = [mockTask({ id: '1', position: 0 })];
      useTaskStore.setState({ tasks });

      vi.mocked(api.reorderTasks).mockRejectedValue(new Error('fail'));

      await useTaskStore.getState().reorderTasks([{ taskId: '1', newPosition: 5 }]);

      expect(useTaskStore.getState().tasks[0].position).toBe(0);
    });
  });

  describe('createSubtask', () => {
    it('should append subtask to the correct task', async () => {
      const task = mockTask({ id: '1', subtasks: [] });
      useTaskStore.setState({ tasks: [task] });

      const subtask = { id: 's1', taskId: '1', title: 'Sub', completed: false, position: 0, createdAt: '' };
      vi.mocked(api.createSubtask).mockResolvedValue(subtask);

      const result = await useTaskStore.getState().createSubtask('1', 'Sub');

      expect(result).toEqual(subtask);
      expect(useTaskStore.getState().tasks[0].subtasks).toHaveLength(1);
    });
  });

  describe('deleteSubtask', () => {
    it('should remove subtask from task', async () => {
      const subtask = { id: 's1', taskId: '1', title: 'Sub', completed: false, position: 0, createdAt: '' };
      const task = mockTask({ id: '1', subtasks: [subtask] });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.deleteSubtask).mockResolvedValue({ success: true });

      await useTaskStore.getState().deleteSubtask('s1');

      expect(useTaskStore.getState().tasks[0].subtasks).toHaveLength(0);
    });
  });

  describe('fetchTags', () => {
    it('should fetch and set tags', async () => {
      const tags: Tag[] = [{ id: 't1', name: 'Bug', color: '#ff0000' }];
      vi.mocked(api.getTags).mockResolvedValue(tags);

      await useTaskStore.getState().fetchTags();

      expect(useTaskStore.getState().tags).toEqual(tags);
    });

    it('should keep existing tags on error', async () => {
      const existing: Tag[] = [{ id: 't1', name: 'Existing', color: '#000' }];
      useTaskStore.setState({ tags: existing });

      vi.mocked(api.getTags).mockRejectedValue(new Error('fail'));

      await useTaskStore.getState().fetchTags();

      expect(useTaskStore.getState().tags).toEqual(existing);
    });
  });

  describe('createTag', () => {
    it('should create and append tag', async () => {
      const tag: Tag = { id: 't1', name: 'New', color: '#00f' };
      vi.mocked(api.createTag).mockResolvedValue(tag);

      const result = await useTaskStore.getState().createTag('New', '#00f');

      expect(result).toEqual(tag);
      expect(useTaskStore.getState().tags).toContainEqual(tag);
    });
  });

  describe('deleteTag', () => {
    it('should remove tag from list', async () => {
      const tag: Tag = { id: 't1', name: 'Del', color: '#000' };
      useTaskStore.setState({ tags: [tag] });

      vi.mocked(api.deleteTag).mockResolvedValue({ success: true });

      await useTaskStore.getState().deleteTag('t1');

      expect(useTaskStore.getState().tags).toHaveLength(0);
    });
  });

  describe('deleteTimeEntry', () => {
    it('should remove time entry and update totalTimeSpent', async () => {
      const entry = { id: 'te1', taskId: '1', startedAt: '', endedAt: null, durationSeconds: 120, note: '' };
      const task = mockTask({ id: '1', timeEntries: [entry], totalTimeSpent: 120 });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.deleteTimeEntry).mockResolvedValue({ success: true });

      await useTaskStore.getState().deleteTimeEntry('1', 'te1');

      const updated = useTaskStore.getState().tasks[0];
      expect(updated.timeEntries).toHaveLength(0);
      expect(updated.totalTimeSpent).toBe(0);
    });
  });

  describe('setFilters / clearFilters', () => {
    it('should merge filters', () => {
      useTaskStore.getState().setFilters({ search: 'test' });
      expect(useTaskStore.getState().filters).toEqual({ search: 'test' });

      useTaskStore.getState().setFilters({ priority: ['high'] });
      expect(useTaskStore.getState().filters).toEqual({ search: 'test', priority: ['high'] });
    });

    it('should clear all filters', () => {
      useTaskStore.setState({ filters: { search: 'x', priority: ['low'] } });

      useTaskStore.getState().clearFilters();

      expect(useTaskStore.getState().filters).toEqual({});
    });
  });
});
