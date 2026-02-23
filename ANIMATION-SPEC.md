# FlowTask Animation & Motion Design Spec

> **Philosophy**: Every animation serves a purpose — to communicate state, guide attention, confirm action, or reinforce our calm/premium personality. If removing an animation loses feedback or meaning, it stays. If not, cut it. No decoration for decoration's sake.
>
> **Personality target**: Calm, precise, satisfying. Like high-end Swiss watches — motion that conveys quality without shouting for attention.

---

## Table of Contents

1. [GSAP Setup](#1-gsap-setup)
2. [Timing Standards](#2-timing-standards)
3. [Page Transitions](#3-page-transitions)
4. [Task Card Animations](#4-task-card-animations)
5. [Sidebar Animations](#5-sidebar-animations)
6. [Kanban Board Animations](#6-kanban-board-animations)
7. [Modal / Dialog Animations](#7-modal--dialog-animations)
8. [Empty States](#8-empty-states)
9. [Celebrations](#9-celebrations)
10. [Loading States](#10-loading-states)
11. [Scroll Animations](#11-scroll-animations)
12. [prefers-reduced-motion](#12-prefers-reduced-motion)
13. [React Integration Patterns](#13-react-integration-patterns)

---

## 1. GSAP Setup

### Package Installation

```bash
pnpm --filter frontend add gsap @gsap/react
```

> **Note**: FlowTask already uses Framer Motion for some animations. GSAP is additive — use it for timeline-based sequences (completion animations, celebrations, complex stagger effects) where Framer Motion's declarative model becomes cumbersome. Use Framer Motion for layout animations and simple enter/exit. Use GSAP for choreographed multi-step sequences.

### Plugin Registration (`packages/frontend/src/lib/gsap.ts`)

```typescript
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { DrawSVG } from 'gsap/DrawSVG'

// Register all plugins once — at module level, not inside components
gsap.registerPlugin(ScrollTrigger, Flip, DrawSVG)

// Global GSAP defaults — enforces our timing system
gsap.defaults({
  ease: 'power2.out',
  duration: 0.2,
})

// Respect prefers-reduced-motion at the GSAP level
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
if (mediaQuery.matches) {
  gsap.globalTimeline.timeScale(1000) // Instant — all durations ~0
}

mediaQuery.addEventListener('change', (e) => {
  gsap.globalTimeline.timeScale(e.matches ? 1000 : 1)
})

export { gsap, ScrollTrigger, Flip, DrawSVG }
export default gsap
```

### App Entry Point (`packages/frontend/src/main.tsx`)

```typescript
// Import GSAP setup before any components render
import './lib/gsap'
```

---

## 2. Timing Standards

### Duration Table

| Interaction | Duration | Why |
|---|---|---|
| Hover state | `100ms` | Instant enough to feel responsive, not jarring |
| Button press / micro-feedback | `150ms` | Confirms tap/click without delaying the action |
| Element transition (in/out) | `200–300ms` | Perceivable but not attention-grabbing |
| Layout shift (Flip reflow) | `400ms` | Spatial changes need enough time to track |
| Page / view transition | `500–600ms` | Context switch — user needs to re-orient |
| Celebration / reward | `800ms` | Emotional beat — deserves the full moment |

### Easing Curves

```typescript
// packages/frontend/src/lib/easings.ts
export const EASINGS = {
  // Exits: start fast, decelerate — element "arrives"
  enter: 'power2.out',          // General enter
  enterSpring: 'back.out(1.4)', // Slight overshoot for emphasis

  // Entrances: start slow, accelerate — element "leaves"
  exit: 'power2.in',

  // Balanced: smooth throughout
  smooth: 'power1.inOut',

  // Spring physics — drag & drop, card lifts
  spring: 'elastic.out(1, 0.5)',

  // Custom cubic-bezier equivalents
  panelSlide: 'power4.out',     // cubic-bezier(0.16, 1, 0.3, 1)
  celebration: 'expo.out',

  // Immediate for reduced-motion fallbacks
  instant: 'none',
} as const
```

---

## 3. Page Transitions

### Strategy

View switches (List → Kanban → Timeline) use a **staggered crossfade** — the outgoing view fades and slides up slightly while the incoming view fades and slides up from below. Content within the new view staggers in sequentially.

This communicates: "you are looking at different data now." It's not decorative — it prevents the jarring snap of content appearing instantly.

### Implementation

```typescript
// packages/frontend/src/hooks/useViewTransition.ts
import { useRef, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from '../lib/gsap'

export function useViewTransition() {
  const containerRef = useRef<HTMLDivElement>(null)

  const transitionOut = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!containerRef.current) return resolve()
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -12,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: resolve,
      })
    })
  }, [])

  const transitionIn = useCallback(() => {
    if (!containerRef.current) return
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    )

    // Stagger child task items into view
    const items = containerRef.current.querySelectorAll('[data-task-item]')
    if (items.length > 0) {
      gsap.fromTo(
        items,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.25,
          stagger: { amount: 0.3, ease: 'power1.out' },
          ease: 'power2.out',
          delay: 0.1,
        }
      )
    }
  }, [])

  return { containerRef, transitionOut, transitionIn }
}
```

### View Switch Orchestration

```typescript
// In the main view switcher component
async function handleViewChange(newView: ViewType) {
  await transitionOut()         // Wait for exit
  setActiveView(newView)        // React re-renders with new content
  requestAnimationFrame(() => {
    transitionIn()              // Animate new content in
  })
}
```

### Crossfade Rule

**No simultaneous in/out.** The exit completes fully (250ms) before the enter begins (350ms). Total perceived transition: ~350ms (exit overlaps with React re-render). This is deliberate — overlapping crossfades on task lists look chaotic.

---

## 4. Task Card Animations

### 4.1 Staggered Entrance

When a list first loads or after a filter change, cards stagger in sequentially:

```typescript
// packages/frontend/src/hooks/useTaskListEntrance.ts
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from '../lib/gsap'

export function useTaskListEntrance(deps: unknown[]) {
  const listRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const items = listRef.current?.querySelectorAll('[data-task-item]')
      if (!items?.length) return

      gsap.fromTo(
        items,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          stagger: { amount: 0.25, ease: 'none' }, // amount = total time spread over all
          ease: 'power2.out',
          clearProps: 'transform,opacity', // Let CSS take over after
        }
      )
    },
    { scope: listRef, dependencies: deps }
  )

  return listRef
}
```

### 4.2 New Task Appearance

When a task is added (optimistic update), it materializes from 0 → full:

```typescript
// Usage: call after appending task to DOM
export function animateTaskIn(element: HTMLElement) {
  gsap.fromTo(
    element,
    { opacity: 0, scaleY: 0.85, transformOrigin: 'top center' },
    {
      opacity: 1,
      scaleY: 1,
      duration: 0.25,
      ease: 'back.out(1.2)',
      clearProps: 'transform,opacity',
    }
  )
}
```

### 4.3 Hover Lift

Pure CSS handles hover lift — GSAP is overkill for a simple hover state:

```css
/* packages/frontend/src/styles/task-card.css */
[data-task-card] {
  transition: box-shadow 100ms ease-out, transform 100ms ease-out;
}

[data-task-card]:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### 4.4 Task Completion Animation — THE CENTERPIECE

This is the most important animation in FlowTask. The sequence:

1. **Checkbox fill** (100ms) — priority color floods the circle
2. **Checkmark draw** (200ms) — SVG stroke animates from 0% to 100% via DrawSVG
3. **Text strikethrough** (150ms) — line slides in from left via clip-path
4. **Row fade** (300ms after 800ms delay) — row dims then slides out, Flip reflows remaining items

```typescript
// packages/frontend/src/components/TaskCheckbox.tsx
import { useRef, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from '../lib/gsap'
import { Flip } from 'gsap/Flip'

interface TaskCheckboxProps {
  taskId: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  onComplete: (id: string) => void
}

const PRIORITY_COLORS = {
  urgent: '#EF4444',
  high:   '#F59E0B',
  medium: '#3B82F6',
  low:    '#6B7280',
}

export function TaskCheckbox({ taskId, priority, onComplete }: TaskCheckboxProps) {
  const checkboxRef = useRef<SVGSVGElement>(null)
  const rowRef      = useRef<HTMLDivElement>(null)
  const titleRef    = useRef<HTMLSpanElement>(null)

  const handleComplete = useCallback(() => {
    const color = PRIORITY_COLORS[priority]
    const svg   = checkboxRef.current
    if (!svg) return

    const circle    = svg.querySelector<SVGCircleElement>('.checkbox-circle')
    const checkmark = svg.querySelector<SVGPathElement>('.checkbox-check')
    const row       = rowRef.current
    const title     = titleRef.current

    const tl = gsap.timeline({
      onComplete: () => {
        // Capture layout state before DOM mutation
        const state = Flip.getState('[data-task-item]')
        onComplete(taskId) // React removes this task from list

        // Flip: animate remaining tasks into their new positions
        Flip.from(state, {
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.02,
          absolute: true,
        })
      },
    })

    // Step 1: Fill circle with priority color
    tl.to(circle, {
      fill: color,
      stroke: color,
      duration: 0.1,
      ease: 'none',
    })

    // Step 2: Draw checkmark stroke
    tl.fromTo(
      checkmark,
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.2, ease: 'power2.out' }
    )

    // Step 3: Strikethrough via clip-path on the title span
    tl.fromTo(
      title,
      { '--strikethrough-width': '0%' },
      { '--strikethrough-width': '100%', duration: 0.15, ease: 'power2.out' },
      '-=0.05' // slight overlap with checkmark
    )

    // Step 4: After brief pause, fade and shrink the row out
    tl.to(
      row,
      { opacity: 0.4, duration: 0.2, ease: 'power2.out' },
      '+=0.5' // 500ms celebration pause before removing
    )
    tl.to(row, {
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginBottom: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.inOut',
    })
  }, [taskId, priority, onComplete])

  return (
    <div ref={rowRef} data-task-item>
      <svg
        ref={checkboxRef}
        width="20"
        height="20"
        viewBox="0 0 20 20"
        onClick={handleComplete}
        className="cursor-pointer"
      >
        <circle
          className="checkbox-circle"
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke={PRIORITY_COLORS[priority]}
          strokeWidth="1.5"
        />
        {/* Checkmark path — DrawSVG animates the stroke */}
        <path
          className="checkbox-check"
          d="M 5.5 10 L 8.5 13 L 14.5 7"
          fill="none"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span ref={titleRef} className="task-title" data-task-title>
        {/* task title */}
      </span>
    </div>
  )
}
```

**CSS for strikethrough** (`task-card.css`):

```css
[data-task-title] {
  position: relative;
  --strikethrough-width: 0%;
}

[data-task-title]::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: var(--strikethrough-width);
  height: 1.5px;
  background: var(--text-secondary);
  transform: translateY(-50%);
}
```

### 4.5 Task Deletion

Delete is irreversible — the animation should feel final, not playful:

```typescript
export function animateTaskDelete(element: HTMLElement, onComplete: () => void) {
  // Capture Flip state before removal
  const state = Flip.getState('[data-task-item]')

  const tl = gsap.timeline({ onComplete })

  tl.to(element, {
    opacity: 0,
    scaleX: 0.9,
    x: -16,
    duration: 0.2,
    ease: 'power2.in',
  })
  tl.to(element, {
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 0,
    duration: 0.2,
    ease: 'power2.inOut',
    onComplete: () => {
      // Remove from DOM, then reflow
      onComplete()
      Flip.from(state, {
        duration: 0.35,
        ease: 'power2.out',
        stagger: 0.015,
      })
    },
  })
}
```

---

## 5. Sidebar Animations

### 5.1 Desktop Collapse / Expand

The sidebar collapses from 240px → 56px. Icon labels fade out while icons stay centered. Main content expands simultaneously.

```typescript
// packages/frontend/src/hooks/useSidebarAnimation.ts
import { useRef, useState, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from '../lib/gsap'

const SIDEBAR_FULL  = 240
const SIDEBAR_ICON  = 56

export function useSidebarAnimation() {
  const sidebarRef = useRef<HTMLElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggle = useCallback(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const collapsing = !isCollapsed
    const labels     = sidebar.querySelectorAll('[data-sidebar-label]')
    const icons      = sidebar.querySelectorAll('[data-sidebar-icon]')

    const tl = gsap.timeline({
      onComplete: () => setIsCollapsed(collapsing),
    })

    if (collapsing) {
      // Labels out first (fast), then sidebar shrinks
      tl.to(labels, { opacity: 0, x: -8, duration: 0.1, ease: 'power2.in', stagger: 0.02 })
      tl.to(sidebar, { width: SIDEBAR_ICON, duration: 0.2, ease: 'power4.out' }, '-=0.05')
      tl.to(icons, { x: 0, duration: 0.15, ease: 'power2.out' }, '<')
    } else {
      // Sidebar expands first, then labels fade in
      tl.to(sidebar, { width: SIDEBAR_FULL, duration: 0.2, ease: 'power4.out' })
      tl.to(labels, { opacity: 1, x: 0, duration: 0.15, ease: 'power2.out', stagger: 0.025 }, '-=0.05')
    }
  }, [isCollapsed])

  return { sidebarRef, isCollapsed, toggle }
}
```

### 5.2 Mobile Slide-In Drawer

On mobile, the sidebar is a full overlay drawer that slides in from the left with a backdrop:

```typescript
// packages/frontend/src/hooks/useMobileDrawer.ts
export function useMobileDrawer() {
  const drawerRef  = useRef<HTMLElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  const open = useCallback(() => {
    const tl = gsap.timeline()
    // Backdrop fades in
    tl.to(backdropRef.current, { opacity: 1, duration: 0.25, ease: 'none' })
    // Drawer slides in simultaneously
    tl.to(drawerRef.current, { x: 0, duration: 0.3, ease: 'power4.out' }, '<')
  }, [])

  const close = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve })
      tl.to(drawerRef.current, { x: '-100%', duration: 0.25, ease: 'power2.in' })
      tl.to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'none' }, '<')
    })
  }, [])

  // Initial state — drawer off-screen
  useGSAP(() => {
    gsap.set(drawerRef.current, { x: '-100%' })
    gsap.set(backdropRef.current, { opacity: 0 })
  }, { scope: drawerRef })

  return { drawerRef, backdropRef, open, close }
}
```

---

## 6. Kanban Board Animations

### 6.1 Column Entrance Stagger

When the Kanban view mounts, columns stagger in left-to-right:

```typescript
// packages/frontend/src/hooks/useKanbanEntrance.ts
export function useKanbanEntrance() {
  const boardRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const columns = boardRef.current?.querySelectorAll('[data-kanban-column]')
      if (!columns?.length) return

      gsap.fromTo(
        columns,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      )

      // Cards within each column stagger in after column appears
      columns.forEach((col, i) => {
        const cards = col.querySelectorAll('[data-kanban-card]')
        if (!cards.length) return
        gsap.fromTo(
          cards,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            stagger: 0.04,
            ease: 'power2.out',
            delay: 0.08 * i + 0.15, // Start after column enters
            clearProps: 'transform,opacity',
          }
        )
      })
    },
    { scope: boardRef }
  )

  return boardRef
}
```

### 6.2 Drag Lifecycle Animations

```typescript
// packages/frontend/src/hooks/useKanbanDrag.ts
// Works alongside @dnd-kit — GSAP handles visual polish only

export function useKanbanDrag() {
  const liftCard = useCallback((element: HTMLElement) => {
    gsap.to(element, {
      scale: 1.03,
      rotate: 1.5,
      boxShadow: 'var(--shadow-xl)',
      duration: 0.15,
      ease: 'power2.out',
    })
  }, [])

  const dropCard = useCallback((element: HTMLElement) => {
    // Spring bounce on drop
    gsap.to(element, {
      scale: 1,
      rotate: 0,
      boxShadow: 'var(--shadow-sm)',
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
      clearProps: 'box-shadow,transform',
    })
  }, [])

  const snapBack = useCallback((element: HTMLElement, origin: DOMRect) => {
    // Invalid drop — snap card back to original position
    gsap.to(element, {
      x: origin.left,
      y: origin.top,
      scale: 1,
      rotate: 0,
      duration: 0.3,
      ease: 'back.out(1.5)',
      clearProps: 'all',
    })
  }, [])

  return { liftCard, dropCard, snapBack }
}
```

### 6.3 Placeholder Pulse

The drop target placeholder pulses to indicate where the card will land:

```css
/* Drop placeholder pulse animation */
[data-drop-placeholder] {
  animation: placeholder-pulse 1s ease-in-out infinite;
  border: 2px dashed var(--color-primary);
  border-radius: var(--radius-md);
  background: rgba(99, 102, 241, 0.06);
}

@keyframes placeholder-pulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  [data-drop-placeholder] { animation: none; opacity: 0.8; }
}
```

### 6.4 Column Reflow via Flip

When a card moves between columns, use Flip to animate remaining cards into their new positions:

```typescript
// Before dropping card into new column:
const state = Flip.getState('[data-kanban-card]')

