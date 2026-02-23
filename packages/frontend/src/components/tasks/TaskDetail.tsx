import type { Priority } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { useTimerStore } from '@/stores/timerStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubtaskList } from './SubtaskList';
import { TimeTracker } from '@/components/productivity/TimeTracker';
import { TagBadge } from '@/components/tags/TagBadge';
import { formatDate, formatDateFull, isOverdue, cn } from '@/lib/utils';
import {
  X, Timer, Play, Trash2, Calendar, AlertCircle, ArrowUp, ArrowDown, Minus, Repeat,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
}

const priorityConfig: Record<Priority, { icon: typeof AlertCircle; color: string; label: string }> = {
  urgent: { icon: AlertCircle, color: 'text-red-500', label: 'Urgent' },
  high: { icon: ArrowUp, color: 'text-orange-500', label: 'High' },
  medium: { icon: Minus, color: 'text-yellow-500', label: 'Medium' },
  low: { icon: ArrowDown, color: 'text-gray-400', label: 'Low' },
};

export function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const { tasks, deleteTask } = useTaskStore();
  const { startPomodoro, startTimeTracking } = useTimerStore();
  const task = tasks.find((t) => t.id === taskId);

  if (!task) return null;

  const pConfig = priorityConfig[task.priority];
  const PriorityIcon = pConfig.icon;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 z-40 h-full w-full max-w-md border-l bg-background shadow-xl overflow-y-auto"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <h2 className="text-lg font-semibold truncate">{task.title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close detail panel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Meta info */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={cn('gap-1', pConfig.color)}>
            <PriorityIcon className="h-3 w-3" />
            {pConfig.label}
          </Badge>
          <Badge variant="secondary">{task.status.replace('_', ' ')}</Badge>
          {task.dueDate && (
            <Badge variant={isOverdue(task.dueDate) ? 'destructive' : 'outline'} className="gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </Badge>
          )}
          {task.recurringConfig && (
            <Badge variant="outline" className="gap-1">
              <Repeat className="h-3 w-3" />
              {task.recurringConfig.type}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {/* Color indicator */}
        {task.color && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: task.color }} />
            <span className="text-xs text-muted-foreground">Task color</span>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-sm whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => startTimeTracking(task.id)} className="gap-1">
            <Timer className="h-3.5 w-3.5" /> Track Time
          </Button>
          <Button size="sm" variant="outline" onClick={() => startPomodoro(task.id)} className="gap-1">
            <Play className="h-3.5 w-3.5" /> Pomodoro
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-destructive ml-auto"
            onClick={() => { deleteTask(task.id); onClose(); }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subtasks">
          <TabsList className="w-full">
            <TabsTrigger value="subtasks" className="flex-1">Subtasks</TabsTrigger>
            <TabsTrigger value="time" className="flex-1">Time</TabsTrigger>
          </TabsList>
          <TabsContent value="subtasks">
            <SubtaskList taskId={task.id} subtasks={task.subtasks} />
          </TabsContent>
          <TabsContent value="time">
            <TimeTracker taskId={task.id} timeEntries={task.timeEntries} />
          </TabsContent>
        </Tabs>

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground space-y-0.5 pt-4 border-t">
          <p>Created: {formatDateFull(task.createdAt)}</p>
          <p>Updated: {formatDateFull(task.updatedAt)}</p>
        </div>
      </div>
    </motion.div>
  );
}
