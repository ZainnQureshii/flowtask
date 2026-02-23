import type { Task } from '@flowtask/shared';
import { TaskStatus, PRIORITY_ORDER } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';

interface ListViewProps {
  tasks: Task[];
}

type GroupBy = 'none' | 'status' | 'priority';

export function ListView({ tasks }: ListViewProps) {
  const { sortBy, sortOrder, setSortBy, setSortOrder } = useTaskStore();
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

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

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Sort:</span>
        {['title', 'priority', 'dueDate', 'createdAt'].map((field) => (
          <Button
            key={field}
            variant={sortBy === field ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => toggleSort(field)}
          >
            {field === 'dueDate' ? 'Due' : field === 'createdAt' ? 'Created' : field}
            {sortBy === field && <ArrowUpDown className="h-3 w-3" />}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground ml-2">Group:</span>
        {(['none', 'status', 'priority'] as GroupBy[]).map((g) => (
          <Button
            key={g}
            variant={groupBy === g ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setGroupBy(g)}
          >
            {g}
          </Button>
        ))}
      </div>

      {Object.entries(groups).map(([group, groupTasks]) => (
        <div key={group}>
          {groupBy !== 'none' && (
            <h3 className="mb-2 text-sm font-medium capitalize text-muted-foreground">
              {group.replace('_', ' ')} ({groupTasks.length})
            </h3>
          )}
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {groupTasks.map((task) => (
                <TaskCard key={task.id} task={task} variant="list" />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No tasks yet</p>
          <p className="text-sm">Create your first task with Ctrl+K or the + button</p>
        </div>
      )}
    </div>
  );
}
