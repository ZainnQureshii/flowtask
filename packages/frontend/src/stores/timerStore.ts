import { create } from 'zustand';
import type { TimeEntry } from '@flowtask/shared';
import { DEFAULT_POMODORO } from '@flowtask/shared';
import { api } from '@/lib/api';

type PomodoroState = 'idle' | 'work' | 'short_break' | 'long_break';

interface TimerStore {
  pomodoroState: PomodoroState;
  pomodoroTaskId: string | null;
  pomodoroTimeRemaining: number;
  pomodoroSessionCount: number;
  isPomodoroRunning: boolean;
  pomodoroIntervalId: ReturnType<typeof setInterval> | null;

  activeTimeEntry: TimeEntry | null;
  isTimeTrackingRunning: boolean;
  timeTrackingElapsed: number;
  timeTrackingIntervalId: ReturnType<typeof setInterval> | null;

  startPomodoro: (taskId: string) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  skipPomodoro: () => void;
  resetPomodoro: () => void;
  _tick: () => void;

  startTimeTracking: (taskId: string) => Promise<void>;
  stopTimeTracking: () => Promise<void>;
  _tickTimeTracking: () => void;
}

export const useTimerStore = create<TimerStore>()((set, get) => ({
  pomodoroState: 'idle',
  pomodoroTaskId: null,
  pomodoroTimeRemaining: DEFAULT_POMODORO.workMinutes * 60,
  pomodoroSessionCount: 0,
  isPomodoroRunning: false,
  pomodoroIntervalId: null,

  activeTimeEntry: null,
  isTimeTrackingRunning: false,
  timeTrackingElapsed: 0,
  timeTrackingIntervalId: null,

  startPomodoro: (taskId) => {
    const { pomodoroIntervalId } = get();
    if (pomodoroIntervalId) clearInterval(pomodoroIntervalId);
    const intervalId = setInterval(() => get()._tick(), 1000);
    set({
      pomodoroState: 'work',
      pomodoroTaskId: taskId,
      pomodoroTimeRemaining: DEFAULT_POMODORO.workMinutes * 60,
      isPomodoroRunning: true,
      pomodoroIntervalId: intervalId,
    });
    api.startPomodoro(taskId, 'work', DEFAULT_POMODORO.workMinutes).catch(() => {});
  },

  pausePomodoro: () => {
    const { pomodoroIntervalId } = get();
    if (pomodoroIntervalId) clearInterval(pomodoroIntervalId);
    set({ isPomodoroRunning: false, pomodoroIntervalId: null });
  },

  resumePomodoro: () => {
    const intervalId = setInterval(() => get()._tick(), 1000);
    set({ isPomodoroRunning: true, pomodoroIntervalId: intervalId });
  },

  skipPomodoro: () => {
    const { pomodoroIntervalId, pomodoroState, pomodoroSessionCount } = get();
    if (pomodoroIntervalId) clearInterval(pomodoroIntervalId);

    if (pomodoroState === 'work') {
      const newCount = pomodoroSessionCount + 1;
      const isLongBreak = newCount % DEFAULT_POMODORO.sessionsBeforeLongBreak === 0;
      const nextState: PomodoroState = isLongBreak ? 'long_break' : 'short_break';
      const duration = isLongBreak ? DEFAULT_POMODORO.longBreakMinutes : DEFAULT_POMODORO.shortBreakMinutes;
      const intervalId = setInterval(() => get()._tick(), 1000);
      set({
        pomodoroState: nextState,
        pomodoroTimeRemaining: duration * 60,
        pomodoroSessionCount: newCount,
        isPomodoroRunning: true,
        pomodoroIntervalId: intervalId,
      });
    } else {
      const intervalId = setInterval(() => get()._tick(), 1000);
      set({
        pomodoroState: 'work',
        pomodoroTimeRemaining: DEFAULT_POMODORO.workMinutes * 60,
        isPomodoroRunning: true,
        pomodoroIntervalId: intervalId,
      });
    }
  },

  resetPomodoro: () => {
    const { pomodoroIntervalId } = get();
    if (pomodoroIntervalId) clearInterval(pomodoroIntervalId);
    set({
      pomodoroState: 'idle',
      pomodoroTaskId: null,
      pomodoroTimeRemaining: DEFAULT_POMODORO.workMinutes * 60,
      pomodoroSessionCount: 0,
      isPomodoroRunning: false,
      pomodoroIntervalId: null,
    });
  },

  _tick: () => {
    const { pomodoroTimeRemaining } = get();
    if (pomodoroTimeRemaining <= 1) {
      get().skipPomodoro();
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro', { body: 'Session complete!' });
      }
      return;
    }
    set({ pomodoroTimeRemaining: pomodoroTimeRemaining - 1 });
  },

  startTimeTracking: async (taskId) => {
    const { activeTimeEntry, timeTrackingIntervalId } = get();
    if (activeTimeEntry) {
      await get().stopTimeTracking();
    }
    if (timeTrackingIntervalId) clearInterval(timeTrackingIntervalId);
    try {
      const entry = (await api.startTimeEntry(taskId)) as TimeEntry;
      const intervalId = setInterval(() => get()._tickTimeTracking(), 1000);
      set({
        activeTimeEntry: entry,
        isTimeTrackingRunning: true,
        timeTrackingElapsed: 0,
        timeTrackingIntervalId: intervalId,
      });
    } catch {
      // Fallback: local-only tracking
      const entry: TimeEntry = {
        id: crypto.randomUUID(),
        taskId,
        startedAt: new Date().toISOString(),
        endedAt: null,
        durationSeconds: 0,
        note: '',
      };
      const intervalId = setInterval(() => get()._tickTimeTracking(), 1000);
      set({
        activeTimeEntry: entry,
        isTimeTrackingRunning: true,
        timeTrackingElapsed: 0,
        timeTrackingIntervalId: intervalId,
      });
    }
  },

  stopTimeTracking: async () => {
    const { activeTimeEntry, timeTrackingIntervalId } = get();
    if (timeTrackingIntervalId) clearInterval(timeTrackingIntervalId);
    if (activeTimeEntry) {
      try {
        await api.stopTimeEntry(activeTimeEntry.id);
      } catch {
        // ok
      }
    }
    set({
      activeTimeEntry: null,
      isTimeTrackingRunning: false,
      timeTrackingElapsed: 0,
      timeTrackingIntervalId: null,
    });
  },

  _tickTimeTracking: () => {
    set((s) => ({ timeTrackingElapsed: s.timeTrackingElapsed + 1 }));
  },
}));
