import { useMemo } from 'react';
import type { Task } from '@flowtask/shared';
import { TaskStatus } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { format, isToday } from 'date-fns';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Timer } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

export function DailyPlanner() {
  const { tasks } = useTaskStore();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate?.startsWith(todayStr) || false),
    [tasks, todayStr],
  );

  const completedToday = todayTasks.filter((t) => t.status === TaskStatus.DONE).length;
  const totalFocusTime = todayTasks.reduce((sum, t) => sum + t.totalTimeSpent, 0);
  const pomodorosCompleted = todayTasks.reduce(
    (sum, t) => sum + t.pomodoroSessions.filter((s) => s.completed && s.type === 'work').length,
    0,
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Today - {format(new Date(), 'EEEE, MMMM d')}</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{completedToday}/{todayTasks.length}</p>
          <p className="text-xs text-muted-foreground">Tasks done</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{formatDuration(totalFocusTime)}</p>
          <p className="text-xs text-muted-foreground">Focus time</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <Timer className="h-5 w-5 mx-auto mb-1 text-orange-500" />
          <p className="text-2xl font-bold">{pomodorosCompleted}</p>
          <p className="text-xs text-muted-foreground">Pomodoros</p>
        </div>
      </div>

      {/* Unscheduled tasks */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">
          Today&apos;s Tasks ({todayTasks.length})
        </h3>
        {todayTasks.length > 0 ? (
          <div className="space-y-1">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} variant="list" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p className="text-sm">No tasks scheduled for today</p>
            <p className="text-xs mt-1">Set due dates on tasks to see them here</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Timeline</h3>
        <div className="relative border rounded-lg overflow-hidden">
          {hours.map((hour) => (
            <div key={hour} className="flex border-b last:border-b-0">
              <div className="w-16 shrink-0 py-2 px-2 text-right text-xs text-muted-foreground border-r bg-muted/30">
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
              </div>
              <div className="flex-1 min-h-[40px] py-1 px-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