// ... update React state / DOM ...

Flip.from(state, {
  duration: 0.35,
  ease: 'power2.out',
  stagger: 0.02,
  absolute: true, // Cards reflow via absolute positioning during animation
})
```

---

## 7. Modal / Dialog Animations

### Strategy

Modals appear from the trigger element's position (or center of screen if no clear trigger). The backdrop blurs in to create depth. Exit reverses the sequence.

```typescript
// packages/frontend/src/hooks/useModalAnimation.ts
export function useModalAnimation() {
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef    = useRef<HTMLDivElement>(null)

  const open = useCallback((triggerRect?: DOMRect) => {
    const tl = gsap.timeline()

    // Backdrop: fade + blur
    tl.fromTo(
      backdropRef.current,
      { opacity: 0, backdropFilter: 'blur(0px)' },
      { opacity: 1, backdropFilter: 'blur(8px)', duration: 0.25, ease: 'power2.out' }
    )

    // Panel: scale from 0.92 with slight vertical offset
    tl.fromTo(
      panelRef.current,
      { opacity: 0, scale: 0.92, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.2)' },
      '-=0.15' // Overlap with backdrop
    )
  }, [])

  const close = useCallback(): Promise<void> => {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve })

      tl.to(panelRef.current, {
        opacity: 0,
        scale: 0.94,
        y: 8,
        duration: 0.2,
        ease: 'power2.in',
      })
      tl.to(
        backdropRef.current,
        { opacity: 0, backdropFilter: 'blur(0px)', duration: 0.2, ease: 'none' },
        '-=0.1'
      )
    })
  }

  return { backdropRef, panelRef, open, close }
}
```

### Keyboard Shortcut: Escape

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close().then(() => setIsOpen(false))
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [close])
```

