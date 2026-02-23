import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTimerStore } from '../../stores/timerStore';
import { DEFAULT_POMODORO } from '@flowtask/shared';

vi.mock('../../lib/api', () => ({
  api: {
    startPomodoro: vi.fn().mockResolvedValue({}),
    completePomodoro: vi.fn().mockResolvedValue({}),
    startTimeEntry: vi.fn(),
    stopTimeEntry: vi.fn().mockResolvedValue({}),
  },
}));

import { api } from '../../lib/api';

const initialState = {
  pomodoroState: 'idle' as const,
  pomodoroTaskId: null,
  pomodoroTimeRemaining: DEFAULT_POMODORO.workMinutes * 60,
  pomodoroSessionCount: 0,
  isPomodoroRunning: false,
  pomodoroIntervalId: null,
  activeTimeEntry: null,
  isTimeTrackingRunning: false,
  timeTrackingElapsed: 0,
  timeTrackingIntervalId: null,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  // Clear any existing intervals
  const state = useTimerStore.getState();
  if (state.pomodoroIntervalId) clearInterval(state.pomodoroIntervalId);
  if (state.timeTrackingIntervalId) clearInterval(state.timeTrackingIntervalId);
  useTimerStore.setState(initialState);
});

afterEach(() => {
  const state = useTimerStore.getState();
  if (state.pomodoroIntervalId) clearInterval(state.pomodoroIntervalId);
  if (state.timeTrackingIntervalId) clearInterval(state.timeTrackingIntervalId);
  vi.useRealTimers();
});

