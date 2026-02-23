import { useTimerStore } from '@/stores/timerStore';
import { useTaskStore } from '@/stores/taskStore';
import { Button } from '@/components/ui/button';
import { formatTimer, cn } from '@/lib/utils';
import { DEFAULT_POMODORO } from '@flowtask/shared';
import { Play, Pause, SkipForward, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function PomodoroTimer() {
  const {
    pomodoroState, pomodoroTaskId, pomodoroTimeRemaining, pomodoroSessionCount,
    isPomodoroRunning, startPomodoro, pausePomodoro, resumePomodoro, skipPomodoro, resetPomodoro,
  } = useTimerStore();
  const { tasks } = useTaskStore();
  const [collapsed, setCollapsed] = useState(true);

  const activeTask = pomodoroTaskId ? tasks.find((t) => t.id === pomodoroTaskId) : null;
  const totalSeconds = pomodoroState === 'work'
    ? DEFAULT_POMODORO.workMinutes * 60
    : pomodoroState === 'short_break'
      ? DEFAULT_POMODORO.shortBreakMinutes * 60
      : pomodoroState === 'long_break'
        ? DEFAULT_POMODORO.longBreakMinutes * 60
        : DEFAULT_POMODORO.workMinutes * 60;

  const progress = totalSeconds > 0 ? ((totalSeconds - pomodoroTimeRemaining) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const stateLabels = {
    idle: 'Ready',
    work: 'Focus',
    short_break: 'Short Break',
    long_break: 'Long Break',
  };

  const stateColors = {
    idle: 'text-muted-foreground',
    work: 'text-red-500',
    short_break: 'text-green-500',
    long_break: 'text-blue-500',
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-30 hidden md:block"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
        {/* Collapsed view */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 px-3 py-2 w-full hover:bg-accent/50 transition-colors"
        >
          <div className={cn('h-2 w-2 rounded-full', isPomodoroRunning ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground')} />
          <span className="font-mono text-sm font-medium">{formatTimer(pomodoroTimeRemaining)}</span>
          <span className={cn('text-xs', stateColors[pomodoroState])}>{stateLabels[pomodoroState]}</span>
          {collapsed ? <ChevronUp className="h-3.5 w-3.5 ml-auto text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
        </button>

        {/* Expanded view */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t space-y-3">
                {/* Progress ring */}
                <div className="flex justify-center">
                  <svg width="120" height="120" className="-rotate-90">
                    <circle
                      cx="60" cy="60" r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-muted"
                    />
                    <circle
                      cx="60" cy="60" r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className={stateColors[pomodoroState]}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                    <text
                      x="60" y="60"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-foreground text-lg font-mono font-bold rotate-90 origin-center"
                    >
                      {formatTimer(pomodoroTimeRemaining)}
                    </text>
                  </svg>
                </div>

                {/* Session type & count */}
                <div className="text-center">
                  <p className={cn('text-sm font-medium', stateColors[pomodoroState])}>
                    {stateLabels[pomodoroState]}
                  </p>
                  {activeTask && (
                    <p className="text-xs text-muted-foreground truncate">{activeTask.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Session {pomodoroSessionCount}</p>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-2">
                  {pomodoroState === 'idle' ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        const firstTask = tasks[0];
                        if (firstTask) startPomodoro(firstTask.id);
                      }}
                      disabled={tasks.length === 0}
                    >
                      <Play className="h-4 w-4 mr-1" /> Start
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={resetPomodoro}
                        aria-label="Reset"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        onClick={isPomodoroRunning ? pausePomodoro : resumePomodoro}
                        aria-label={isPomodoroRunning ? 'Pause' : 'Resume'}
                      >
                        {isPomodoroRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={skipPomodoro}
                        aria-label="Skip"
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                      </Button>
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
