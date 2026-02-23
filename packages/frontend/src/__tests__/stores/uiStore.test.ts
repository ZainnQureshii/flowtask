import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../stores/uiStore';

const initialState = {
  theme: 'system' as const,
  activeView: 'list' as const,
  sidebarCollapsed: false,
  selectedTaskId: null,
  isQuickCaptureOpen: false,
  isTaskFormOpen: false,
  taskFormDefaults: null,
};

beforeEach(() => {
  useUIStore.setState(initialState);
  document.documentElement.classList.remove('dark');
});

describe('uiStore', () => {
  describe('setTheme', () => {
    it('should set theme to dark and add dark class', () => {
      useUIStore.getState().setTheme('dark');

      expect(useUIStore.getState().theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should set theme to light and remove dark class', () => {
      document.documentElement.classList.add('dark');

      useUIStore.getState().setTheme('light');

      expect(useUIStore.getState().theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('setActiveView', () => {
    it('should set active view', () => {
      useUIStore.getState().setActiveView('kanban');
      expect(useUIStore.getState().activeView).toBe('kanban');
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar collapsed state', () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('selectTask', () => {
    it('should select a task by id', () => {
      useUIStore.getState().selectTask('task-1');
      expect(useUIStore.getState().selectedTaskId).toBe('task-1');
    });

    it('should deselect with null', () => {
      useUIStore.setState({ selectedTaskId: 'task-1' });

      useUIStore.getState().selectTask(null);
      expect(useUIStore.getState().selectedTaskId).toBeNull();
    });
  });

  describe('toggleQuickCapture', () => {
    it('should toggle quick capture open state', () => {
      expect(useUIStore.getState().isQuickCaptureOpen).toBe(false);

      useUIStore.getState().toggleQuickCapture();
      expect(useUIStore.getState().isQuickCaptureOpen).toBe(true);

      useUIStore.getState().toggleQuickCapture();
      expect(useUIStore.getState().isQuickCaptureOpen).toBe(false);
    });
  });

  describe('openTaskForm / closeTaskForm', () => {
    it('should open form without defaults', () => {
      useUIStore.getState().openTaskForm();

      expect(useUIStore.getState().isTaskFormOpen).toBe(true);
      expect(useUIStore.getState().taskFormDefaults).toBeNull();
    });

    it('should open form with defaults', () => {
      const defaults = { title: 'Test', priority: 'high' as const };
      useUIStore.getState().openTaskForm(defaults);

      expect(useUIStore.getState().isTaskFormOpen).toBe(true);
      expect(useUIStore.getState().taskFormDefaults).toEqual(defaults);
    });

    it('should close form and clear defaults', () => {
      useUIStore.setState({ isTaskFormOpen: true, taskFormDefaults: { title: 'X' } });

      useUIStore.getState().closeTaskForm();

      expect(useUIStore.getState().isTaskFormOpen).toBe(false);
      expect(useUIStore.getState().taskFormDefaults).toBeNull();
    });
  });
});