---

## 8. Empty States

### Animation Pattern

Empty state illustrations use a **gentle breathing float** — slow, sine-wave vertical movement. This communicates "nothing here yet" without feeling broken. The copy uses a typewriter effect only for the first empty state on a fresh account (not on repeated visits — it would become annoying).

```typescript
// packages/frontend/src/components/EmptyState.tsx
import { useRef, useEffect } from 'react'
import gsap from '../lib/gsap'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  cta: React.ReactNode
  animate?: boolean
}

export function EmptyState({ icon, title, description, cta, animate = true }: EmptyStateProps) {
  const iconRef        = useRef<HTMLDivElement>(null)
  const containerRef   = useRef<HTMLDivElement>(null)

  // Floating / breathing animation on the icon
  useEffect(() => {
    if (!animate || !iconRef.current) return

    const tween = gsap.to(iconRef.current, {
      y: -8,
      duration: 2.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    return () => { tween.kill() }
  }, [animate])

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current) return
    const children = containerRef.current.children

    gsap.fromTo(
      children,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      }
    )
  }, [])

  return (
    <div ref={containerRef} className="empty-state">
      <div ref={iconRef} className="empty-state-icon">
        {icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      <div className="empty-state-cta">{cta}</div>
    </div>
  )
}
```

### Typewriter for First-Time Experience Only

