import type { TimeEntry } from '@flowtask/shared';
import { useTimerStore } from '@/stores/timerStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDuration, formatTimer, formatRelative, cn } from '@/lib/utils';
import { Play, Square, Clock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useTaskStore } from '@/stores/taskStore';

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

  const totalSeconds = timeEntries.reduce((sum, e) => sum + e.durationSeconds, 0);

  async function handleAddManual() {
    const mins = parseInt(manualMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    await api.addTimeEntry(taskId, mins * 60, manualNote || undefined);
    setManualMinutes('');
    setManualNote('');
  }

  return (
    <div className="space-y-3">
      {/* Total time */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Total: {formatDuration(totalSeconds)}</span>
      </div>

      {/* Timer button */}
      <div className="flex gap-2">
        {isTrackingThisTask ? (
          <>
            <span className="flex items-center gap-1 text-sm font-mono text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {formatTimer(timeTrackingElapsed)}
            </span>
            <Button size="sm" variant="destructive" onClick={stopTimeTracking} className="gap-1">
              <Square className="h-3 w-3" /> Stop
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => startTimeTracking(taskId)} className="gap-1">
            <Play className="h-3 w-3" /> Start Timer
          </Button>
        )}
      </div>

      {/* Manual entry */}
      <div className="flex gap-1">
        <Input
          type="number"
          placeholder="Minutes"
          value={manualMinutes}
          onChange={(e) => setManualMinutes(e.target.value)}
          className="h-7 w-20 text-xs"
          min={1}
        />
        <Input
          placeholder="Note..."
          value={manualNote}
          onChange={(e) => setManualNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
          className="h-7 text-xs flex-1"
        />
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleAddManual}>
          Add
        </Button>
      </div>

      {/* Entries list */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {timeEntries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent/50 group">
            <span className="font-mono font-medium">{formatDuration(entry.durationSeconds)}</span>
            {entry.note && <span className="flex-1 truncate text-muted-foreground">{entry.note}</span>}
            <span className="text-muted-foreground">{formatRelative(entry.startedAt)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={() => deleteTimeEntry(taskId, entry.id)}
              aria-label="Delete time entry"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
