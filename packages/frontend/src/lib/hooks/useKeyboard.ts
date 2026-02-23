import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export function useKeyboard() {
  const { toggleQuickCapture, openTaskForm, toggleSidebar, setTheme, theme, setActiveView } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (mod && e.key === 'k') {
        e.preventDefault();
        toggleQuickCapture();
        return;
      }

      if (mod && e.key === 'n') {
        e.preventDefault();
        openTaskForm();
        return;
      }

      if (mod && e.key === '/') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (mod && e.key === 'd') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
        return;
      }

      if (e.key === 'Escape') {
        useUIStore.getState().selectTask(null);
        useUIStore.getState().closeTaskForm();
        return;
      }

      // View switching (only when not typing)
      if (!isInput && !mod) {
        if (e.key === '1') { setActiveView('list'); return; }
        if (e.key === '2') { setActiveView('kanban'); return; }
        if (e.key === '3') { setActiveView('calendar'); return; }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleQuickCapture, openTaskForm, toggleSidebar, setTheme, theme, setActiveView]);
}
