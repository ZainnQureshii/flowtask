import { Link, useLocation } from 'react-router-dom';
import { CheckSquare, Calendar, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', icon: CheckSquare, label: 'Tasks' },
  { to: '/planner', icon: Calendar, label: 'Planner' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background">
      {items.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={label}
            to={to}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
