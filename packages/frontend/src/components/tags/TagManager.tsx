import { useState } from 'react';
import { TASK_COLORS } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export function TagManager() {
  const { tags, createTag, deleteTag } = useTaskStore();
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(TASK_COLORS[4]);

  async function handleAdd() {
    if (!newName.trim()) return;
    await createTag(newName.trim().toLowerCase(), selectedColor);
    setNewName('');
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Manage Tags</h3>
      <div className="space-y-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
            <span className="flex-1 text-sm">{tag.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => deleteTag(tag.id)}
              aria-label={`Delete tag ${tag.name}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Tag name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-8"
          />
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TASK_COLORS.map((color: string) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className="h-5 w-5 rounded-full border-2 transition-transform"
              style={{
                backgroundColor: color,
                borderColor: selectedColor === color ? 'var(--color-foreground)' : 'transparent',
                transform: selectedColor === color ? 'scale(1.2)' : 'scale(1)',
              }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
