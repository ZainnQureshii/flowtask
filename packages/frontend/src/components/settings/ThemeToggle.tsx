import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Theme } from '@flowtask/shared';

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Theme</h3>
      <div className="flex gap-2">
        {themes.map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            variant={theme === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme(value)}
            className="gap-1.5"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
