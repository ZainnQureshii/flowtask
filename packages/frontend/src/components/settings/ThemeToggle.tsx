import { useUIStore } from '@/stores/uiStore';
import { Sun, Moon, Monitor } from 'lucide-react';
import type { Theme } from '@flowtask/shared';

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
        Appearance
      </p>
      <div
        className="inline-flex items-center rounded-[var(--radius-md)] p-1 gap-0.5"
        style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-subtle)' }}
        role="radiogroup"
        aria-label="Color theme"
      >
        {themes.map(({ value, icon: Icon, label }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              role="radio"
              aria-checked={isActive}
              className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-medium transition-all duration-150"
              style={{
                background: isActive ? 'var(--color-surface)' : 'transparent',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
              }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
