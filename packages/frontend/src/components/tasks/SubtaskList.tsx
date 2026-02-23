import { useState } from 'react';
import type { Subtask } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, X } from 'lucide-react';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
}

export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
  const { createSubtask, updateSubtask, deleteSubtask } = useTaskStore();
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const completed = subtasks.filter((s) => s.completed).length;
  const progress = subtasks.length > 0 ? (completed / subtasks.length) * 100 : 0;

  async function handleAdd() {
    if (!newTitle.trim()) return;
    await createSubtask(taskId, newTitle.trim());
    setNewTitle('');
  }

  function startEditing(subtask: Subtask) {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  }

  function saveEdit() {
    if (editingId && editingTitle.trim()) {
      updateSubtask(editingId, { title: editingTitle.trim() });
    }
    setEditingId(null);
    setEditingTitle('');
  }

  return (
    <div className="space-y-2">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground">
            {completed}/{subtasks.length}
          </span>
        </div>
      )}

      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2 group rounded px-1 py-0.5 hover:bg-accent/50">
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={(checked) => updateSubtask(subtask.id, { completed: !!checked })}
              aria-label={`Mark subtask "${subtask.title}" as ${subtask.completed ? 'incomplete' : 'complete'}`}
            />
            {editingId === subtask.id ? (
              <Input
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onBlur={saveEdit}
                className="h-7 text-sm"
              />
            ) : (
              <span
                onClick={() => startEditing(subtask)}
                className={`flex-1 text-sm cursor-pointer ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}
              >
                {subtask.title}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={() => deleteSubtask(subtask.id)}
              aria-label="Delete subtask"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        <Input
          placeholder="Add subtask..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="h-7 text-sm"
        />
        <Button size="sm" variant="ghost" onClick={handleAdd} className="h-7 px-2" aria-label="Add subtask">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
