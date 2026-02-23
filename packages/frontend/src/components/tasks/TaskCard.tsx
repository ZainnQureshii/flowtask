import type { Task, Priority } from '@flowtask/shared';
import { TaskStatus } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { useTimerStore } from '@/stores/timerStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { TagBadge } from '@/components/tags/TagBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn, formatDate, isOverdue, formatDuration } from '@/lib/utils';
import {
  AlertCircle, ArrowUp, ArrowDown, Minus, MoreHorizontal,
  Pencil, Trash2, Clock, Repeat, Timer,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  variant?: 'list' | 'kanban';
}

const priorityConfig: Record<Priority, { icon: typeof AlertCircle; color: string; label: string; bgClass: string }> = {
  urgent: { icon: AlertCircle, color: 'text-red-500', label: 'Urgent', bgClass: 'bg-red-500/10' },
  high: { icon: ArrowUp, color: 'text-orange-500', label: 'High', bgClass: 'bg-orange-500/10' },
  medium: { icon: Minus, color: 'text-yellow-500', label: 'Medium', bgClass: 'bg-yellow-500/10' },
  low: { icon: ArrowDown, color: 'text-gray-400', label: 'Low', bgClass: 'bg-gray-400/10' },
};

const PRIORITY_VALUES: Priority[] = ['urgent', 'high', 'medium', 'low'];

export function TaskCard({ task, variant = 'list' }: TaskCardProps) {
  const { updateTask, deleteTask } = useTaskStore();
  const { selectTask, openTaskForm } = useUIStore();
  const { startTimeTracking } = useTimerStore();

  const pConfig = priorityConfig[task.priority];
  const PriorityIcon = pConfig.icon;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  function handleToggleDone() {
    updateTask(task.id, {
      status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE,
    });
  }

  if (variant === 'kanban') {
    return (
      <div
        onClick={() => selectTask(task.id)}
        className={cn(
          'cursor-pointer rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow',
          task.status === TaskStatus.DONE && 'opacity-60',
        )}
        style={{ borderLeftWidth: 3, borderLeftColor: task.color || 'transparent' }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium leading-tight', task.status === TaskStatus.DONE && 'line-through')}>
            {task.title}
          </p>
          <Badge variant="outline" className={cn('shrink-0 text-[10px] px-1.5', pConfig.bgClass, pConfig.color)}>
            <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
            {pConfig.label}
          </Badge>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{task.tags.length - 3}</span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className={cn(isOverdue(task.dueDate) && 'text-destructive font-medium')}>
              {formatDate(task.dueDate)}
            </span>
          )}
          {totalSubtasks > 0 && (
            <span>{completedSubtasks}/{totalSubtasks}</span>
          )}
          {task.totalTimeSpent > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatDuration(task.totalTimeSpent)}
            </span>
          )}
          {task.recurringConfig && <Repeat className="h-3 w-3" />}
        </div>
      </div>
    );
  }

  // List variant
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      onClick={() => selectTask(task.id)}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors group',
        task.status === TaskStatus.DONE && 'opacity-60',
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: task.color || 'transparent' }}
    >
      <Checkbox
        checked={task.status === TaskStatus.DONE}
        onCheckedChange={() => handleToggleDone()}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Mark "${task.title}" as ${task.status === TaskStatus.DONE ? 'todo' : 'done'}`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium truncate', task.status === TaskStatus.DONE && 'line-through')}>
            {task.title}
          </span>
          {task.recurringConfig && <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {task.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag.id} tag={tag} className="text-[10px] px-1.5 py-0" />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-[10px] px-1.5', pConfig.bgClass, pConfig.color)}>
          <PriorityIcon className="h-2.5 w-2.5" />
        </Badge>

        {task.dueDate && (
          <span className={cn('text-xs text-muted-foreground', isOverdue(task.dueDate) && 'text-destructive')}>
            {formatDate(task.dueDate)}
          </span>
        )}

        {totalSubtasks > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {task.totalTimeSpent > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formatDuration(task.totalTimeSpent)}
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openTaskForm({ ...task })}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => startTimeTracking(task.id)}>
            <Timer className="h-3.5 w-3.5 mr-2" /> Start Timer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {PRIORITY_VALUES.map((p) => (
            <DropdownMenuItem key={p} onClick={() => updateTask(task.id, { priority: p })}>
              Set {p}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => deleteTask(task.id)}>
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
