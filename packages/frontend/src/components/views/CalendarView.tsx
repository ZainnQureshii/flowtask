import { useState, useMemo } from 'react';
import type { Task } from '@flowtask/shared';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameDay, isSameMonth, isToday, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CalendarViewProps {
  tasks: Task[];
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const { selectTask } = useUIStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd],
  );

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (task.dueDate) {
        const key = task.dueDate.split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    }
    return map;
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border overflow-hidden">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay[key] || [];
          const inMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={key}
              className={cn(
                'min-h-[100px] bg-card p-1.5',
                !inMonth && 'bg-muted/30',
              )}
            >
              <div className={cn(
                'mb-1 text-xs font-medium',
                isToday(day) && 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground',
                !inMonth && 'text-muted-foreground',
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => selectTask(task.id)}
                    className="block w-full truncate rounded px-1 py-0.5 text-left text-[11px] hover:bg-accent transition-colors"
                    style={{ borderLeftWidth: 2, borderLeftColor: task.color || 'var(--color-primary)' }}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-[10px] text-muted-foreground hover:text-foreground px-1">
                        +{dayTasks.length - 3} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <p className="text-xs font-medium mb-1">{format(day, 'EEEE, MMM d')}</p>
                      <div className="space-y-1">
                        {dayTasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => selectTask(task.id)}
                            className="block w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-accent"
                          >
                            {task.title}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
