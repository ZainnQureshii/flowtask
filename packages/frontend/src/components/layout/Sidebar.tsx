import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckSquare, Calendar, Settings, List, Kanban, CalendarDays,
  PanelLeftClose, PanelLeft, Clock, Plus, Tag,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { TASK_COLORS } from '@flowtask/shared';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', icon: CheckSquare, label: 'Tasks' },
  { to: '/planner', icon: Calendar, label: 'Planner' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const viewOptions = [
  { mode: 'list' as const, icon: List, label: 'List' },
  { mode: 'kanban' as const, icon: Kanban, label: 'Kanban' },
  { mode: 'calendar' as const, icon: CalendarDays, label: 'Calendar' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, activeView, setActiveView } = useUIStore();
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

  return (
    <AnimatePresence initial={false}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 56 : 240 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col h-full border-r bg-sidebar text-sidebar-foreground overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">FlowTask</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8" aria-label="Toggle sidebar">
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link key={to} to={to}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start gap-2', sidebarCollapsed && 'justify-center px-0')}
                  size="sm"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* View Switcher */}
        {!sidebarCollapsed && location.pathname === '/' && (
          <>
            <Separator className="mx-2" />
            <div className="p-2">
              <p className="px-2 mb-1 text-xs font-medium text-muted-foreground">View</p>
              <div className="space-y-0.5">
                {viewOptions.map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={activeView === mode ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveView(mode)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tags */}
        {!sidebarCollapsed && (
          <>
            <Separator className="mx-2" />
            <div className="flex-1 overflow-y-auto p-2">
              <div className="flex items-center justify-between px-2 mb-1">
                <p className="text-xs font-medium text-muted-foreground">Tags</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setAddingTag(true)}
                  aria-label="Add tag"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-0.5">
                {tags.map((tag) => {
                  const isSelected = filters.tagIds?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTagFilter(tag.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent transition-colors',
                        isSelected && 'bg-accent',
                      )}
                    >
                      <Tag className="h-3 w-3" style={{ color: tag.color }} />
                      <span className="truncate">{tag.name}</span>
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
          </>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
