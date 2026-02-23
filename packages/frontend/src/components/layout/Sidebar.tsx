import { useRef, useCallback, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import {
  CheckSquare, Settings, List, Kanban, CalendarDays,
  PanelLeftClose, PanelLeft, Plus, Tag, LayoutDashboard, Inbox,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { TASK_COLORS } from '@flowtask/shared';
import { Input } from '@/components/ui/input';
import gsap from '@/lib/gsap';

const navItems = [
  { to: '/', icon: Inbox, label: 'Inbox' },
  { to: '/planner', icon: LayoutDashboard, label: 'Today' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const viewOptions = [
  { mode: 'list' as const, icon: List, label: 'List' },
  { mode: 'kanban' as const, icon: Kanban, label: 'Kanban' },
  { mode: 'calendar' as const, icon: CalendarDays, label: 'Calendar' },
];

interface SidebarContentProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

function SidebarContent({ isCollapsed, onToggle, onClose }: SidebarContentProps) {
  const { activeView, setActiveView } = useUIStore();
  const { tags, createTag, filters, setFilters } = useTaskStore();
  const location = useLocation();
  const [addingTag, setAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  async function handleAddTag() {
    if (!newTagName.trim()) return;
    const color = TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)];
    await createTag(newTagName.trim().toLowerCase(), color);
    setNewTagName('');
    setAddingTag(false);
  }

  function toggleTagFilter(tagId: string) {
    const current = filters.tagIds || [];
    const next = current.includes(tagId)
      ? current.filter((id: string) => id !== tagId)
      : [...current, tagId];
    setFilters({ tagIds: next.length > 0 ? next : undefined });
  }

  function handleNavClick() {
    onClose?.();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-sidebar)' }}>
      {/* Header: logo + collapse toggle */}
      <div
        className="flex items-center h-14 px-3 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              <CheckSquare className="w-3.5 h-3.5" style={{ color: 'var(--color-primary-foreground)' }} />
            </div>
            <span
              data-sidebar-label
              className="font-semibold truncate"
              style={{
                fontFamily: 'var(--font-display, Manrope, sans-serif)',
                fontSize: '15px',
                color: 'var(--color-text-primary)',
              }}
            >
              FlowTask
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-8 h-8 flex items-center justify-center rounded transition-colors shrink-0 focus-visible:outline-none"
          style={{
            color: 'var(--color-text-tertiary)',
            marginLeft: isCollapsed ? 'auto' : '0',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Add */}
      <div className="px-2 pt-3 pb-1 shrink-0">
        {isCollapsed ? (
          <button
            onClick={() => useUIStore.getState().openTaskForm()}
            aria-label="Quick add task"
            className="w-full h-9 flex items-center justify-center rounded-md transition-colors"
            style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => useUIStore.getState().openTaskForm()}
            className="w-full h-[34px] flex items-center gap-2 px-3 rounded-md text-sm font-medium transition-colors"
            style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span data-sidebar-label>Quick Add</span>
            <span
              data-sidebar-label
              className="ml-auto text-xs opacity-60"
              style={{ fontFamily: 'var(--font-mono, monospace)' }}
            >
              Ctrl+N
            </span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="px-2 pt-3 shrink-0">
        {!isCollapsed && (
          <p
            className="px-2.5 mb-1.5 uppercase tracking-wider"
            style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}
          >
            Navigation
          </p>
        )}
        <div className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={handleNavClick}>
                <div
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-md transition-colors',
                    isCollapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-2.5',
                  )}
                  style={{
                    background: isActive ? 'var(--color-surface-selected)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = isActive ? 'var(--color-surface-selected)' : 'transparent';
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-sm"
                      style={{ background: 'var(--color-primary)' }}
                    />
                  )}
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
                  />
                  {!isCollapsed && (
                    <span
                      data-sidebar-label
                      className="text-sm font-medium truncate"
                      style={{ fontSize: '13px', fontWeight: 500 }}
                    >
                      {label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Views (on Tasks page) */}
      {location.pathname === '/' && (
        <div className="px-2 pt-3 shrink-0">
          {!isCollapsed && (
            <p
              className="px-2.5 mb-1.5 uppercase tracking-wider"
              style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}
            >
              Views
            </p>
          )}
          <div className="space-y-0.5">
            {viewOptions.map(({ mode, icon: Icon, label }) => {
              const isActive = activeView === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setActiveView(mode)}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-md transition-colors w-full',
                    isCollapsed ? 'h-9 justify-center' : 'h-9 px-2.5',
                  )}
                  style={{
                    background: isActive ? 'var(--color-surface-selected)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = isActive ? 'var(--color-surface-selected)' : 'transparent';
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-sm"
                      style={{ background: 'var(--color-primary)' }}
                    />
                  )}
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
                  />
                  {!isCollapsed && (
                    <span
                      data-sidebar-label
                      className="text-sm font-medium"
                      style={{ fontSize: '13px', fontWeight: 500 }}
                    >
                      {label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-2 pt-3 min-h-0">
          <div className="flex items-center justify-between px-2.5 mb-1.5">
            <p
              className="uppercase tracking-wider"
              style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}
            >
              Tags
            </p>
            <button
              onClick={() => setAddingTag(true)}
              aria-label="Add tag"
              className="w-5 h-5 flex items-center justify-center rounded transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
              }}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-0.5">
            {tags.map((tag) => {
              const isSelected = filters.tagIds?.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTagFilter(tag.id)}
                  className="flex w-full items-center gap-2 rounded-md h-8 px-2.5 transition-colors"
                  style={{
                    background: isSelected ? 'var(--color-surface-selected)' : 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: '13px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = isSelected ? 'var(--color-surface-selected)' : 'transparent';
                  }}
                >
                  <Tag className="w-3 h-3 shrink-0" style={{ color: tag.color }} />
                  <span className="truncate font-medium">{tag.name}</span>
                </button>
              );
            })}
            {addingTag && (
              <div className="px-1 py-1">
                <Input
                  autoFocus
                  placeholder="Tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') { setAddingTag(false); setNewTagName(''); }
                  }}
                  onBlur={() => { if (!newTagName) setAddingTag(false); }}
                  className="h-7 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings at bottom (when collapsed) */}
      {isCollapsed && (
        <div className="mt-auto px-2 pb-3 shrink-0">
          <Link to="/settings">
            <div
              className="h-9 w-9 flex items-center justify-center rounded-md transition-colors mx-auto"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <Settings className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

// Desktop sidebar — GSAP-animated width collapse
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const sidebarRef = useRef<HTMLElement>(null);
  const isAnimating = useRef(false);

  const FULL = 240;
  const ICON = 56;

  const toggle = useCallback(() => {
    if (isAnimating.current || !sidebarRef.current) return;
    isAnimating.current = true;
    const sidebar = sidebarRef.current;
    const labels = sidebar.querySelectorAll('[data-sidebar-label]');
    const collapsing = !sidebarCollapsed;

    const tl = gsap.timeline({
      onComplete: () => {
        toggleSidebar();
        isAnimating.current = false;
      },
    });

    if (collapsing) {
      tl.to(labels, { opacity: 0, x: -6, duration: 0.1, ease: 'power2.in', stagger: 0.01 });
      tl.to(sidebar, { width: ICON, duration: 0.2, ease: 'power4.out' }, '-=0.05');
    } else {
      tl.to(sidebar, { width: FULL, duration: 0.2, ease: 'power4.out' });
      tl.to(labels, { opacity: 1, x: 0, duration: 0.15, ease: 'power2.out', stagger: 0.02 }, '-=0.05');
    }
  }, [sidebarCollapsed, toggleSidebar]);

  // Sync width on mount & collapsed change (e.g. after hydration)
  useEffect(() => {
    if (sidebarRef.current && !isAnimating.current) {
      gsap.set(sidebarRef.current, { width: sidebarCollapsed ? ICON : FULL });
    }
  }, [sidebarCollapsed]);

  return (
    <aside
      ref={sidebarRef}
      className="hidden lg:flex flex-col h-full shrink-0 overflow-hidden"
      style={{
        width: sidebarCollapsed ? ICON : FULL,
        borderRight: '1px solid var(--color-border-subtle)',
        background: 'var(--color-sidebar)',
      }}
    >
      <SidebarContent isCollapsed={sidebarCollapsed} onToggle={toggle} />
    </aside>
  );
}

// Mobile/Tablet overlay drawer
export function MobileDrawer() {
  const { isMobileDrawerOpen, closeMobileDrawer } = useUIStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const prevOpen = useRef(false);

  useEffect(() => {
    const drawer = drawerRef.current;
    const backdrop = backdropRef.current;
    if (!drawer || !backdrop) return;

    if (isMobileDrawerOpen && !prevOpen.current) {
      // Open
      gsap.set(drawer, { x: '-100%' });
      gsap.set(backdrop, { opacity: 0, display: 'block' });
      const tl = gsap.timeline();
      tl.to(backdrop, { opacity: 1, duration: 0.25, ease: 'none' });
      tl.to(drawer, { x: 0, duration: 0.3, ease: 'power4.out' }, '<');
    } else if (!isMobileDrawerOpen && prevOpen.current) {
      // Close
      const tl = gsap.timeline({
        onComplete: () => {
          if (backdrop) backdrop.style.display = 'none';
        },
      });
      tl.to(drawer, { x: '-100%', duration: 0.25, ease: 'power2.in' });
      tl.to(backdrop, { opacity: 0, duration: 0.2, ease: 'none' }, '<');
    }

    prevOpen.current = isMobileDrawerOpen;
  }, [isMobileDrawerOpen]);

  // Initial state
  useEffect(() => {
    if (drawerRef.current) gsap.set(drawerRef.current, { x: '-100%' });
    if (backdropRef.current) {
      backdropRef.current.style.display = 'none';
      gsap.set(backdropRef.current, { opacity: 0 });
    }
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="lg:hidden fixed inset-0 z-40"
        style={{ background: 'var(--color-overlay, rgba(0,0,0,0.45))' }}
        onClick={closeMobileDrawer}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 240,
          background: 'var(--color-sidebar)',
          borderRight: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-lg, 0 12px 28px rgba(0,0,0,0.15))',
        }}
      >
        <SidebarContent isCollapsed={false} onToggle={closeMobileDrawer} onClose={closeMobileDrawer} />
      </div>
    </>
  );
}
