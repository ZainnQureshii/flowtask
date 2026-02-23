import { useMemo } from 'react';
import type { Task } from '@flowtask/shared';
import { TaskStatus } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { KanbanColumn } from './KanbanColumn';
import {
  DndContext, pointerWithin, rectIntersection, DragOverlay, type DragEndEvent, type DragStartEvent,
  PointerSensor, KeyboardSensor, useSensor, useSensors, type CollisionDetection,
} from '@dnd-kit/core';

const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return rectIntersection(args);
};
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useState } from 'react';

interface KanbanViewProps {
  tasks: Task[];
}

const columns = [
  { status: TaskStatus.TODO, label: 'Todo' },
  { status: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { status: TaskStatus.DONE, label: 'Done' },
  { status: TaskStatus.ARCHIVED, label: 'Archived' },
];

export function KanbanView({ tasks }: KanbanViewProps) {
  const { updateTask } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

    // Determine target status
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
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            tasks={tasksByStatus[col.status] || []}
            label={col.label}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="opacity-80 rotate-2">
            <TaskCard task={activeTask} variant="kanban" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
