import type { Task } from '@flowtask/shared';
import type { TaskStatus } from '@flowtask/shared';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  label: string;
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} variant="kanban" />
    </div>
  );
}

export function KanbanColumn({ status, tasks, label }: KanbanColumnProps) {
  const { openTaskForm } = useUIStore();
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: 'column', status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg bg-muted/50 p-2 min-w-[280px] w-[280px] h-full',
        isOver && 'ring-2 ring-primary ring-dashed',
      )}
    >
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <h3 className="text-sm font-semibold capitalize">{label}</h3>
        <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full justify-start gap-1 text-muted-foreground"
        onClick={() => openTaskForm({ status })}
      >
        <Plus className="h-4 w-4" /> Add task
      </Button>
    </div>
  );
}
