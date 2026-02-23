import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
import { TasksPage } from '@/pages/TasksPage';
import { PlannerPage } from '@/pages/PlannerPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { useTheme } from '@/lib/hooks/useTheme';

function AppContent() {
  useKeyboard();
  useTheme();

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<TasksPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </BrowserRouter>
  );
}
