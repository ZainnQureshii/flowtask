import type { Task } from '@flowtask/shared';
import { TaskStatus } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { useTimerStore } from '@/stores/timerStore';
import { TagBadge } from '@/components/tags/TagBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn, formatDate, isOverdue, formatDuration } from '@/lib/utils';
import { getPriorityColor } from '@/lib/priority';
import { MoreHorizontal, Pencil, Trash2, Clock, Repeat, Timer, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useCallback } from 'react';
import gsap from '@/lib/gsap';
import { taskEnter } from '@/lib/motion';
import type { Priority } from '@flowtask/shared';

interface TaskCardProps {
  task: Task;
  variant?: 'list' | 'kanban';
}

const PRIORITY_VALUES: Priority[] = ['urgent', 'high', 'medium', 'low'];

// Animated checkbox component using GSAP
function PriorityCheckbox({
  checked,
  priority,
  onToggle,
  label,
}: {
  checked: boolean;
  priority: Priority;
  onToggle: () => void;
  label: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  const pc = getPriorityColor(priority);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const svg = svgRef.current;
      const circle = circleRef.current;
      const check = checkRef.current;
      if (!svg || !circle || !check) { onToggle(); return; }

      if (!checked) {
        // Animate: fill circle → draw checkmark
        const tl = gsap.timeline({ onComplete: onToggle });
        tl.to(circle, { attr: { fill: pc.color }, duration: 0.1, ease: 'none' });
        tl.to(check, { strokeDashoffset: 0, duration: 0.2, ease: 'power2.out' }, '-=0.02');
      } else {
        // Immediate un-check
        gsap.set(circle, { attr: { fill: 'transparent' } });
        gsap.set(check, { strokeDashoffset: 20 });
        onToggle();
      }
    },
    [checked, pc.color, onToggle],
  );

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      className="shrink-0 rounded-full focus-ring"
      style={{ width: 20, height: 20 }}
    >
      <svg
        ref={svgRef}
        width="20"
        height="20"
        viewBox="0 0 20 20"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <circle
          ref={circleRef}
          cx="10"
          cy="10"
          r="8"
          fill={checked ? pc.color : 'transparent'}
          stroke={pc.color}
          strokeWidth="1.5"
          style={{ transition: 'fill 100ms' }}
        />
        <path
          ref={checkRef}
          d="M 5.5 10 L 8.5 13 L 14.5 7"
          fill="none"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="20"
          strokeDashoffset={checked ? 0 : 20}
          style={{ transition: checked ? 'stroke-dashoffset 200ms ease-out' : undefined }}
        />
      </svg>
    </button>
  );
}

export function TaskCard({ task, variant = 'list' }: TaskCardProps) {
  const { updateTask, deleteTask } = useTaskStore();
  const { selectTask, openTaskForm } = useUIStore();
  const { startTimeTracking } = useTimerStore();

  const pc = getPriorityColor(task.priority);
  const isDone = task.status === TaskStatus.DONE;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  function handleToggleDone() {
    updateTask(task.id, {
      status: isDone ? TaskStatus.TODO : TaskStatus.DONE,
    });
  }

  if (variant === 'kanban') {
    return (
      <div
        data-kanban-card
        onClick={() => selectTask(task.id)}
        className={cn(
          'group relative cursor-pointer rounded-lg border bg-[var(--color-surface)] p-4 overflow-hidden',
          'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5',
          'transition-all duration-150 ease-out',
          isDone && 'opacity-60',
        )}
        style={{
          borderLeftWidth: 3,
          borderLeftColor: pc.color,
        }}
      >
        {/* Header: priority badge + menu */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className="inline-flex items-center gap-1 rounded text-[11px] font-medium px-1.5 py-0.5"
            style={{ color: pc.color, backgroundColor: pc.muted }}
          >
            {pc.label}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
              <DropdownMenuItem
                className="text-[var(--color-destructive)]"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <p
          className={cn(
            'text-[14px] font-semibold leading-snug text-[var(--color-text-primary)] mb-2',
            isDone && 'line-through text-[var(--color-text-tertiary)]',
          )}
        >
          {task.title}
        </p>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} className="text-[11px] px-1.5 py-0" />
            ))}
            {task.tags.length > 3 && (
              <span className="text-[11px] text-[var(--color-text-tertiary)] self-center">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        {totalSubtasks > 0 && (
          <div className="mb-2">
            <div
              className="h-[3px] rounded-full overflow-hidden"
              style={{ backgroundColor: pc.muted }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${subtaskProgress}%`, backgroundColor: pc.color }}
              />
            </div>
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-tertiary)] mt-1">
          {task.dueDate && (
            <span
              className={cn(
                'flex items-center gap-1',
                isOverdue(task.dueDate) && !isDone && 'text-[var(--color-destructive)] font-medium',
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {totalSubtasks > 0 && (
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
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
      data-task-item
      layout
      variants={taskEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={() => selectTask(task.id)}
      className={cn(
        'group relative flex items-center gap-3 px-4 py-3 min-h-[52px] cursor-pointer rounded-lg',
        'border border-[var(--color-border)] bg-[var(--color-surface)]',
        'hover:bg-[var(--color-surface-hover)] transition-colors duration-100',
        isDone && 'opacity-60',
      )}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: pc.color,
      }}
    >
      {/* Checkbox */}
      <PriorityCheckbox
        checked={isDone}
        priority={task.priority}
        onToggle={handleToggleDone}
        label={`Mark "${task.title}" as ${isDone ? 'todo' : 'done'}`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[15px] font-medium text-[var(--color-text-primary)] truncate',
              isDone && 'line-through text-[var(--color-text-tertiary)]',
            )}
          >
            {task.title}
          </span>
          {task.recurringConfig && (
            <Repeat className="h-3 w-3 text-[var(--color-text-tertiary)] shrink-0" />
          )}
        </div>
        {task.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {task.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} className="text-[11px] px-1.5 py-0" />
            ))}
          </div>
        )}
      </div>

      {/* Right metadata */}
      <div className="flex items-center gap-2 shrink-0">
        {task.dueDate && (
          <span
            className={cn(
              'text-[13px] text-[var(--color-text-tertiary)] flex items-center gap-1',
              isOverdue(task.dueDate) && !isDone && 'text-[var(--color-destructive)] font-medium',
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(task.dueDate)}
          </span>
        )}
        {totalSubtasks > 0 && (
          <span className="text-[13px] text-[var(--color-text-tertiary)]">
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}
        {task.totalTimeSpent > 0 && (
          <span className="text-[13px] text-[var(--color-text-tertiary)] flex items-center gap-0.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(task.totalTimeSpent)}
          </span>
        )}

        {/* Priority label — visible only on hover */}
        <span
          className="hidden group-hover:inline-flex items-center rounded text-[11px] font-medium px-1.5 py-0.5 transition-opacity"
          style={{ color: pc.color, backgroundColor: pc.muted }}
        >
          {pc.label}
        </span>
      </div>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          >
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
          <DropdownMenuItem
            className="text-[var(--color-destructive)]"
            onClick={() => deleteTask(task.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
