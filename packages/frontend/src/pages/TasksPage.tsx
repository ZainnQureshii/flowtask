import { useEffect, useMemo, lazy, Suspense } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { ListView } from '@/components/views/ListView';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { PRIORITY_ORDER } from '@flowtask/shared';

const KanbanView = lazy(() => import('@/components/views/KanbanView').then((m) => ({ default: m.KanbanView })));
const CalendarView = lazy(() => import('@/components/views/CalendarView').then((m) => ({ default: m.CalendarView })));

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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          {activeView === 'list' && <ListView tasks={filteredTasks} />}
          {activeView === 'kanban' && <KanbanView tasks={filteredTasks} />}
          {activeView === 'calendar' && <CalendarView tasks={filteredTasks} />}
        </Suspense>
      )}
    </div>
  );
}
