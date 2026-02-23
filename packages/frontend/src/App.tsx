import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
import { TasksPage } from '@/pages/TasksPage';
import { Toaster } from '@/components/ui/Toaster';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { useTheme } from '@/lib/hooks/useTheme';

const PlannerPage = lazy(() => import('@/pages/PlannerPage').then(m => ({ default: m.PlannerPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

function AppContent() {
  useKeyboard();
  useTheme();

  return (
    <AppShell>
      <Suspense fallback={<div className="flex-1" />}>
        <Routes>
          <Route path="/" element={<TasksPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </BrowserRouter>
  );
}
