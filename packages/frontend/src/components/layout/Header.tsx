import { useState, useCallback, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useTimerStore } from '@/stores/timerStore';
import { useTaskStore } from '@/stores/taskStore';
import { Input } from '@/components/ui/input';
import { Sun, Moon, Monitor, Plus, Search, Timer, Menu } from 'lucide-react';
import { formatTimer } from '@/lib/utils';
import type { Theme } from '@flowtask/shared';

export function Header() {
  const { theme, setTheme, openTaskForm, toggleQuickCapture, openMobileDrawer } = useUIStore();
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

  function cycleTheme() {
    const cycle: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
    setTheme(cycle[theme]);
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header
      className="flex items-center gap-3 px-4 shrink-0"
      style={{
        height: 'var(--header-height, 56px)',
        borderBottom: '1px solid var(--color-border-subtle, #EBEBF5)',
        background: 'var(--color-surface, #FFFFFF)',
      }}
    >
      {/* Hamburger — tablet & mobile only */}
      <button
        onClick={openMobileDrawer}
        aria-label="Open navigation"
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md shrink-0 transition-colors focus-visible:outline-none"
        style={{ color: 'var(--color-text-tertiary)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--color-text-tertiary)' }}
        />
        <Input
          placeholder="Search tasks... (Ctrl+K)"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (!searchValue) toggleQuickCapture();
          }}
          className="pl-9 h-8"
          style={{
            background: 'var(--color-surface-raised, #F5F5F7)',
            border: '1px solid var(--color-border, #E2E2EC)',
            borderRadius: 'var(--radius-base, 6px)',
            fontSize: '13px',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Running timer indicator */}
      {isTimeTrackingRunning && activeTask && (
        <div
          className="hidden sm:flex items-center gap-2 rounded-md px-3 py-1.5"
          style={{
            background: 'var(--color-primary-muted, #E8E4F8)',
            color: 'var(--color-primary, #6D56D4)',
          }}
        >
          <Timer className="w-3.5 h-3.5 animate-pulse shrink-0" />
          <span className="truncate max-w-[100px] text-xs font-medium">{activeTask.title}</span>
          <span className="font-mono text-xs font-semibold">{formatTimer(timeTrackingElapsed)}</span>
        </div>
      )}

      {/* Theme toggle */}
      <button
        onClick={cycleTheme}
        aria-label={`Theme: ${theme}`}
        className="w-9 h-9 flex items-center justify-center rounded-md transition-colors shrink-0 focus-visible:outline-none"
        style={{ color: 'var(--color-text-tertiary)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
        }}
      >
        <ThemeIcon className="w-4 h-4" />
      </button>

      {/* New Task */}
      <button
        onClick={() => openTaskForm()}
        className="flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium transition-colors shrink-0 focus-visible:outline-none"
        style={{
          background: 'var(--color-primary, #6D56D4)',
          color: 'var(--color-primary-foreground, #FFFFFF)',
          borderRadius: 'var(--radius-base, 6px)',
          fontSize: '13px',
          fontWeight: 500,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-hover, #5944BC)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary, #6D56D4)';
        }}
      >
        <Plus className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">New Task</span>
      </button>
    </header>
  );
}
