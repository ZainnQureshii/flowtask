import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, type Toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const BORDER_COLORS = {
  success: 'var(--color-success)',
  error: 'var(--color-destructive)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
} as const;

const ICON_COLORS = {
  success: 'var(--color-success)',
  error: 'var(--color-destructive)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();
  const Icon = ICONS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 rounded-[var(--radius-md)] px-4 py-3 shadow-[var(--shadow-lg)]"
      style={{
        width: 320,
        background: 'var(--color-surface-overlay)',
        borderLeft: `3px solid ${BORDER_COLORS[toast.type]}`,
        color: 'var(--color-text-primary)',
      }}
      role="alert"
      aria-live="polite"
    >
      <Icon
        className="shrink-0 mt-0.5"
        style={{ width: 16, height: 16, color: ICON_COLORS[toast.type] }}
      />
      <p className="flex-1 text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const { toasts } = useToastStore();

  return (
    <div
      className="fixed z-50 flex flex-col gap-2"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        right: 16,
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
