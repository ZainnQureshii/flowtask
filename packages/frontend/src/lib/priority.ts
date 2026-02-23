/**
 * Priority color utilities — maps Priority enum values to design system tokens.
 * P1=Urgent/Red, P2=High/Amber, P3=Medium/Blue, P4=Low/Gray. Never reassign.
 */
import { Priority } from '@flowtask/shared'

export const PRIORITY_COLORS = {
  [Priority.URGENT]: {
    color:    'var(--color-p1)',
    muted:    'var(--color-p1-muted)',
    label:    'Urgent',
    twBorder: 'border-l-[var(--color-p1)]',
    twText:   'text-[var(--color-p1)]',
    twBg:     'bg-[var(--color-p1-muted)]',
  },
  [Priority.HIGH]: {
    color:    'var(--color-p2)',
    muted:    'var(--color-p2-muted)',
    label:    'High',
    twBorder: 'border-l-[var(--color-p2)]',
    twText:   'text-[var(--color-p2)]',
    twBg:     'bg-[var(--color-p2-muted)]',
  },
  [Priority.MEDIUM]: {
    color:    'var(--color-p3)',
    muted:    'var(--color-p3-muted)',
    label:    'Medium',
    twBorder: 'border-l-[var(--color-p3)]',
    twText:   'text-[var(--color-p3)]',
    twBg:     'bg-[var(--color-p3-muted)]',
  },
  [Priority.LOW]: {
    color:    'var(--color-p4)',
    muted:    'var(--color-p4-muted)',
    label:    'Low',
    twBorder: 'border-l-[var(--color-p4)]',
    twText:   'text-[var(--color-p4)]',
    twBg:     'bg-[var(--color-p4-muted)]',
  },
} as const

export function getPriorityColor(priority: Priority | null) {
  return PRIORITY_COLORS[priority ?? Priority.LOW]
}
