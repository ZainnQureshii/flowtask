import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { Priority } from '@flowtask/shared';
import {
  Plus, Search, Sun, Moon, Kanban, List, CalendarDays, Hash, AlertCircle,
} from 'lucide-react';

export function QuickCapture() {
  const { isQuickCaptureOpen, toggleQuickCapture, setTheme, setActiveView } = useUIStore();
  const { tasks, tags, createTask, createTag } = useTaskStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!isQuickCaptureOpen) setInputValue('');
  }, [isQuickCaptureOpen]);

  function parseQuickInput(raw: string) {
    let title = raw;
    let priority: string = Priority.MEDIUM;
    let dueDate: string | undefined;
    const tagNames: string[] = [];

    const priorityMatch = title.match(/!(\w+)/);
    if (priorityMatch) {
      const p = priorityMatch[1].toLowerCase();
      if (['urgent', 'high', 'medium', 'low'].includes(p)) priority = p;
      title = title.replace(priorityMatch[0], '');
    }

    const tagMatches = title.matchAll(/#(\w+)/g);
    for (const match of tagMatches) {
      tagNames.push(match[1]);
      title = title.replace(match[0], '');
    }

    const dateMatch = title.match(/@(\S+)/);
    if (dateMatch) {
      const d = dateMatch[1].toLowerCase();
      const today = new Date();
      if (d === 'today') dueDate = today.toISOString();
      else if (d === 'tomorrow') {
        today.setDate(today.getDate() + 1);
        dueDate = today.toISOString();
      } else if (d === 'next-week') {
        today.setDate(today.getDate() + 7);
        dueDate = today.toISOString();
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        dueDate = new Date(d).toISOString();
      }
      title = title.replace(dateMatch[0], '');
    }

    return { title: title.trim(), priority, dueDate, tagNames };
  }

  async function handleQuickAdd() {
    if (!inputValue.trim()) return;
    const parsed = parseQuickInput(inputValue);
    if (!parsed.title) return;

    const tagIds: string[] = [];
    for (const name of parsed.tagNames) {
      const existing = tags.find((t) => t.name === name.toLowerCase());
      if (existing) {
        tagIds.push(existing.id);
      } else {
        const colors = ['#3b82f6', '#22c55e', '#8b5cf6', '#f97316', '#ec4899'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const newTag = await createTag(name.toLowerCase(), color);
        tagIds.push(newTag.id);
      }
    }

    await createTask({
      title: parsed.title,
      priority: parsed.priority as Priority,
      dueDate: parsed.dueDate || null,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
    });
    toggleQuickCapture();
  }

  const isSearch = inputValue.startsWith('/');
  const isCommand = inputValue.startsWith('>');
  const searchTerm = isSearch ? inputValue.slice(1) : inputValue;
  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Command.Dialog
      open={isQuickCaptureOpen}
      onOpenChange={(open) => { if (!open) toggleQuickCapture(); }}
      label="Quick capture"
      className="fixed inset-0 z-50"
      shouldFilter={false}
    >
      <DialogTitle className="sr-only">Quick capture</DialogTitle>
      <DialogDescription className="sr-only">Quickly add tasks, search, or run commands</DialogDescription>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ background: 'var(--color-overlay)', backdropFilter: 'blur(4px)' }}
        onClick={toggleQuickCapture}
      />

      {/* Panel */}
      <div
        className="fixed left-1/2 top-[18%] z-50 -translate-x-1/2 overflow-hidden"
        style={{
          width: 'min(640px, 90vw)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {isSearch ? (
            <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
          ) : isCommand ? (
            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
          ) : (
            <Plus className="h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
          )}
          <Command.Input
            value={inputValue}
            onValueChange={setInputValue}
            placeholder={
              isSearch
                ? 'Search tasks…'
                : isCommand
                  ? 'Type a command…'
                  : 'Add a task… (use !priority, #tag, @date)'
            }
            className="flex-1 py-3.5 text-[16px] outline-none bg-transparent placeholder:text-[var(--color-text-tertiary)]"
            style={{ color: 'var(--color-text-primary)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSearch && !isCommand) {
                e.preventDefault();
                handleQuickAdd();
              }
            }}
          />
        </div>

        {/* Results */}
        <Command.List
          className="overflow-y-auto"
          style={{ maxHeight: 400, padding: 8 }}
        >
          <Command.Empty
            className="flex flex-col items-center justify-center py-8 text-center"
            style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}
          >
            {isSearch ? 'No tasks found.' : 'Press Enter to create task'}
          </Command.Empty>

          {!isSearch && !isCommand && inputValue && (
            <Command.Item
              onSelect={handleQuickAdd}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] cursor-pointer"
              style={{
                color: 'var(--color-text-primary)',
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
              >
                <Plus className="h-4 w-4" />
              </span>
              <span>
                Create &quot;<span className="font-medium">{inputValue}</span>&quot;
              </span>
            </Command.Item>
          )}

          {isSearch && (
            <Command.Group>
              <div
                className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Tasks
              </div>
              {filteredTasks.slice(0, 8).map((task) => (
                <Command.Item
                  key={task.id}
                  value={task.title}
                  onSelect={() => {
                    useUIStore.getState().selectTask(task.id);
                    toggleQuickCapture();
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] cursor-pointer"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                  {task.title}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {isCommand && (
            <Command.Group>
              <div
                className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Commands
              </div>
              <Command.Item
                onSelect={() => { setTheme('light'); toggleQuickCapture(); }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] cursor-pointer"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Sun className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                Switch to Light theme
              </Command.Item>
              <Command.Item
                onSelect={() => { setTheme('dark'); toggleQuickCapture(); }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] cursor-pointer"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Moon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                Switch to Dark theme
              </Command.Item>
              <Command.Item
                onSelect={() => { setActiveView('kanban'); toggleQuickCapture(); }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] cursor-pointer"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Kanban className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                Go to Kanban view
              </Command.Item>
              <Command.Item
                onSelect={() => { setActiveView('list'); toggleQuickCapture(); }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] cursor-pointer"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <List className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                Go to List view
              </Command.Item>
              <Command.Item
                onSelect={() => { setActiveView('calendar'); toggleQuickCapture(); }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] cursor-pointer"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                Go to Calendar view
              </Command.Item>
            </Command.Group>
          )}
        </Command.List>

        {/* Footer hint */}
        <div
          className="border-t px-4 py-2.5 flex items-center gap-3"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)' }}
        >
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
            <Hash className="h-3 w-3" />
            <span>#tag</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
            <span className="font-mono">!</span>
            <span>!priority</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>@</span>
            <span>@today</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <kbd
              className="rounded text-[11px] px-1.5 py-0.5 font-mono font-medium"
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-hover)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Enter
            </kbd>
            <span className="text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>to create</span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}
