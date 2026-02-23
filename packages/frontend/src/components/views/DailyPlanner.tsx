import { useMemo, useRef, useEffect } from 'react';
import { TaskStatus } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { format, isToday } from 'date-fns';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CheckCircle2, Clock, Flame, Calendar } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { motion } from 'motion/react';
import { gsap } from '@/lib/gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
  delay: number;
}

function StatBadge({ icon, label, value, color, bg, delay }: StatBadgeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', delay });
      },
    });
    return () => trigger.kill();
  }, [delay]);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] p-3 text-center flex-1"
      style={{
        background: bg,
        border: `1px solid ${color}30`,
        opacity: 0,
      }}
    >
      <div style={{ color }}>{icon}</div>
      <div>
        <p className="text-xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
          {value}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
      </div>
    </div>
  );
}

// Time blocks for a more structured view
const TIME_BLOCKS = [
  { id: 'morning', label: 'Morning', sub: '6am – 12pm', range: [6, 12] },
  { id: 'afternoon', label: 'Afternoon', sub: '12pm – 6pm', range: [12, 18] },
  { id: 'evening', label: 'Evening', sub: '6pm – midnight', range: [18, 24] },
] as const;

export function DailyPlanner() {
  const { tasks } = useTaskStore();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();

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
  const completionRate = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;

  // Group pending tasks by rough time-of-day priority order (P1 first)
  const pendingTasks = todayTasks.filter((t) => t.status !== TaskStatus.DONE);
  const completedTasks = todayTasks.filter((t) => t.status === TaskStatus.DONE);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1
            className="font-display font-bold"
            style={{ fontSize: 'var(--text-h1)', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
          >
            {format(new Date(), 'EEEE')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>

        <div
          className="flex items-center gap-2 rounded-[var(--radius-full)] px-3 py-1.5 text-sm font-medium"
          style={{
            background: 'var(--color-primary-muted)',
            color: 'var(--color-primary)',
          }}
        >
          <Calendar style={{ width: 14, height: 14 }} />
          {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} today
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="flex gap-3">
        <StatBadge
          icon={<CheckCircle2 style={{ width: 20, height: 20 }} />}
          label="Done"
          value={`${completedToday}/${todayTasks.length}`}
          color="var(--color-success)"
          bg="var(--color-success-muted)"
          delay={0}
        />
        <StatBadge
          icon={<Clock style={{ width: 20, height: 20 }} />}
          label="Focus time"
          value={formatDuration(totalFocusTime)}
          color="var(--color-info)"
          bg="var(--color-info-muted)"
          delay={0.06}
        />
        <StatBadge
          icon={<Flame style={{ width: 20, height: 20 }} />}
          label="Pomodoros"
          value={String(pomodorosCompleted)}
          color="var(--color-warning)"
          bg="var(--color-warning-muted)"
          delay={0.12}
        />
      </div>

      {/* Progress bar */}
      {todayTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>Daily progress</span>
            <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {Math.round(completionRate)}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--color-success)' }}
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Active / pending tasks */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
          Today&apos;s Tasks
        </p>

        {todayTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-[var(--radius-lg)] flex flex-col items-center justify-center gap-3 py-12"
            style={{ border: '2px dashed var(--color-border)', color: 'var(--color-text-tertiary)' }}
          >
            <Calendar style={{ width: 40, height: 40, opacity: 0.4 }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Nothing scheduled for today
              </p>
              <p className="text-xs mt-1">Set due dates on tasks to see them here</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {pendingTasks.map((task) => (
              <TaskCard key={task.id} task={task} variant="list" />
            ))}
          </div>
        )}
      </div>

      {/* Completed tasks (collapsible) */}
      {completedTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Completed ({completedTasks.length})
          </p>
          <div className="space-y-1 opacity-60">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} variant="list" />
            ))}
          </div>
        </div>
      )}

      {/* Daily timeline - simplified time blocks */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
          Timeline
        </p>
        <div
          className="rounded-[var(--radius-lg)] overflow-hidden"
          style={{ border: '1px solid var(--color-border-subtle)' }}
        >
          {TIME_BLOCKS.map((block, i) => {
            const isCurrentBlock = currentHour >= block.range[0] && currentHour < block.range[1];
            return (
              <div
                key={block.id}
                className="flex items-center gap-4 px-4 py-3 transition-colors"
                style={{
                  borderBottom: i < TIME_BLOCKS.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  background: isCurrentBlock ? 'var(--color-primary-muted)' : 'transparent',
                }}
              >
                <div style={{ minWidth: 80 }}>
                  <p
                    className="text-sm font-medium"
                    style={{ color: isCurrentBlock ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                  >
                    {block.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {block.sub}
                  </p>
                </div>

                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  {isCurrentBlock && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                    >
                      Now
                    </span>
                  )}
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {pendingTasks.length > 0 && isCurrentBlock
                      ? `${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} remaining`
                      : isCurrentBlock
                        ? 'All done for now!'
                        : '—'
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
