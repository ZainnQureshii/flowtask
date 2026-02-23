import { Link, useLocation } from 'react-router-dom';
import { CheckSquare, LayoutDashboard, Settings, Plus } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', icon: CheckSquare, label: 'Tasks' },
  { to: '/planner', icon: LayoutDashboard, label: 'Today' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const location = useLocation();
  const { openTaskForm } = useUIStore();

  return (
    <>
      {/* FAB — Quick Add, above bottom nav */}
      <button
        onClick={() => openTaskForm()}
        aria-label="Quick add task"
        className="md:hidden fixed z-30 flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
        style={{
          width: 56,
          height: 56,
          bottom: 80,
          right: 16,
          background: 'var(--color-primary, #6D56D4)',
          color: 'var(--color-primary-foreground, #FFFFFF)',
          boxShadow: 'var(--shadow-lg, 0 12px 28px rgba(0,0,0,0.15))',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-hover, #5944BC)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary, #6D56D4)';
        }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom navigation bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          height: 'calc(64px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'var(--color-sidebar, #F2F2F5)',
          borderTop: '1px solid var(--color-border, #E2E2EC)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {items.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={label}
              to={to}
              className="flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] relative transition-colors"
              style={{
                color: isActive ? 'var(--color-primary, #6D56D4)' : 'var(--color-text-tertiary, #9898B2)',
              }}
            >
              {/* Active dot indicator above icon */}
              {isActive && (
                <span
                  className="absolute top-2 rounded-full"
                  style={{
                    width: 3,
                    height: 3,
                    background: 'var(--color-primary, #6D56D4)',
                  }}
                />
              )}
              <Icon className="w-[22px] h-[22px]" />
              <span
                className="font-medium"
                style={{
                  fontSize: '11px',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
