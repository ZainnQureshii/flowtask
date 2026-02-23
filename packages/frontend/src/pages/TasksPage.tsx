import { useEffect, useMemo, lazy, Suspense } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { ListView } from '@/components/views/ListView';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { PRIORITY_ORDER } from '@flowtask/shared';

const KanbanView = lazy(() => import('@/components/views/KanbanView').then((m) => ({ default: m.KanbanView })));
const CalendarView = lazy(() => import('@/components/views/CalendarView').then((m) => ({ default: m.CalendarView })));

// Skeleton for Kanban / Calendar while lazy-loading
function ViewSkeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-[52px] w-full rounded-lg"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

export function TasksPage() {
  const { tasks, filters, fetchTasks, fetchTags, isLoading } = useTaskStore();
  const { activeView } = useUIStore();

  useEffect(() => {
    fetchTasks();
    fetchTags();
  }, [fetchTasks, fetchTags]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filters.status?.length) {
      result = result.filter((t) => filters.status!.includes(t.status));
    }
    if (filters.priority?.length) {
      result = result.filter((t) => filters.priority!.includes(t.priority));
    }
    if (filters.tagIds?.length) {
      result = result.filter((t) => t.tags.some((tag) => filters.tagIds!.includes(tag.id)));
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s),
      );
    }
    if (filters.dueDateFrom) {
      result = result.filter((t) => t.dueDate && t.dueDate >= filters.dueDateFrom!);
    }
    if (filters.dueDateTo) {
      result = result.filter((t) => t.dueDate && t.dueDate <= filters.dueDateTo!);
    }

    return result;
  }, [tasks, filters]);

  return (
    <div className="space-y-4 h-full">
      <TaskFilters />

      <Suspense fallback={<ViewSkeleton />}>
        {activeView === 'list' && (
          <ListView tasks={filteredTasks} isLoading={isLoading} />
        )}
        {activeView === 'kanban' && !isLoading && (
          <KanbanView tasks={filteredTasks} />
        )}
        {activeView === 'kanban' && isLoading && <ViewSkeleton />}
        {activeView === 'calendar' && !isLoading && (
          <CalendarView tasks={filteredTasks} />
        )}
        {activeView === 'calendar' && isLoading && <ViewSkeleton />}
      </Suspense>
    </div>
  );
}
