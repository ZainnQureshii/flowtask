import type { ReactNode } from 'react';
import { Sidebar, MobileDrawer } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { PomodoroTimer } from '@/components/productivity/PomodoroTimer';
import { QuickCapture } from '@/components/tasks/QuickCapture';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { useUIStore } from '@/stores/uiStore';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { selectedTaskId, selectTask, isTaskFormOpen } = useUIStore();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--color-bg, #FAFAFA)' }}
    >
      {/* Skip to content */}
      <a
        href="#main-content"
        className="skip-to-content sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md"
        style={{
          background: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
        }}
      >
        Skip to content
      </a>

      {/* Desktop sidebar — fixed left, visible on lg+ */}
      <Sidebar />

      {/* Mobile/tablet overlay drawer */}
      <MobileDrawer />

      {/* Main column: header + content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          style={{
            /* Bottom padding accounts for mobile nav */
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div
            className="p-4 md:p-6 pb-[88px] md:pb-6"
            style={{ minHeight: '100%' }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Overlays */}
      {selectedTaskId && (
        <TaskDetail taskId={selectedTaskId} onClose={() => selectTask(null)} />
      )}
      {isTaskFormOpen && <TaskForm />}
      <QuickCapture />
      <PomodoroTimer />

      {/* Mobile bottom nav + FAB */}
      <MobileNav />
    </div>
  );
}
