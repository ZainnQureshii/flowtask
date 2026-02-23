import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, ViewMode, CreateTaskInput } from '@flowtask/shared';

interface UIStore {
  theme: Theme;
  activeView: ViewMode;
  sidebarCollapsed: boolean;
  selectedTaskId: string | null;
  isQuickCaptureOpen: boolean;
  isTaskFormOpen: boolean;
  taskFormDefaults: Partial<CreateTaskInput> | null;

  setTheme: (theme: Theme) => void;
  setActiveView: (view: ViewMode) => void;
  toggleSidebar: () => void;
  selectTask: (id: string | null) => void;
  toggleQuickCapture: () => void;
  openTaskForm: (defaultValues?: Partial<CreateTaskInput>) => void;
  closeTaskForm: () => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'system',
      activeView: 'list',
      sidebarCollapsed: false,
      selectedTaskId: null,
      isQuickCaptureOpen: false,
      isTaskFormOpen: false,
      taskFormDefaults: null,

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      setActiveView: (activeView) => set({ activeView }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      selectTask: (selectedTaskId) => set({ selectedTaskId }),
      toggleQuickCapture: () => set((s) => ({ isQuickCaptureOpen: !s.isQuickCaptureOpen })),

      openTaskForm: (defaultValues) =>
        set({ isTaskFormOpen: true, taskFormDefaults: defaultValues || null }),
      closeTaskForm: () => set({ isTaskFormOpen: false, taskFormDefaults: null }),
    }),
    {
      name: 'flowtask-ui',
      partialize: (s) => ({ theme: s.theme, activeView: s.activeView, sidebarCollapsed: s.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