```typescript
// packages/frontend/src/hooks/useTypewriter.ts
// Only plays once — stored in localStorage after first display
export function useTypewriter(text: string, speed = 40) {
  const ref     = useRef<HTMLHeadingElement>(null)
  const hasPlayed = useRef(false)

  useEffect(() => {
    const key = `typewriter-${btoa(text)}`
    if (localStorage.getItem(key) || !ref.current) return
    if (hasPlayed.current) return

    hasPlayed.current = true
    const el   = ref.current
    el.textContent = ''

    // GSAP approach: animate character by character with a quick stagger
    const chars = text.split('')
    const spans = chars.map((char) => {
      const s = document.createElement('span')
      s.textContent = char
      el.appendChild(s)
      return s
    })

    gsap.fromTo(
      spans,
      { opacity: 0 },
      {
        opacity: 1,
        stagger: speed / 1000,
        ease: 'none',
        onComplete: () => localStorage.setItem(key, '1'),
      }
    )
  }, [text, speed])

  return ref
}
```

---

## 9. Celebrations

### 9.1 Task Completion Micro-Confetti

Exactly 5 particles. Brand colors. 800ms total. Subtle — this plays on EVERY completion, so it must never feel excessive.

```typescript
// packages/frontend/src/lib/confetti.ts
import gsap from './gsap'

const BRAND_COLORS = ['#6366F1', '#818CF8', '#10B981', '#F59E0B', '#3B82F6']

interface Particle {
  el: HTMLDivElement
  x: number
  y: number
}

export function burstConfetti(originRect: DOMRect): void {
  const container = document.getElementById('confetti-container')
  if (!container) return

  const originX = originRect.left + originRect.width / 2
  const originY = originRect.top + originRect.height / 2

  const particles: Particle[] = Array.from({ length: 5 }, (_, i) => {
    const el = document.createElement('div')
    el.style.cssText = `
      position: fixed;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${BRAND_COLORS[i % BRAND_COLORS.length]};
      pointer-events: none;
      z-index: 9999;
      left: ${originX}px;
      top: ${originY}px;
    `
    container.appendChild(el)

    // Spread particles in a fan above the checkbox
    const angle   = -120 + i * 60 // -120° to +120° fan
    const radians = (angle * Math.PI) / 180
    const dist    = 40 + Math.random() * 30

    return {
      el,
      x: Math.cos(radians) * dist,
      y: Math.sin(radians) * dist - 20, // Bias upward
    }
  })

  // Launch
  particles.forEach(({ el, x, y }) => {
    gsap.to(el, {
      x,
      y,
      opacity: 0,
      scale: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => el.remove(),
    })
  })
}
```

