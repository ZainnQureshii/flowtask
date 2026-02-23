import { useState } from 'react';
import { TASK_COLORS } from '@flowtask/shared';
import type { TaskStatus, Priority, CreateTaskInput } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagPicker } from '@/components/tags/TagPicker';

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function TaskForm() {
  const { isTaskFormOpen, closeTaskForm, taskFormDefaults } = useUIStore();
  const { createTask, updateTask } = useTaskStore();

  const isEditing = taskFormDefaults?.title !== undefined;
  const editingId = (taskFormDefaults as Record<string, unknown> | null)?.id as string | undefined;

  const [title, setTitle] = useState(taskFormDefaults?.title || '');
  const [description, setDescription] = useState(taskFormDefaults?.description || '');
  const [status, setStatus] = useState<TaskStatus>(taskFormDefaults?.status || 'todo');
  const [priority, setPriority] = useState<Priority>(taskFormDefaults?.priority || 'medium');
  const [color, setColor] = useState<string | null>(taskFormDefaults?.color || null);
  const [dueDate, setDueDate] = useState(taskFormDefaults?.dueDate || '');
  const [tagIds, setTagIds] = useState<string[]>(
    taskFormDefaults?.tagIds ||
    ((taskFormDefaults as any)?.tags?.map((t: any) => t.id) ?? [])
  );

  function toggleTag(tagId: string) {
    setTagIds((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const input: CreateTaskInput = {
      title: title.trim(),
      description,
      status,
      priority,
      color: color || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      tagIds,
    };

    if (isEditing && editingId) {
      await updateTask(editingId, input);
    } else {
      await createTask(input);
    }
    closeTaskForm();
  }

  return (
    <Dialog open={isTaskFormOpen} onOpenChange={(open) => !open && closeTaskForm()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Description (supports markdown)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="h-8 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-8 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Color</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setColor(null)}
                className="h-6 w-6 rounded-full border-2 bg-transparent"
                style={{ borderColor: color === null ? 'var(--color-foreground)' : 'var(--color-border)' }}
                aria-label="No color"
              >
                {color === null && <span className="block h-1 w-1 mx-auto rounded-full bg-foreground" />}
              </button>
              {TASK_COLORS.map((c: string) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'var(--color-foreground)' : 'transparent',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <TagPicker selectedTagIds={tagIds} onToggleTag={toggleTag} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeTaskForm}>Cancel</Button>
            <Button type="submit" disabled={!title.trim()}>
              {isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
