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
    opacity: isDragging ? 0.4 : 1,
    // Scale up slightly when dragging (handled by parent DragOverlay instead)
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
      data-kanban-column
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl min-w-[280px] w-[280px] h-full',
        'bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]',
        'transition-colors duration-150',
        isOver && 'bg-[var(--color-primary-muted)] border-[var(--color-border-focus)]',
      )}
      style={{ padding: 12 }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 py-1 mb-3">
        <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)]">{label}</h3>
        <span
          className="text-[12px] font-medium text-[var(--color-text-tertiary)] rounded-full px-2 py-0.5"
          style={{ backgroundColor: 'var(--color-surface-hover)' }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop indicator when dragging over */}
      {isOver && tasks.length === 0 && (
        <div
          data-drop-placeholder
          className="h-[52px] rounded-lg mb-2 flex items-center justify-center"
          style={{
            border: '2px dashed var(--color-primary)',
            background: 'var(--color-drag-ph)',
          }}
        >
          <span className="text-[12px] text-[var(--color-primary)] font-medium">Drop here</span>
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {/* Empty column state */}
        {tasks.length === 0 && !isOver && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-[13px] text-[var(--color-text-tertiary)]">No tasks</p>
          </div>
        )}
      </div>

      {/* Add task button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'mt-3 w-full justify-start gap-1.5 text-[13px] font-medium',
          'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]',
          'border border-dashed border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
          'rounded-lg transition-colors duration-100',
        )}
        onClick={() => openTaskForm({ status })}
      >
        <Plus className="h-3.5 w-3.5" /> Add task
      </Button>
    </div>
  );
}
