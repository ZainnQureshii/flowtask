import { ThemeToggle } from './ThemeToggle';
import { ImportExport } from './ImportExport';
import { TagManager } from '@/components/tags/TagManager';
import { StatsPanel } from '@/components/productivity/StatsPanel';
import { Separator } from '@/components/ui/separator';

export function SettingsPanel() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <ThemeToggle />
      <Separator />
      <TagManager />
      <Separator />
      <ImportExport />
      <Separator />
      <StatsPanel />

      <div className="text-xs text-muted-foreground pt-4">
        <p>FlowTask - Productivity App</p>
        <p>Keyboard shortcuts: Ctrl+K (Quick Capture), Ctrl+N (New Task), 1/2/3 (Switch View)</p>
      </div>
    </div>
  );
}