**Required DOM in App root:**

```html
<div id="confetti-container" style="position:fixed;inset:0;pointer-events:none;z-index:9999" />
```

### 9.2 Progress Ring Fill Animation

```typescript
// packages/frontend/src/components/ProgressRing.tsx
export function ProgressRing({ progress, size = 48, strokeWidth = 4 }: ProgressRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const radius    = (size - strokeWidth) / 2
  const circumf   = 2 * Math.PI * radius

  useEffect(() => {
    if (!circleRef.current) return
    const dashOffset = circumf - (progress / 100) * circumf

    gsap.to(circleRef.current, {
      strokeDashoffset: dashOffset,
      duration: 0.6,
      ease: 'power2.out',
    })
  }, [progress, circumf])

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border-default)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        ref={circleRef}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumf}
        strokeDashoffset={circumf} /* Starts at 0% */
      />
    </svg>
  )
}
```

### 9.3 Streak Milestone

Streak milestones (3-day, 7-day, 30-day) show a larger celebration. This plays rarely, so it can be more dramatic:

```typescript
export function celebrateStreak(milestoneEl: HTMLElement) {
  const tl = gsap.timeline()

  // Badge bounces in
  tl.fromTo(milestoneEl,
    { scale: 0, rotation: -15 },
    { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }
  )

  // Badge pulses
  tl.to(milestoneEl, { scale: 1.1, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 })

  // Larger confetti burst (12 particles, wider spread)
  burstConfettiLarge(milestoneEl.getBoundingClientRect())
}
```

