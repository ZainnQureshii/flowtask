import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from '../../stores/taskStore';
import type { Task, Tag } from '@flowtask/shared';

// Factory mock — consistent with existing taskStore.test.ts pattern
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

describe('Error State Handling', () => {
  describe('fetchTasks failure', () => {
    it('should set isLoading back to false on failure', async () => {
      vi.mocked(api.getTasks).mockRejectedValueOnce(new Error('Network error'));

      await useTaskStore.getState().fetchTasks();

      expect(useTaskStore.getState().isLoading).toBe(false);
      expect(useTaskStore.getState().tasks).toEqual([]);
    });

    it('should not overwrite existing tasks on failure', async () => {
      const existing = mockTask({ id: '1', title: 'Existing' });
      useTaskStore.setState({ tasks: [existing] });

      vi.mocked(api.getTasks).mockRejectedValueOnce(new Error('Network error'));

      await useTaskStore.getState().fetchTasks();

      // fetchTasks does NOT preserve tasks on failure — it only avoids overwriting
      // because the catch block doesn't call set({ tasks }) — the previous tasks remain
      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });
  });

  describe('createTask failure', () => {
    it('should throw and not add task to store on API failure', async () => {
      vi.mocked(api.createTask).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().createTask({
          title: 'Failed Task',
          status: 'todo',
          priority: 'medium',
        })
      ).rejects.toThrow();

      // No optimistic insert — tasks list stays empty
      expect(useTaskStore.getState().tasks).toEqual([]);
    });

    it('should not corrupt existing tasks on createTask failure', async () => {
      const existing = mockTask({ id: '99', title: 'Pre-existing' });
      useTaskStore.setState({ tasks: [existing] });

      vi.mocked(api.createTask).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().createTask({ title: 'New' })
      ).rejects.toThrow();

      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].title).toBe('Pre-existing');
    });
  });

  describe('updateTask failure (optimistic rollback)', () => {
    it('should rollback to previous state on API failure', async () => {
      const originalTask = mockTask({ id: '1', title: 'Original' });
      useTaskStore.setState({ tasks: [originalTask] });

      vi.mocked(api.updateTask).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().updateTask('1', { title: 'Updated' })
      ).rejects.toThrow('Failed to update task');

      // Should rollback to original
      expect(useTaskStore.getState().tasks[0].title).toBe('Original');
    });

    it('should rollback all optimistic field changes on failure', async () => {
      const originalTask = mockTask({
        id: '1',
        title: 'Original',
        priority: 'low',
        status: 'todo',
      });
      useTaskStore.setState({ tasks: [originalTask] });

      vi.mocked(api.updateTask).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().updateTask('1', { title: 'Changed', priority: 'high', status: 'done' })
      ).rejects.toThrow();

      const task = useTaskStore.getState().tasks[0];
      expect(task.title).toBe('Original');
      expect(task.priority).toBe('low');
      expect(task.status).toBe('todo');
    });
  });

  describe('deleteTask failure (optimistic rollback)', () => {
    it('should restore task on API failure', async () => {
      const task = mockTask({ id: '1', title: 'To Delete' });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.deleteTask).mockRejectedValueOnce(new Error('Server error'));

      // deleteTask swallows the error (does not rethrow)
      await useTaskStore.getState().deleteTask('1');

      // Should restore the task
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].title).toBe('To Delete');
    });

    it('should restore all tasks including others when one delete fails', async () => {
      const tasks = [
        mockTask({ id: '1', title: 'Task 1' }),
        mockTask({ id: '2', title: 'Task 2' }),
      ];
      useTaskStore.setState({ tasks });

      vi.mocked(api.deleteTask).mockRejectedValueOnce(new Error('Server error'));

      await useTaskStore.getState().deleteTask('1');

      // Full snapshot restored — both tasks back
      expect(useTaskStore.getState().tasks).toHaveLength(2);
    });
  });

  describe('fetchTags failure', () => {
    it('should keep existing tags on failure', async () => {
      const existingTag: Tag = { id: '1', name: 'existing', color: '#000000' };
      useTaskStore.setState({ tags: [existingTag] });

      vi.mocked(api.getTags).mockRejectedValueOnce(new Error('Network error'));

      await useTaskStore.getState().fetchTags();

      // Should preserve existing tags (catch block does nothing)
      expect(useTaskStore.getState().tags).toHaveLength(1);
      expect(useTaskStore.getState().tags[0].name).toBe('existing');
    });

    it('should not throw on fetchTags failure', async () => {
      vi.mocked(api.getTags).mockRejectedValueOnce(new Error('Network error'));

      // Should resolve silently
      await expect(useTaskStore.getState().fetchTags()).resolves.toBeUndefined();
    });
  });

  describe('reorderTasks failure (optimistic rollback)', () => {
    it('should rollback positions on API failure', async () => {
      const tasks = [
        mockTask({ id: '1', position: 0 }),
        mockTask({ id: '2', position: 1 }),
      ];
      useTaskStore.setState({ tasks });

      vi.mocked(api.reorderTasks).mockRejectedValueOnce(new Error('Server error'));

      // reorderTasks swallows the error (does not rethrow)
      await useTaskStore.getState().reorderTasks([
        { taskId: '1', newPosition: 1 },
        { taskId: '2', newPosition: 0 },
      ]);

      // Should rollback to original positions
      const state = useTaskStore.getState().tasks;
      expect(state.find((t) => t.id === '1')?.position).toBe(0);
      expect(state.find((t) => t.id === '2')?.position).toBe(1);
    });

    it('should rollback status changes on API failure', async () => {
      const task = mockTask({ id: '1', status: 'todo', position: 0 });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.reorderTasks).mockRejectedValueOnce(new Error('Server error'));

      await useTaskStore.getState().reorderTasks([
        { taskId: '1', newPosition: 0, newStatus: 'in_progress' },
      ]);

      // Status should rollback to original
      expect(useTaskStore.getState().tasks[0].status).toBe('todo');
    });
  });

  describe('createSubtask failure', () => {
    it('should throw on API failure', async () => {
      vi.mocked(api.createSubtask).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().createSubtask('task-1', 'New subtask')
      ).rejects.toThrow();
    });

    it('should not add partial subtask to task on failure', async () => {
      const task = mockTask({ id: '1', subtasks: [] });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.createSubtask).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().createSubtask('1', 'New subtask')
      ).rejects.toThrow();

      // No optimistic insert — subtasks list stays empty
      expect(useTaskStore.getState().tasks[0].subtasks).toHaveLength(0);
    });
  });

  describe('deleteTimeEntry failure', () => {
    it('should throw on API failure', async () => {
      const timeEntry = {
        id: 'te1',
        taskId: '1',
        startedAt: '2026-01-01T00:00:00Z',
        endedAt: '2026-01-01T01:00:00Z',
        durationSeconds: 3600,
        note: '',
      };
      const task = mockTask({
        id: '1',
        timeEntries: [timeEntry],
        totalTimeSpent: 3600,
      });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.deleteTimeEntry).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().deleteTimeEntry('1', 'te1')
      ).rejects.toThrow();
    });

    it('should NOT rollback optimistic removal on failure (known limitation)', async () => {
      // BUG / KNOWN LIMITATION: deleteTimeEntry optimistically removes the entry
      // from state BEFORE calling the API, but has no try/catch and no rollback.
      // If the API call fails, the entry is permanently removed from the local store
      // even though it still exists on the server. This causes a data inconsistency.
      // A future fix should wrap the api call in try/catch and restore on failure.
      const timeEntry = {
        id: 'te1',
        taskId: '1',
        startedAt: '2026-01-01T00:00:00Z',
        endedAt: '2026-01-01T01:00:00Z',
        durationSeconds: 3600,
        note: '',
      };
      const task = mockTask({
        id: '1',
        timeEntries: [timeEntry],
        totalTimeSpent: 3600,
      });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.deleteTimeEntry).mockRejectedValueOnce(new Error('Server error'));

      // Catch the thrown error so we can inspect state after
      await expect(
        useTaskStore.getState().deleteTimeEntry('1', 'te1')
      ).rejects.toThrow();

      // Documenting current (broken) behavior: entry was optimistically removed
      // and NOT restored after failure
      const updatedTask = useTaskStore.getState().tasks[0];
      expect(updatedTask.timeEntries).toHaveLength(0);        // entry gone (not rolled back)
      expect(updatedTask.totalTimeSpent).toBe(0);             // totalTimeSpent also not restored
    });
  });

  describe('createTag failure', () => {
    it('should throw and not add tag to store on API failure', async () => {
      vi.mocked(api.createTag).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().createTag('NewTag', '#ff0000')
      ).rejects.toThrow();

      expect(useTaskStore.getState().tags).toHaveLength(0);
    });
  });

  describe('deleteTag failure', () => {
    it('should optimistically remove tag and NOT rollback on failure (known limitation)', async () => {
      // BUG / KNOWN LIMITATION: deleteTag optimistically removes the tag from state
      // but has no try/catch and no rollback. If the API fails, local state is stale.
      const tag: Tag = { id: 't1', name: 'ToDelete', color: '#ff0000' };
      useTaskStore.setState({ tags: [tag] });

      vi.mocked(api.deleteTag).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().deleteTag('t1')
      ).rejects.toThrow();

      // Tag is gone from local state even though server delete failed
      expect(useTaskStore.getState().tags).toHaveLength(0);
    });
  });

  describe('updateSubtask failure', () => {
    it('should optimistically update subtask but NOT rollback on failure (known limitation)', async () => {
      // BUG / KNOWN LIMITATION: updateSubtask optimistically updates state but has
      // no try/catch and no rollback. If the API call fails, local state diverges
      // from the server state.
      const subtask = {
        id: 's1',
        taskId: '1',
        title: 'Original Subtask',
        completed: false,
        position: 0,
        createdAt: '2026-01-01T00:00:00Z',
      };
      const task = mockTask({ id: '1', subtasks: [subtask] });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.updateSubtask).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().updateSubtask('s1', { completed: true })
      ).rejects.toThrow();

      // Optimistic update is NOT rolled back
      const updatedSubtask = useTaskStore.getState().tasks[0].subtasks[0];
      expect(updatedSubtask.completed).toBe(true);  // state diverged from server
    });
  });

  describe('deleteSubtask failure', () => {
    it('should optimistically remove subtask but NOT rollback on failure (known limitation)', async () => {
      // BUG / KNOWN LIMITATION: deleteSubtask optimistically removes the subtask but
      // has no try/catch and no rollback. Failed deletes leave local state stale.
      const subtask = {
        id: 's1',
        taskId: '1',
        title: 'To Delete',
        completed: false,
        position: 0,
        createdAt: '2026-01-01T00:00:00Z',
      };
      const task = mockTask({ id: '1', subtasks: [subtask] });
      useTaskStore.setState({ tasks: [task] });

      vi.mocked(api.deleteSubtask).mockRejectedValueOnce(new Error('Server error'));

      await expect(
        useTaskStore.getState().deleteSubtask('s1')
      ).rejects.toThrow();

      // Subtask is gone from local state even though server delete failed
      expect(useTaskStore.getState().tasks[0].subtasks).toHaveLength(0);
    });
  });
});
