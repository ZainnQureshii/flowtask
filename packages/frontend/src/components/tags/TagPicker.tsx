import { useState } from 'react';
import type { Tag } from '@flowtask/shared';
import { TASK_COLORS } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagBadge } from './TagBadge';
import { Plus, Tags } from 'lucide-react';

interface TagPickerProps {
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
}

export function TagPicker({ selectedTagIds, onToggleTag }: TagPickerProps) {
  const { tags, createTag } = useTaskStore();
  const [search, setSearch] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const filtered = tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    const color = TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)];
    const tag = await createTag(newTagName.trim().toLowerCase(), color);
    onToggleTag(tag.id);
    setNewTagName('');
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Tags className="h-3.5 w-3.5" />
          Tags
          {selectedTagIds.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">{selectedTagIds.length}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <Input
          placeholder="Search tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8"
        />
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onToggleTag(tag.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
            >
              <div
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : 'transparent', borderColor: tag.color }}
              />
              {tag.name}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground p-2">No tags found</p>}
        </div>
        <div className="mt-2 flex gap-1 border-t pt-2">
          <Input
            placeholder="New tag..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            className="h-7 text-xs"
          />
          <Button size="sm" variant="ghost" onClick={handleCreateTag} className="h-7 px-2">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
