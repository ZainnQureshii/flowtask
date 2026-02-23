import { useMemo, useRef, useEffect } from 'react';
import { TaskStatus } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { formatDuration } from '@/lib/utils';
import { CheckCircle2, Clock, Flame, Zap } from 'lucide-react';
import { subDays, format, startOfDay, isAfter } from 'date-fns';
import { gsap } from '@/lib/gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  iconColor: string;
  iconBg: string;
}

function StatCard({ icon, label, value, sub, iconColor, iconBg }: StatCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll reveal + count-up via GSAP ScrollTrigger
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const trigger = ScrollTrigger.create({
      trigger: card,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' }
        );
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <div
      ref={cardRef}
      className="flex items-center gap-3 rounded-[var(--radius-md)] p-3"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-subtle)',
        opacity: 0, // Start hidden for scroll reveal
      }}
    >
      <div
        className="flex items-center justify-center rounded-[var(--radius-sm)] shrink-0"
        style={{ width: 36, height: 36, background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
        <span
          ref={valueRef}
          className="text-xl font-bold font-display block"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.2 }}
        >
          {value}
        </span>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

export function StatsPanel() {
  const { tasks } = useTaskStore();
  const chartRef = useRef<HTMLDivElement>(null);

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
    const inProgressCount = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;

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

    return { completedTotal, completedThisWeek, totalFocusTime, pomodoroCount, inProgressCount, dailyStats, maxDaily };
  }, [tasks]);

  // Animate bars on scroll reveal
  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        const bars = container.querySelectorAll<HTMLElement>('[data-bar]');
        bars.forEach((bar) => {
          const targetHeight = bar.getAttribute('data-target-height') ?? '0%';
          gsap.fromTo(
            bar,
            { scaleY: 0, transformOrigin: 'bottom' },
            { scaleY: 1, duration: 0.6, ease: 'power2.out', delay: parseFloat(bar.getAttribute('data-delay') ?? '0') }
          );
          // Also animate height via CSS variable
          gsap.to(bar, {
            height: targetHeight,
            duration: 0.6,
            ease: 'power2.out',
            delay: parseFloat(bar.getAttribute('data-delay') ?? '0'),
          });
        });
      },
    });

    return () => trigger.kill();
  }, [stats.dailyStats]);

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
        Productivity Stats
      </p>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<CheckCircle2 style={{ width: 18, height: 18 }} />}
          label="Completed"
          value={String(stats.completedTotal)}
          sub={`${stats.completedThisWeek} this week`}
          iconColor="var(--color-success)"
          iconBg="var(--color-success-muted)"
        />
        <StatCard
          icon={<Clock style={{ width: 18, height: 18 }} />}
          label="Focus Time"
          value={formatDuration(stats.totalFocusTime)}
          iconColor="var(--color-info)"
          iconBg="var(--color-info-muted)"
        />
        <StatCard
          icon={<Flame style={{ width: 18, height: 18 }} />}
          label="Pomodoros"
          value={String(stats.pomodoroCount)}
          iconColor="var(--color-warning)"
          iconBg="var(--color-warning-muted)"
        />
        <StatCard
          icon={<Zap style={{ width: 18, height: 18 }} />}
          label="In Progress"
          value={String(stats.inProgressCount)}
          iconColor="var(--color-primary)"
          iconBg="var(--color-primary-muted)"
        />
      </div>

      {/* Weekly activity chart */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
          This Week
        </p>
        <div ref={chartRef} className="flex items-end gap-1.5 h-20">
          {stats.dailyStats.map((day, i) => {
            const heightPct = `${Math.max((day.completed / stats.maxDaily) * 100, 4)}%`;
            return (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  data-bar
                  data-target-height={heightPct}
                  data-delay={String(i * 0.04)}
                  className="w-full rounded-[4px] transition-colors"
                  style={{
                    height: heightPct,
                    background: day.completed > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                    minHeight: 4,
                    opacity: day.completed > 0 ? 0.85 : 1,
                  }}
                />
                <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
