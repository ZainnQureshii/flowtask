import { useRef, useEffect, useState } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useTaskStore } from '@/stores/taskStore';
import { formatTimer } from '@/lib/utils';
import { DEFAULT_POMODORO } from '@flowtask/shared';
import { Play, Pause, SkipForward, RotateCcw, ChevronUp, ChevronDown, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from '@/lib/gsap';

// State config with design token colors
const STATE_CONFIG = {
  idle: {
    label: 'Ready to Focus',
    color: 'var(--color-text-tertiary)',
    trackColor: 'var(--color-border)',
    dot: 'var(--color-text-tertiary)',
  },
  work: {
    label: 'Focus Session',
    color: 'var(--color-p1)',
    trackColor: 'rgba(229,72,77,0.15)',
    dot: 'var(--color-p1)',
  },
  short_break: {
    label: 'Short Break',
    color: 'var(--color-success)',
    trackColor: 'rgba(30,158,110,0.15)',
    dot: 'var(--color-success)',
  },
  long_break: {
    label: 'Long Break',
    color: 'var(--color-info)',
    trackColor: 'rgba(5,112,222,0.15)',
    dot: 'var(--color-info)',
  },
} as const;

const RING_RADIUS = 52;
const RING_STROKE = 5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function PomodoroTimer() {
  const {
    pomodoroState, pomodoroTaskId, pomodoroTimeRemaining, pomodoroSessionCount,
    isPomodoroRunning, startPomodoro, pausePomodoro, resumePomodoro, skipPomodoro, resetPomodoro,
  } = useTimerStore();
  const { tasks } = useTaskStore();
  const [collapsed, setCollapsed] = useState(true);

  const progressCircleRef = useRef<SVGCircleElement>(null);
  const prevProgressRef = useRef(0);

  const activeTask = pomodoroTaskId ? tasks.find((t) => t.id === pomodoroTaskId) : null;
  const totalSeconds =
    pomodoroState === 'work' ? DEFAULT_POMODORO.workMinutes * 60 :
    pomodoroState === 'short_break' ? DEFAULT_POMODORO.shortBreakMinutes * 60 :
    pomodoroState === 'long_break' ? DEFAULT_POMODORO.longBreakMinutes * 60 :
    DEFAULT_POMODORO.workMinutes * 60;

  const progress = totalSeconds > 0 ? ((totalSeconds - pomodoroTimeRemaining) / totalSeconds) * 100 : 0;
  const config = STATE_CONFIG[pomodoroState];

  // GSAP animate the progress ring
  useEffect(() => {
    if (!progressCircleRef.current || collapsed) return;
    const targetOffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;
    const prevOffset = RING_CIRCUMFERENCE - (prevProgressRef.current / 100) * RING_CIRCUMFERENCE;

    // Only animate if change is significant to avoid jitter
    if (Math.abs(targetOffset - prevOffset) > 0.1) {
      gsap.to(progressCircleRef.current, {
        strokeDashoffset: targetOffset,
        duration: isPomodoroRunning ? 1.0 : 0.4,
        ease: 'power1.out',
        overwrite: true,
      });
      prevProgressRef.current = progress;
    }
  }, [progress, collapsed, isPomodoroRunning]);

  // Set initial ring state when panel opens
  useEffect(() => {
    if (!collapsed && progressCircleRef.current) {
      const targetOffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;
      gsap.set(progressCircleRef.current, { strokeDashoffset: targetOffset });
      prevProgressRef.current = progress;
    }
  }, [collapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  const sessionsDisplay = Array.from({ length: 4 }, (_, i) => i < (pomodoroSessionCount % 4 || (pomodoroSessionCount > 0 && pomodoroSessionCount % 4 === 0 ? 4 : 0)) ? true : false);

  return (
    <motion.div
      className="fixed z-30 hidden md:block"
      style={{ bottom: 16, right: 16 }}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
    >
      <div
        className="overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          minWidth: 196,
        }}
      >
        {/* Collapsed header — always visible */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 w-full transition-colors"
          style={{
            padding: '10px 14px',
            color: 'var(--color-text-primary)',
          }}
          aria-label={collapsed ? 'Expand Pomodoro timer' : 'Collapse Pomodoro timer'}
          aria-expanded={!collapsed}
        >
          {/* Running pulse or timer icon */}
          {isPomodoroRunning ? (
            <span
              className="shrink-0 h-2 w-2 rounded-full animate-pulse"
              style={{ background: config.dot }}
            />
          ) : (
            <Timer style={{ width: 14, height: 14, color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          )}

          <span className="font-mono text-sm font-semibold tracking-tight">
            {formatTimer(pomodoroTimeRemaining)}
          </span>
          <span className="text-xs" style={{ color: config.color }}>
            {STATE_CONFIG[pomodoroState].label}
          </span>
          <span className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
            {collapsed
              ? <ChevronUp style={{ width: 14, height: 14 }} />
              : <ChevronDown style={{ width: 14, height: 14 }} />
            }
          </span>
        </button>

        {/* Expanded panel */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div
                className="flex flex-col items-center gap-4"
                style={{
                  padding: '16px',
                  borderTop: '1px solid var(--color-border-subtle)',
                }}
              >
                {/* Progress Ring */}
                <div className="relative">
                  <svg
                    width={RING_RADIUS * 2 + RING_STROKE * 2}
                    height={RING_RADIUS * 2 + RING_STROKE * 2}
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    {/* Track */}
                    <circle
                      cx={RING_RADIUS + RING_STROKE}
                      cy={RING_RADIUS + RING_STROKE}
                      r={RING_RADIUS}
                      fill="none"
                      stroke={config.trackColor}
                      strokeWidth={RING_STROKE}
                    />
                    {/* Progress */}
                    <circle
                      ref={progressCircleRef}
                      cx={RING_RADIUS + RING_STROKE}
                      cy={RING_RADIUS + RING_STROKE}
                      r={RING_RADIUS}
                      fill="none"
                      stroke={config.color}
                      strokeWidth={RING_STROKE}
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={RING_CIRCUMFERENCE}
                    />
                  </svg>
                  {/* Center text — compensate for SVG rotation */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ transform: 'rotate(0deg)' }}
                  >
                    <span className="font-mono text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {formatTimer(pomodoroTimeRemaining)}
                    </span>
                    <span className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      #{pomodoroSessionCount + 1}
                    </span>
                  </div>
                </div>

                {/* State label + task */}
                <div className="text-center w-full">
                  <p className="text-sm font-semibold" style={{ color: config.color }}>
                    {config.label}
                  </p>
                  {activeTask && (
                    <p
                      className="text-xs mt-1 truncate"
                      style={{ color: 'var(--color-text-tertiary)', maxWidth: 160 }}
                      title={activeTask.title}
                    >
                      {activeTask.title}
                    </p>
                  )}
                </div>

                {/* Session dots (4 dots = 1 cycle) */}
                <div className="flex gap-1.5">
                  {sessionsDisplay.map((filled, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                      style={{
                        background: filled ? config.color : 'var(--color-border)',
                      }}
                    />
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {pomodoroState === 'idle' ? (
                    <button
                      onClick={() => {
                        const firstTask = tasks[0];
                        if (firstTask) startPomodoro(firstTask.id);
                      }}
                      disabled={tasks.length === 0}
                      className="flex items-center gap-1.5 rounded-[var(--radius-md)] text-sm font-medium px-4 py-2 transition-colors disabled:opacity-50"
                      style={{
                        background: 'var(--color-primary)',
                        color: 'var(--color-primary-foreground)',
                      }}
                    >
                      <Play style={{ width: 14, height: 14 }} />
                      Start Focus
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={resetPomodoro}
                        className="flex items-center justify-center rounded-[var(--radius-md)] transition-colors"
                        style={{
                          width: 34, height: 34,
                          background: 'var(--color-surface-raised)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                        aria-label="Reset timer"
                      >
                        <RotateCcw style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        onClick={isPomodoroRunning ? pausePomodoro : resumePomodoro}
                        className="flex items-center justify-center rounded-[var(--radius-md)] transition-colors"
                        style={{
                          width: 40, height: 40,
                          background: config.color,
                          color: '#fff',
                        }}
                        aria-label={isPomodoroRunning ? 'Pause' : 'Resume'}
                      >
                        {isPomodoroRunning
                          ? <Pause style={{ width: 16, height: 16 }} />
                          : <Play style={{ width: 16, height: 16 }} />
                        }
                      </button>
                      <button
                        onClick={skipPomodoro}
                        className="flex items-center justify-center rounded-[var(--radius-md)] transition-colors"
                        style={{
                          width: 34, height: 34,
                          background: 'var(--color-surface-raised)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                        aria-label="Skip to next"
                      >
                        <SkipForward style={{ width: 14, height: 14 }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
