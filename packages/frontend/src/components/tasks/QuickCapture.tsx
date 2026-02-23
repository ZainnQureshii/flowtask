import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { Priority } from '@flowtask/shared';
import {
  Plus, Search, Sun, Moon, Kanban, List, CalendarDays, Download,
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

    // Parse priority
    const priorityMatch = title.match(/!(\w+)/);
    if (priorityMatch) {
      const p = priorityMatch[1].toLowerCase();
      if (['urgent', 'high', 'medium', 'low'].includes(p)) {
        priority = p;
      }
      title = title.replace(priorityMatch[0], '');
    }

    // Parse tags
    const tagMatches = title.matchAll(/#(\w+)/g);
    for (const match of tagMatches) {
      tagNames.push(match[1]);
      title = title.replace(match[0], '');
    }

    // Parse due date
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

    // Resolve tag names to IDs, creating new tags if needed
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
      <div className="fixed inset-0 bg-black/50" onClick={toggleQuickCapture} />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border bg-popover shadow-2xl overflow-hidden">
        <Command.Input
          value={inputValue}
          onValueChange={setInputValue}
          placeholder="Type a task, /search, or >command..."
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isSearch && !isCommand) {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
        />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-6 text-center text-sm text-muted-foreground">
            {isSearch ? 'No tasks found.' : 'Press Enter to create task'}
          </Command.Empty>

          {!isSearch && !isCommand && inputValue && (
            <Command.Item
              onSelect={handleQuickAdd}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent"
            >
              <Plus className="h-4 w-4 text-primary" />
              Create &quot;{inputValue}&quot;
            </Command.Item>
          )}

          {isSearch && (
            <Command.Group heading="Tasks">
              {filteredTasks.slice(0, 10).map((task) => (
                <Command.Item
                  key={task.id}
                  value={task.title}
                  onSelect={() => {
                    useUIStore.getState().selectTask(task.id);
                    toggleQuickCapture();
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  {task.title}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {isCommand && (
            <Command.Group heading="Commands">
              <Command.Item
                onSelect={() => { setTheme('light'); toggleQuickCapture(); }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <Sun className="h-3.5 w-3.5" /> Light theme
              </Command.Item>
              <Command.Item
                onSelect={() => { setTheme('dark'); toggleQuickCapture(); }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <Moon className="h-3.5 w-3.5" /> Dark theme
              </Command.Item>
              <Command.Item
                onSelect={() => { setActiveView('kanban'); toggleQuickCapture(); }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <Kanban className="h-3.5 w-3.5" /> Go to Kanban
              </Command.Item>
              <Command.Item
                onSelect={() => { setActiveView('list'); toggleQuickCapture(); }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <List className="h-3.5 w-3.5" /> Go to List
              </Command.Item>
              <Command.Item
                onSelect={() => { setActiveView('calendar'); toggleQuickCapture(); }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent"
              >
                <CalendarDays className="h-3.5 w-3.5" /> Go to Calendar
              </Command.Item>
            </Command.Group>
          )}
        </Command.List>
        <div className="border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span className="font-medium">Tip:</span> Use !priority, #tag, @date syntax.{' '}
          <kbd className="rounded border px-1 py-0.5 text-[10px]">Enter</kbd> to create.
        </div>
      </div>
    </Command.Dialog>
  );
}