---

## 10. Loading States

### 10.1 Skeleton Shimmer

Skeletons use a gradient sweep animation that communicates "data is being fetched." Pure CSS — GSAP not needed here.

```css
/* packages/frontend/src/styles/skeleton.css */
@keyframes skeleton-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--skeleton-base)       25%,
    var(--skeleton-highlight)  50%,
    var(--skeleton-base)       75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

/* Light mode */
:root {
  --skeleton-base:      #E5E7EB;
  --skeleton-highlight: #F3F4F6;
}

/* Dark mode */
.dark {
  --skeleton-base:      #2D3140;
  --skeleton-highlight: #363B4D;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--skeleton-base);
  }
}
```

### 10.2 Skeleton to Content Transition

When real data loads, skeleton elements cross-fade to content using GSAP:

```typescript
// packages/frontend/src/hooks/useSkeletonTransition.ts
export function useSkeletonTransition(isLoading: boolean) {
  const contentRef  = useRef<HTMLDivElement>(null)
  const skeletonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && contentRef.current && skeletonRef.current) {
      const tl = gsap.timeline()

      // Skeleton fades out
      tl.to(skeletonRef.current, { opacity: 0, duration: 0.2, ease: 'none' })

      // Content items stagger in
      const items = contentRef.current.querySelectorAll('[data-task-item]')
      tl.fromTo(
        items,
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        '-=0.1'
      )
    }
  }, [isLoading])

  return { contentRef, skeletonRef }
}
```

