import type { Task } from '@flowtask/shared';
import { TaskStatus, PRIORITY_ORDER } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ClipboardList } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useMemo, useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';

interface ListViewProps {
  tasks: Task[];
  isLoading?: boolean;
}

type GroupBy = 'none' | 'status' | 'priority';

// Skeleton row matching real task card height
function TaskSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 min-h-[52px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="skeleton h-5 w-5 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-3.5 w-2/3 rounded" />
        <div className="skeleton h-2.5 w-1/3 rounded" />
      </div>
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const children = Array.from(containerRef.current.children);

      // Entrance
      gsap.fromTo(
        children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity' },
      );

      // Breathing float on icon
      if (iconRef.current) {
        gsap.to(iconRef.current, {
          y: -6,
          duration: 2.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      }
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center py-20 gap-4 text-center"
    >
      <div ref={iconRef} className="text-[var(--color-text-tertiary)]">
        <ClipboardList className="h-16 w-16 mx-auto stroke-[1.2]" />
      </div>
      <div>
        <h3 className="text-h3 text-[var(--color-text-primary)] mb-1">{message}</h3>
        <p className="text-[14px] text-[var(--color-text-secondary)] max-w-[280px]">{sub}</p>
      </div>
    </div>
  );
}

export function ListView({ tasks, isLoading }: ListViewProps) {
  const { sortBy, sortOrder, setSortBy, setSortOrder } = useTaskStore();
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const listRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => {
    const arr = [...tasks];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
          break;
        case 'dueDate':
          cmp = (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
          break;
        case 'createdAt':
        default:
          cmp = b.createdAt.localeCompare(a.createdAt);
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [tasks, sortBy, sortOrder]);

  const groups = useMemo(() => {
    if (groupBy === 'none') return { All: sorted };
    const map: Record<string, Task[]> = {};
    for (const task of sorted) {
      const key = groupBy === 'status' ? task.status : task.priority;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [sorted, groupBy]);

  // Staggered entrance on task list load / filter change
  useGSAP(
    () => {
      if (!listRef.current || isLoading) return;
      const items = listRef.current.querySelectorAll('[data-task-item]');
      if (!items.length) return;

      gsap.fromTo(
        items,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          stagger: { amount: 0.25, ease: 'none' },
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
      );
    },
    { scope: listRef, dependencies: [sorted.length, isLoading] },
  );

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[13px] text-[var(--color-text-tertiary)] font-medium mr-1">Sort:</span>
        {['title', 'priority', 'dueDate', 'createdAt'].map((field) => (
          <Button
            key={field}
            variant={sortBy === field ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-[13px] gap-1"
            onClick={() => toggleSort(field)}
          >
            {field === 'dueDate' ? 'Due' : field === 'createdAt' ? 'Created' : field}
            {sortBy === field && <ArrowUpDown className="h-3 w-3" />}
          </Button>
        ))}
        <span className="text-[13px] text-[var(--color-text-tertiary)] font-medium ml-2 mr-1">Group:</span>
        {(['none', 'status', 'priority'] as GroupBy[]).map((g) => (
          <Button
            key={g}
            variant={groupBy === g ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-[13px]"
            onClick={() => setGroupBy(g)}
          >
            {g}
          </Button>
        ))}
      </div>

      {/* Task list */}
      <div ref={listRef} className="space-y-4">
        {tasks.length === 0 ? (
          <EmptyState
            message="No tasks yet"
            sub="Create your first task with Ctrl+K or the + button above"
          />
        ) : (
          Object.entries(groups).map(([group, groupTasks]) => (
            <div key={group}>
              {groupBy !== 'none' && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    {group.replace('_', ' ')}
                  </h3>
                  <span className="text-[12px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-hover)] rounded-full px-2 py-0.5">
                    {groupTasks.length}
                  </span>
                  <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                </div>
              )}
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {groupTasks.map((task) => (
                    <TaskCard key={task.id} task={task} variant="list" />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
