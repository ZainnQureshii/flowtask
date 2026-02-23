import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
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
    <div className="flex h-screen overflow-hidden">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
          {children}
        </main>
      </div>

      {/* Overlays */}
      {selectedTaskId && (
        <TaskDetail taskId={selectedTaskId} onClose={() => selectTask(null)} />
      )}
      {isTaskFormOpen && <TaskForm />}
      <QuickCapture />
      <PomodoroTimer />
      <MobileNav />
    </div>
  );
}