### 10.3 Top Progress Bar

For bulk operations (bulk complete, import), show a thin progress bar at the top:

```typescript
// packages/frontend/src/components/TopProgressBar.tsx
export function TopProgressBar({ progress }: { progress: number }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.to(barRef.current, {
      scaleX: progress / 100,
      transformOrigin: 'left center',
      duration: 0.3,
      ease: 'power2.out',
    })
  }, [progress])

  return (
    <div
      ref={barRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--color-primary)',
        transformOrigin: 'left center',
        scaleX: 0,
        zIndex: 9999,
      }}
    />
  )
}
```

---

## 11. Scroll Animations

### 11.1 Count-Up on Scroll

Stats/numbers in the app (e.g., "42 tasks completed this week") count up when they scroll into view. Communicates accomplishment.

```typescript
// packages/frontend/src/hooks/useCountUp.ts
import { useRef, useEffect } from 'react'
import { gsap } from '../lib/gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function useCountUp(target: number, suffix = '') {
  const elRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const counter = { value: 0 }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true, // Only plays once
      onEnter: () => {
        gsap.to(counter, {
          value: target,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${Math.round(counter.value)}${suffix}`
          },
        })
      },
    })

    return () => trigger.kill()
  }, [target, suffix])

  return elRef
}
```

### 11.2 Cards Fade-Slide on First View

In dashboard/stats sections, cards fade and slide up when first scrolled into view:

```typescript
// packages/frontend/src/hooks/useScrollReveal.ts
export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const items = containerRef.current?.querySelectorAll('[data-reveal]')
      if (!items?.length) return

      items.forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: item,
              start: 'top 88%',
              once: true,
            },
          }
        )
      })
    },
    { scope: containerRef }
  )

  return containerRef
}
```

**Usage**: Add `data-reveal` attribute to any element that should fade in on scroll.

```tsx
<div data-reveal className="stat-card">...</div>
```

### ScrollTrigger Cleanup on Route Change

```typescript
// packages/frontend/src/hooks/useScrollTriggerCleanup.ts
import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLocation } from 'react-router-dom'

export function useScrollTriggerCleanup() {
  const location = useLocation()

  useEffect(() => {
    // Kill all triggers on route change, then refresh
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    ScrollTrigger.refresh()
  }, [location.pathname])
}
```

---

## 12. prefers-reduced-motion

### Strategy

GSAP's global `timeScale(1000)` (set in `gsap.ts`) effectively disables all GSAP animations. CSS animations must be handled separately with `@media` queries.

### CSS Layer

```css
/* All CSS animations must have a reduced-motion variant */
@media (prefers-reduced-motion: reduce) {
  /* Disable all transitions and animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Exception: opacity transitions are acceptable (not motion-based) */
  [data-fade-ok] {
    transition-duration: 200ms !important;
  }
}
```

### GSAP Layer (already handled in `gsap.ts`)

```typescript
// From Section 1 — already applied globally:
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(1000) // All animations complete instantly
}
```

### Component-Level Guard

For animations that absolutely must not play (like celebration confetti):

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function handleComplete() {
  // Always update state
  onComplete(taskId)

  // Only animate if motion is OK
  if (!prefersReducedMotion) {
    burstConfetti(checkboxEl.getBoundingClientRect())
  }
}
```

### User Settings Override

Add a toggle in FlowTask settings (`/settings`) so users can disable animations independently of OS setting:

```typescript
// In useUIStore (Zustand)
interface UIState {
  reducedMotion: boolean // User override — persisted
  setReducedMotion: (val: boolean) => void
}

// On store rehydration:
onRehydrateStorage: () => (state) => {
  if (state?.reducedMotion) {
    gsap.globalTimeline.timeScale(1000)
  }
}
```

---

