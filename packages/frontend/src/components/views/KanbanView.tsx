import { useMemo, useRef } from 'react';
import type { Task } from '@flowtask/shared';
import { TaskStatus } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { KanbanColumn } from './KanbanColumn';
import {
  DndContext, pointerWithin, rectIntersection, DragOverlay,
  type DragEndEvent, type DragStartEvent, PointerSensor,
  KeyboardSensor, useSensor, useSensors, type CollisionDetection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';

const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

interface KanbanViewProps {
  tasks: Task[];
}

const columns = [
  { status: TaskStatus.TODO, label: 'To Do' },
  { status: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { status: TaskStatus.DONE, label: 'Done' },
  { status: TaskStatus.ARCHIVED, label: 'Archived' },
];

export function KanbanView({ tasks }: KanbanViewProps) {
  const { updateTask } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of columns) {
      map[col.status] = tasks
        .filter((t) => t.status === col.status)
        .sort((a, b) => a.position - b.position);
    }
    return map;
  }, [tasks]);

  // Staggered column entrance animation on mount
  useGSAP(
    () => {
      const cols = boardRef.current?.querySelectorAll('[data-kanban-column]');
      if (!cols?.length) return;

      gsap.fromTo(
        cols,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity' },
      );

      // Cards within each column stagger in after column
      cols.forEach((col, i) => {
        const cards = col.querySelectorAll('[data-kanban-card]');
        if (!cards.length) return;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 8 },
          {
            opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: 'power2.out',
            delay: 0.08 * i + 0.15, clearProps: 'transform,opacity',
          },
        );
      });
    },
    { scope: boardRef },
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const task = tasks.find((t) => t.id === activeId);
    if (!task) return;

    let targetStatus = task.status;
    const overData = over.data?.current;
    if (overData?.type === 'column') {
      targetStatus = overData.status;
    } else if (overData?.type === 'task') {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    const columnTasks = tasksByStatus[targetStatus] || [];
    const overIndex = columnTasks.findIndex((t) => t.id === over.id);
    const newPosition = overIndex >= 0 ? overIndex : columnTasks.length;

    const statusChanged = targetStatus !== task.status;
    const positionChanged = newPosition !== task.position || statusChanged;

    if (positionChanged) {
      updateTask(activeId, { status: targetStatus, position: newPosition });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div ref={boardRef} className="flex gap-4 overflow-x-auto pb-4 h-full">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            tasks={tasksByStatus[col.status] || []}
            label={col.label}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {activeTask && (
          <div
            className="rotate-[1.5deg] scale-[1.02]"
            style={{
              boxShadow: 'var(--shadow-xl)',
              borderRadius: 8,
              opacity: 0.95,
            }}
          >
            <TaskCard task={activeTask} variant="kanban" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
