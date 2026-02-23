import { useState } from 'react';
import { TASK_COLORS } from '@flowtask/shared';
import { useTaskStore } from '@/stores/taskStore';
import { Plus, Trash2, Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

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
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
        Tags
      </p>

      {/* Existing tags */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {tags.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm py-2"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              No tags yet. Create one below.
            </motion.p>
          )}
          {tags.map((tag) => (
            <motion.div
              key={tag.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 transition-colors"
              style={{ border: '1px solid var(--color-border-subtle)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ background: tag.color }}
              />
              <Tag style={{ width: 12, height: 12, color: 'var(--color-text-tertiary)' }} />
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {tag.name}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[var(--radius-sm)] transition-all"
                style={{
                  width: 26, height: 26,
                  color: 'var(--color-destructive)',
                }}
                onClick={() => deleteTag(tag.id)}
                aria-label={`Delete tag ${tag.name}`}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create new tag */}
      <div
        className="rounded-[var(--radius-md)] p-3 space-y-3"
        style={{
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          New tag
        </p>

        {/* Color picker */}
        <div className="flex flex-wrap gap-2">
          {TASK_COLORS.map((color: string) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className="rounded-full transition-all duration-150 focus:outline-none"
              style={{
                width: 20,
                height: 20,
                background: color,
                transform: selectedColor === color ? 'scale(1.25)' : 'scale(1)',
                outline: selectedColor === color ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
              }}
              aria-label={`Select color ${color}`}
              aria-pressed={selectedColor === color}
            />
          ))}
        </div>

        {/* Name input + button */}
        <div className="flex gap-2">
          <div className="flex items-center flex-1 rounded-[var(--radius-md)] overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            {/* Color preview dot */}
            <div
              className="ml-2.5 h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: selectedColor }}
            />
            <input
              placeholder="Tag name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