describe('timerStore', () => {
  describe('startPomodoro', () => {
    it('should start a work session', () => {
      useTimerStore.getState().startPomodoro('task-1');

      const state = useTimerStore.getState();
      expect(state.pomodoroState).toBe('work');
      expect(state.pomodoroTaskId).toBe('task-1');
      expect(state.pomodoroTimeRemaining).toBe(DEFAULT_POMODORO.workMinutes * 60);
      expect(state.isPomodoroRunning).toBe(true);
      expect(state.pomodoroIntervalId).not.toBeNull();
    });

    it('should call API to start pomodoro', () => {
      useTimerStore.getState().startPomodoro('task-1');

      expect(api.startPomodoro).toHaveBeenCalledWith('task-1', 'work', DEFAULT_POMODORO.workMinutes);
    });
  });

  describe('pausePomodoro', () => {
    it('should pause a running pomodoro', () => {
      useTimerStore.getState().startPomodoro('task-1');
      useTimerStore.getState().pausePomodoro();

      const state = useTimerStore.getState();
      expect(state.isPomodoroRunning).toBe(false);
      expect(state.pomodoroIntervalId).toBeNull();
    });
  });

  describe('resumePomodoro', () => {
    it('should resume a paused pomodoro', () => {
      useTimerStore.getState().startPomodoro('task-1');
      useTimerStore.getState().pausePomodoro();
      useTimerStore.getState().resumePomodoro();

      const state = useTimerStore.getState();
      expect(state.isPomodoroRunning).toBe(true);
      expect(state.pomodoroIntervalId).not.toBeNull();
    });
  });

  describe('resetPomodoro', () => {
    it('should reset all pomodoro state', () => {
      useTimerStore.getState().startPomodoro('task-1');
      useTimerStore.getState().resetPomodoro();

      const state = useTimerStore.getState();
      expect(state.pomodoroState).toBe('idle');
      expect(state.pomodoroTaskId).toBeNull();
      expect(state.pomodoroTimeRemaining).toBe(DEFAULT_POMODORO.workMinutes * 60);
      expect(state.pomodoroSessionCount).toBe(0);
      expect(state.isPomodoroRunning).toBe(false);
      expect(state.pomodoroIntervalId).toBeNull();
    });
  });

  describe('_tick', () => {
    it('should decrement time remaining by 1', () => {
      useTimerStore.getState().startPomodoro('task-1');
      const before = useTimerStore.getState().pomodoroTimeRemaining;

      vi.advanceTimersByTime(1000);

      expect(useTimerStore.getState().pomodoroTimeRemaining).toBe(before - 1);
    });

    it('should transition to break when work timer reaches 0', () => {
      useTimerStore.getState().startPomodoro('task-1');
      useTimerStore.setState({ pomodoroTimeRemaining: 1 });

      vi.advanceTimersByTime(1000);

      const state = useTimerStore.getState();
      expect(state.pomodoroState).toBe('short_break');
      expect(state.pomodoroSessionCount).toBe(1);
    });
  });

  describe('skipPomodoro', () => {
    it('should skip work to short break', () => {
      useTimerStore.getState().startPomodoro('task-1');
      useTimerStore.getState().skipPomodoro();

      const state = useTimerStore.getState();
      expect(state.pomodoroState).toBe('short_break');
      expect(state.pomodoroTimeRemaining).toBe(DEFAULT_POMODORO.shortBreakMinutes * 60);
      expect(state.pomodoroSessionCount).toBe(1);
    });

    it('should skip to long break after enough sessions', () => {
      useTimerStore.getState().startPomodoro('task-1');
      useTimerStore.setState({ pomodoroSessionCount: DEFAULT_POMODORO.sessionsBeforeLongBreak - 1 });

      useTimerStore.getState().skipPomodoro();

      const state = useTimerStore.getState();
      expect(state.pomodoroState).toBe('long_break');
      expect(state.pomodoroTimeRemaining).toBe(DEFAULT_POMODORO.longBreakMinutes * 60);
    });

    it('should skip break back to work', () => {
      useTimerStore.setState({
        ...initialState,
        pomodoroState: 'short_break',
        isPomodoroRunning: true,
      });

      useTimerStore.getState().skipPomodoro();

      const state = useTimerStore.getState();
      expect(state.pomodoroState).toBe('work');
      expect(state.pomodoroTimeRemaining).toBe(DEFAULT_POMODORO.workMinutes * 60);
    });
  });

  describe('startTimeTracking', () => {
    it('should start tracking with API entry', async () => {
      const entry = { id: 'e1', taskId: 'task-1', startedAt: '2026-01-01', endedAt: null, durationSeconds: 0, note: '' };
      vi.mocked(api.startTimeEntry).mockResolvedValue(entry);

      await useTimerStore.getState().startTimeTracking('task-1');

      const state = useTimerStore.getState();
      expect(state.activeTimeEntry).toEqual(entry);
      expect(state.isTimeTrackingRunning).toBe(true);
      expect(state.timeTrackingElapsed).toBe(0);
    });

    it('should fall back to local tracking on API failure', async () => {
      vi.mocked(api.startTimeEntry).mockRejectedValue(new Error('fail'));

      await useTimerStore.getState().startTimeTracking('task-1');

      const state = useTimerStore.getState();
      expect(state.activeTimeEntry).not.toBeNull();
      expect(state.activeTimeEntry?.taskId).toBe('task-1');
      expect(state.isTimeTrackingRunning).toBe(true);
    });

    it('should stop previous tracking before starting new', async () => {
      const entry1 = { id: 'e1', taskId: 't1', startedAt: '', endedAt: null, durationSeconds: 0, note: '' };
      vi.mocked(api.startTimeEntry).mockResolvedValue(entry1);
      await useTimerStore.getState().startTimeTracking('t1');

      const entry2 = { id: 'e2', taskId: 't2', startedAt: '', endedAt: null, durationSeconds: 0, note: '' };
      vi.mocked(api.startTimeEntry).mockResolvedValue(entry2);
      await useTimerStore.getState().startTimeTracking('t2');

      expect(api.stopTimeEntry).toHaveBeenCalledWith('e1');
      expect(useTimerStore.getState().activeTimeEntry?.id).toBe('e2');
    });
  });

  describe('stopTimeTracking', () => {
    it('should stop tracking and clear state', async () => {
      const entry = { id: 'e1', taskId: 't1', startedAt: '', endedAt: null, durationSeconds: 0, note: '' };
      vi.mocked(api.startTimeEntry).mockResolvedValue(entry);
      await useTimerStore.getState().startTimeTracking('t1');

      await useTimerStore.getState().stopTimeTracking();

      const state = useTimerStore.getState();
      expect(state.activeTimeEntry).toBeNull();
      expect(state.isTimeTrackingRunning).toBe(false);
      expect(state.timeTrackingElapsed).toBe(0);
    });
  });

  describe('_tickTimeTracking', () => {
    it('should increment elapsed time', async () => {
      const entry = { id: 'e1', taskId: 't1', startedAt: '', endedAt: null, durationSeconds: 0, note: '' };
      vi.mocked(api.startTimeEntry).mockResolvedValue(entry);
      await useTimerStore.getState().startTimeTracking('t1');

      vi.advanceTimersByTime(3000);

      expect(useTimerStore.getState().timeTrackingElapsed).toBe(3);
    });
  });
});
