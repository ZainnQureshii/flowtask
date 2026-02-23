import { useState, useCallback, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useTimerStore } from '@/stores/timerStore';
import { useTaskStore } from '@/stores/taskStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sun, Moon, Monitor, Plus, Search, Timer } from 'lucide-react';
import { formatTimer } from '@/lib/utils';
import type { Theme } from '@flowtask/shared';

export function Header() {
  const { theme, setTheme, openTaskForm, toggleQuickCapture } = useUIStore();
  const { isTimeTrackingRunning, timeTrackingElapsed, activeTimeEntry } = useTimerStore();
  const { tasks, setFilters } = useTaskStore();
  const [searchValue, setSearchValue] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setFilters({ search: value || undefined });
      }, 300);
    },
    [setFilters],
  );

  const activeTask = activeTimeEntry ? tasks.find((t) => t.id === activeTimeEntry.taskId) : null;

  const themeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const ThemeIcon = themeIcon;

  function cycleTheme() {
    const cycle: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
    setTheme(cycle[theme]);
  }

  return (
    <header className="flex items-center gap-3 border-b px-4 py-2 bg-background">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks... (Ctrl+K)"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (!searchValue) toggleQuickCapture();
          }}
          className="pl-9 h-8"
        />
      </div>

      {/* Running timer indicator */}
      {isTimeTrackingRunning && activeTask && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-sm">
          <Timer className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="truncate max-w-[120px] text-xs">{activeTask.title}</span>
          <span className="font-mono text-xs font-medium">{formatTimer(timeTrackingElapsed)}</span>
        </div>
      )}

      {/* Actions */}
      <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label={`Theme: ${theme}`}>
        <ThemeIcon className="h-4 w-4" />
      </Button>

      <Button size="sm" onClick={() => openTaskForm()} className="gap-1">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">New Task</span>
      </Button>
    </header>
  );
}
