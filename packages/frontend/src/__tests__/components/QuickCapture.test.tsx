import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickCapture } from '../../components/tasks/QuickCapture';
import { useUIStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import type { Task } from '@flowtask/shared';

vi.mock('../../lib/api', () => ({
  api: {
    getTasks: vi.fn().mockResolvedValue([]),
    createTask: vi.fn(),
    createTag: vi.fn(),
    getTags: vi.fn().mockResolvedValue([]),
  },
}));

import { api } from '../../lib/api';

const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Test',
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
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  useUIStore.setState({
    isQuickCaptureOpen: true,
    theme: 'system',
    activeView: 'list',
    sidebarCollapsed: false,
    selectedTaskId: null,
    isTaskFormOpen: false,
    taskFormDefaults: null,
  });
  useTaskStore.setState({
    tasks: [],
    tags: [],
    filters: {},
    sortBy: 'createdAt',
    sortOrder: 'desc',
    isLoading: false,
  });
});

describe('QuickCapture', () => {
  it('should render when open', () => {
    render(<QuickCapture />);
    expect(screen.getByPlaceholderText(/Add a task/)).toBeInTheDocument();
  });

  it('should not render dialog content when closed', () => {
    useUIStore.setState({ isQuickCaptureOpen: false });
    render(<QuickCapture />);
    expect(screen.queryByPlaceholderText(/Add a task/)).not.toBeInTheDocument();
  });

  it('should create task on Enter', async () => {
    vi.mocked(api.createTask).mockResolvedValue(mockTask({ title: 'Buy groceries' }));

    render(<QuickCapture />);
    const input = screen.getByPlaceholderText(/Add a task/);

    await userEvent.type(input, 'Buy groceries');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Buy groceries', priority: 'medium' })
      );
    });
  });

  it('should parse !priority syntax', async () => {
    vi.mocked(api.createTask).mockResolvedValue(mockTask({ title: 'Fix bug', priority: 'high' }));

    render(<QuickCapture />);
    const input = screen.getByPlaceholderText(/Add a task/);

    await userEvent.type(input, 'Fix bug !high');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Fix bug', priority: 'high' })
      );
    });
  });

  it('should parse #tag syntax and resolve existing tags', async () => {
    useTaskStore.setState({
      tags: [{ id: 'tag-1', name: 'work', color: '#3b82f6' }],
      tasks: [],
      filters: {},
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isLoading: false,
    });

    vi.mocked(api.createTask).mockResolvedValue(mockTask({ title: 'Do stuff' }));

    render(<QuickCapture />);
    const input = screen.getByPlaceholderText(/Add a task/);

    await userEvent.type(input, 'Do stuff #work');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Do stuff', tagIds: ['tag-1'] })
      );
    });
  });

  it('should parse @date syntax', async () => {
    vi.mocked(api.createTask).mockResolvedValue(mockTask({ title: 'Submit report', dueDate: '2025-06-15' }));

    render(<QuickCapture />);
    const input = screen.getByPlaceholderText(/Add a task/);

    await userEvent.type(input, 'Submit report @2025-06-15');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Submit report', dueDate: expect.stringContaining('2025-06-15') })
      );
    });
  });

  it('should create new tag when tag name does not exist', async () => {
    const newTag = { id: 'tag-new', name: 'newtag', color: '#3b82f6' };
    vi.mocked(api.createTag).mockResolvedValue(newTag);
    vi.mocked(api.createTask).mockResolvedValue(mockTask({ title: 'Task' }));

    render(<QuickCapture />);
    const input = screen.getByPlaceholderText(/Add a task/);

    await userEvent.type(input, 'Task #newtag');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(api.createTag).toHaveBeenCalledWith('newtag', expect.any(String));
    });
  });
});
