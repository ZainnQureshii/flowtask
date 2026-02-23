import { useMemo } from 'react';
import { TaskStatus } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { formatDuration } from '@/lib/utils';
import { CheckCircle, Clock, Timer, TrendingUp } from 'lucide-react';
import { subDays, format, startOfDay, isAfter } from 'date-fns';

export function StatsPanel() {
  const { tasks } = useTaskStore();

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);

    const completedTotal = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const completedThisWeek = tasks.filter(
      (t) => t.status === TaskStatus.DONE && isAfter(new Date(t.updatedAt), weekAgo),
    ).length;

    const totalFocusTime = tasks.reduce((sum, t) => sum + t.totalTimeSpent, 0);
    const pomodoroCount = tasks.reduce(
      (sum, t) => sum + t.pomodoroSessions.filter((s) => s.completed && s.type === 'work').length,
      0,
    );

    // Weekly breakdown
    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const completed = tasks.filter(
        (t) =>
          t.status === TaskStatus.DONE &&
          isAfter(new Date(t.updatedAt), dayStart) &&
          !isAfter(new Date(t.updatedAt), dayEnd),
      ).length;
      return { label: format(day, 'EEE'), completed };
    });

    const maxDaily = Math.max(...dailyStats.map((d) => d.completed), 1);

    return { completedTotal, completedThisWeek, totalFocusTime, pomodoroCount, dailyStats, maxDaily };
  }, [tasks]);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium">Productivity Stats</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold">{stats.completedTotal}</p>
          <p className="text-xs text-muted-foreground">{stats.completedThisWeek} this week</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Focus Time</span>
          </div>
          <p className="text-2xl font-bold">{formatDuration(stats.totalFocusTime)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Pomodoros</span>
          </div>
          <p className="text-2xl font-bold">{stats.pomodoroCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <p className="text-2xl font-bold">{tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length}</p>
        </div>
      </div>

      {/* Weekly chart */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">This Week</h4>
        <div className="flex items-end gap-1 h-24">
          {stats.dailyStats.map((day) => (
            <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm bg-primary/80 transition-all min-h-[2px]"
                style={{ height: `${(day.completed / stats.maxDaily) * 100}%` }}
              />
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
