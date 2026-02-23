import { useTaskStore } from '@/stores/taskStore';
import type { TaskStatus, Priority } from '@flowtask/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TagBadge } from '@/components/tags/TagBadge';
import { X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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

export function TaskFilters() {
  const { filters, setFilters, clearFilters, tags } = useTaskStore();
  const [expanded, setExpanded] = useState(false);

  const hasFilters = !!(
    filters.status?.length || filters.priority?.length || filters.tagIds?.length || filters.search
  );

  function toggleStatus(status: TaskStatus) {
    const current = filters.status || [];
    const next = current.includes(status)
      ? current.filter((s: TaskStatus) => s !== status)
      : [...current, status];
    setFilters({ status: next.length > 0 ? next : undefined });
  }

  function togglePriority(priority: Priority) {
    const current = filters.priority || [];
    const next = current.includes(priority)
      ? current.filter((p: Priority) => p !== priority)
      : [...current, priority];
    setFilters({ priority: next.length > 0 ? next : undefined });
  }

  function toggleTag(tagId: string) {
    const current = filters.tagIds || [];
    const next = current.includes(tagId)
      ? current.filter((id: string) => id !== tagId)
      : [...current, tagId];
    setFilters({ tagIds: next.length > 0 ? next : undefined });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {hasFilters && <span className="ml-1 h-2 w-2 rounded-full bg-primary" />}
        </Button>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1">
            {filters.status?.map((s: TaskStatus) => (
              <Badge key={s} variant="secondary" className="gap-1 text-xs">
                {s.replace('_', ' ')}
                <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => toggleStatus(s)} />
              </Badge>
            ))}
            {filters.priority?.map((p: Priority) => (
              <Badge key={p} variant="secondary" className="gap-1 text-xs">
                {p}
                <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => togglePriority(p)} />
              </Badge>
            ))}
            {filters.tagIds?.map((id: string) => {
              const tag = tags.find((t) => t.id === id);
              return tag ? <TagBadge key={id} tag={tag} onRemove={() => toggleTag(id)} /> : null;
            })}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
              Clear all
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="flex flex-wrap gap-4 rounded-lg border p-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
            <div className="flex flex-wrap gap-1">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filters.status?.includes(value) ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => toggleStatus(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Priority</p>
            <div className="flex flex-wrap gap-1">
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filters.priority?.includes(value) ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => togglePriority(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs border transition-colors',
                      filters.tagIds?.includes(tag.id) ? 'bg-accent' : 'hover:bg-accent/50',
                    )}
                    style={{ borderColor: tag.color + '60' }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