## 13. React Integration Patterns

### 13.1 useGSAP Hook — Primary Pattern

Always prefer `useGSAP` from `@gsap/react` over raw `useEffect`. It handles cleanup automatically and scopes selectors to the container:

```typescript
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from '../lib/gsap'

function MyComponent({ items }: { items: Item[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Selectors are scoped to containerRef — no global pollution
      gsap.from('.item', {
        opacity: 0,
        y: 10,
        stagger: 0.05,
        duration: 0.2,
      })

      // Returned cleanup functions are called automatically on unmount
      // or when dependencies change
    },
    {
      scope: containerRef,
      dependencies: [items.length], // Re-runs when item count changes
    }
  )

  return (
    <div ref={containerRef}>
      {items.map((item) => (
        <div key={item.id} className="item">{item.title}</div>
      ))}
    </div>
  )
}
```

### 13.2 Timeline Refs — For Imperative Control

Store timelines in refs (not state) to avoid re-renders:

```typescript
function AnimatedPanel() {
  const tlRef    = useRef<gsap.core.Timeline | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Create timeline — paused by default for imperative control
      tlRef.current = gsap.timeline({ paused: true })
        .to(panelRef.current, { x: 0, duration: 0.3, ease: 'power4.out' })
    },
    { scope: panelRef }
  )

  const open  = () => tlRef.current?.play()
  const close = () => tlRef.current?.reverse()

  return <div ref={panelRef} style={{ transform: 'translateX(-100%)' }}>...</div>
}
```

### 13.3 Cleanup Rules

```typescript
// BAD — leaks tweens, causes memory issues
useEffect(() => {
  gsap.to('.element', { opacity: 1 })
}, [])

// GOOD — useGSAP handles cleanup automatically
useGSAP(() => {
  gsap.to('.element', { opacity: 1 })
}, { scope: containerRef })

// GOOD — explicit cleanup for standalone effects
useEffect(() => {
  const tween = gsap.to(el.current, { y: -8, yoyo: true, repeat: -1 })
  return () => tween.kill() // Always kill on unmount
}, [])
```

### 13.4 Framer Motion + GSAP Coexistence

FlowTask already uses Framer Motion. Division of responsibility:

| Use Framer Motion for | Use GSAP for |
|---|---|
| `AnimatePresence` (enter/exit with React unmount) | Multi-step sequenced timelines |
| Simple layout animations (`layout` prop) | DrawSVG (checkmark drawing) |
| Gesture-based animations (`drag`, `whileHover`) | Flip (DOM reflow animations) |
| Declarative motion (`animate`, `variants`) | ScrollTrigger |
| Spring physics on hover/tap | Celebration confetti |

**Rule**: Don't mix Framer Motion and GSAP on the same element simultaneously. Pick one per element.

---

## Animation Decision Tree

```
Does the animation involve:
  ├── React component mount/unmount?
  │     └── Use Framer Motion AnimatePresence
  ├── Layout reflow (items moving to new positions)?
  │     └── Use GSAP Flip
  ├── SVG stroke drawing?
  │     └── Use GSAP DrawSVG
  ├── Scroll trigger?
  │     └── Use GSAP ScrollTrigger
  ├── Multi-step choreography (3+ steps in sequence)?
  │     └── Use GSAP Timeline
  ├── Simple CSS property change on hover/tap?
  │     └── Use CSS transition (no JS needed)
  └── Single property tween with React state dependency?
        └── Use Framer Motion motion value or useGSAP
```

---

## Package Dependencies

```json
{
  "dependencies": {
    "gsap": "^3.12.5",
    "@gsap/react": "^2.1.1"
  }
}
```

> **DrawSVG** is a GSAP Club plugin (requires a paid license). For the open-source version, implement checkmark drawing with CSS `stroke-dashoffset` animation instead:
>
> ```css
> .checkbox-check {
>   stroke-dasharray: 20;
>   stroke-dashoffset: 20;
>   transition: stroke-dashoffset 200ms ease-out;
> }
> .checkbox-check.drawn {
>   stroke-dashoffset: 0;
> }
> ```
>
> Then toggle the `drawn` class in the GSAP timeline `onStart` callback. This achieves the same effect without a Club license.

---

*Document version: 1.0 | Feb 23, 2026 | designer-motion-2*
