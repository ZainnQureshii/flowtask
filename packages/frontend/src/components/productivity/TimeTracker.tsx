import type { TimeEntry } from '@flowtask/shared';
import { useTimerStore } from '@/stores/timerStore';
import { formatDuration, formatTimer, formatRelative } from '@/lib/utils';
import { Play, Square, Plus, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useTaskStore } from '@/stores/taskStore';
import { AnimatePresence, motion } from 'motion/react';

interface TimeTrackerProps {
  taskId: string;
  timeEntries: TimeEntry[];
}

export function TimeTracker({ taskId, timeEntries }: TimeTrackerProps) {
  const { activeTimeEntry, isTimeTrackingRunning, timeTrackingElapsed, startTimeTracking, stopTimeTracking } = useTimerStore();
  const { deleteTimeEntry } = useTaskStore();
  const isTrackingThisTask = activeTimeEntry?.taskId === taskId;

  const [manualMinutes, setManualMinutes] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [showManual, setShowManual] = useState(false);

  const totalSeconds = timeEntries.reduce((sum, e) => sum + e.durationSeconds, 0);

  async function handleAddManual() {
    const mins = parseInt(manualMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    await api.addTimeEntry(taskId, mins * 60, manualNote || undefined);
    setManualMinutes('');
    setManualNote('');
    setShowManual(false);
  }

  return (
    <div className="space-y-3">
      {/* Header row: total + timer button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock style={{ width: 14, height: 14, color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {formatDuration(totalSeconds)}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>total</span>
        </div>

        <div className="flex items-center gap-2">
          {isTrackingThisTask ? (
            <>
              <span
                className="flex items-center gap-1.5 text-xs font-mono font-medium"
                style={{ color: 'var(--color-p1)' }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--color-p1)' }}
                />
                {formatTimer(timeTrackingElapsed)}
              </span>
              <button
                onClick={stopTimeTracking}
                className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: 'var(--color-destructive-muted)',
                  color: 'var(--color-destructive)',
                  border: '1px solid rgba(217,54,54,0.2)',
                }}
              >
                <Square style={{ width: 10, height: 10 }} />
                Stop
              </button>
            </>
          ) : (
            <button
              onClick={() => startTimeTracking(taskId)}
              className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                background: 'var(--color-success-muted)',
                color: 'var(--color-success)',
                border: '1px solid rgba(30,158,110,0.2)',
              }}
            >
              <Play style={{ width: 10, height: 10 }} />
              Start
            </button>
          )}

          <button
            onClick={() => setShowManual((v) => !v)}
            className="flex items-center justify-center rounded-[var(--radius-sm)] transition-colors"
            style={{
              width: 26, height: 26,
              background: showManual ? 'var(--color-primary-muted)' : 'var(--color-surface-raised)',
              color: showManual ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
              border: '1px solid var(--color-border)',
            }}
            title="Add manual entry"
            aria-label="Add manual time entry"
          >
            <Plus style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>

      {/* Manual entry form */}
      <AnimatePresence>
        {showManual && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className="flex gap-1.5 rounded-[var(--radius-md)] p-2"
              style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-subtle)' }}
            >
              <input
                type="number"
                placeholder="min"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                min={1}
                className="rounded-[var(--radius-sm)] text-xs px-2 py-1 outline-none"
                style={{
                  width: 52,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <input
                placeholder="Note (optional)"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                className="flex-1 rounded-[var(--radius-sm)] text-xs px-2 py-1 outline-none"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <button
                onClick={handleAddManual}
                className="rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-foreground)',
                }}
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time entries list */}
      {timeEntries.length > 0 && (
        <div className="space-y-0.5 max-h-44 overflow-y-auto">
          {timeEntries.map((entry) => (
            <div
              key={entry.id}
              className="group flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-raised)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <span
                className="font-mono text-xs font-medium shrink-0"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {formatDuration(entry.durationSeconds)}
              </span>
              {entry.note && (
                <span className="flex-1 truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {entry.note}
                </span>
              )}
              <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                {formatRelative(entry.startedAt)}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[var(--radius-sm)]"
                style={{ width: 20, height: 20, color: 'var(--color-destructive)' }}
                onClick={() => deleteTimeEntry(taskId, entry.id)}
                aria-label="Delete time entry"
              >
                <Trash2 style={{ width: 11, height: 11 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
