# World-Class Todo App UI/UX Research

> Comprehensive research document for the FlowTask UI overhaul. Covers patterns from Todoist, Things 3, TickTick, Linear, Notion, Apple Reminders, Any.do, and award-winning designs.

---

## Table of Contents

1. [What Makes Premium Todo Apps Stand Out](#1-what-makes-premium-todo-apps-stand-out)
2. [Visual Design System](#2-visual-design-system)
3. [Layout & Navigation Patterns](#3-layout--navigation-patterns)
4. [Task Card Design](#4-task-card-design)
5. [Kanban Board Design](#5-kanban-board-design)
6. [Responsive Design Patterns](#6-responsive-design-patterns)
7. [Micro-Interactions & Animations](#7-micro-interactions--animations)
8. [Empty States, Loading States, Error States](#8-empty-states-loading-states-error-states)
9. [Dark Mode](#9-dark-mode)
10. [Accessibility](#10-accessibility)
11. [Recommendations for FlowTask](#11-recommendations-for-flowtask)

---

## 1. What Makes Premium Todo Apps Stand Out

### Things 3 — The Gold Standard of Minimalism
- **Philosophy**: "A joy to use and beautiful to look at." Extreme attention to detail in every pixel.
- **Key differentiator**: Generous whitespace that lets content breathe. When you open a task, it smoothly transforms into a clear white piece of paper — fields are tucked away until needed. Zero distractions.
- **Typography**: Custom fonts for clarity, vector graphics for all icons, layout fine-tuned so everything scales together beautifully.
- **Feel**: Calm, distraction-free, almost meditative. The restraint IS the design.

### Linear — The Engineer's Dream
- **Philosophy**: Professional, power-user-focused, keyboard-first.
- **Key differentiator**: Rebuilt their entire color system using **LCH color space** (instead of HSL) for perceptually uniform colors. Only need 3 variables per theme: base color, accent color, contrast.
- **Design language**: Dark mode default, bold typography, complex gradients, glassmorphism, high contrast. Uses Inter font.
- **Navigation**: Reduced visual noise in sidebar, tabs, headers. Supports list, board, timeline, split, and fullscreen display modes.
- **Influence**: Spawned the "Linear design" trend across SaaS — dark backgrounds, linear gradients, blurs, micro-motion effects.

### Todoist — The Accessible Powerhouse
- **Philosophy**: Practically zero learning curve. Clean, list-based, effective whitespace.
- **Key differentiator**: Natural language processing for task entry, AI assistant for brainstorming and breaking down projects.
- **Visual style**: Playful red accent color, vibrant interface, clear visual hierarchy.
- **Brand colors**: Zeus (#25221E) for reliability, Fantasy (#FEFDFC) for clarity, blue (#2C7CEC) for interactive elements.

### Notion — The Flexible Canvas
- **Philosophy**: Everything is a block. Infinite flexibility.
- **Key differentiator**: Design system based on composable design tokens — colors, typography, spacing, shadows all tokenized.
- **Approach**: Content-first, minimal chrome, the UI disappears to let you focus on your work.

### Award-Winning Designs (2025-2026)
- **Tiimo** (Apple iPhone App of the Year 2025): Daily agenda with priority-based task organization. 4.6 rating with 14,000 reviews.
- **Next Up**: Artistic gradients, energetic color accents, gamification through challenges and competitive features. Extensive dashboard for tracking tasks, goals, and progress.

---

## 2. Visual Design System

### Color Palette Strategy

#### Light Mode Foundation
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#FFFFFF` | Main content background |
| `--bg-secondary` | `#F8F9FA` | Sidebar, panels |
| `--bg-tertiary` | `#F1F3F5` | Hover states, cards |
| `--text-primary` | `#1A1A2E` | Headings, primary text |
| `--text-secondary` | `#6B7280` | Secondary text, labels |
| `--text-tertiary` | `#9CA3AF` | Placeholders, hints |
| `--border-default` | `#E5E7EB` | Dividers, card borders |
| `--border-subtle` | `#F3F4F6` | Subtle separators |

#### Dark Mode Foundation
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0F1117` | Main background (NOT pure black) |
| `--bg-secondary` | `#1A1D27` | Sidebar, panels |
| `--bg-tertiary` | `#252836` | Cards, hover states |
| `--text-primary` | `#E8EAED` | Headings (NOT pure white) |
| `--text-secondary` | `#9AA0A6` | Secondary text |
| `--text-tertiary` | `#5F6368` | Placeholders |
| `--border-default` | `#2D3140` | Dividers |
| `--border-subtle` | `#1E2130` | Subtle separators |

#### Accent Colors (Priority System)
| Priority | Light Mode | Dark Mode | Name |
|----------|-----------|-----------|------|
| Urgent (P1) | `#EF4444` | `#F87171` | Red |
| High (P2) | `#F59E0B` | `#FBBF24` | Amber |
| Medium (P3) | `#3B82F6` | `#60A5FA` | Blue |
| Low (P4) | `#6B7280` | `#9CA3AF` | Gray |

#### Semantic Colors
| Purpose | Light | Dark |
|---------|-------|------|
| Success | `#10B981` | `#34D399` |
| Warning | `#F59E0B` | `#FBBF24` |
| Error | `#EF4444` | `#F87171` |
| Info | `#3B82F6` | `#60A5FA` |
| Primary action | `#6366F1` | `#818CF8` | (Indigo — distinctive, premium)

### Typography System

**Recommended Font Stack**: Inter for body, Manrope for headings (or Inter for both with weight contrast).

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display | 36px | 700 | 1.2 | -0.02em | Hero sections |
| H1 | 28px | 700 | 1.3 | -0.02em | Page titles |
| H2 | 22px | 600 | 1.35 | -0.01em | Section headings |
| H3 | 18px | 600 | 1.4 | -0.01em | Card titles |
| Body L | 16px | 400 | 1.6 | 0 | Primary content |
| Body M | 14px | 400 | 1.5 | 0 | Secondary content |
| Body S | 13px | 400 | 1.5 | 0.01em | Captions, metadata |
| Label | 12px | 500 | 1.4 | 0.02em | Tags, badges |
| Micro | 11px | 500 | 1.3 | 0.03em | Timestamps |

### Spacing Scale (4px base grid)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps, icon padding |
| `--space-2` | 8px | Default gap between small elements |
| `--space-3` | 12px | Compact padding |
| `--space-4` | 16px | Standard padding, card internal |
| `--space-5` | 20px | Section gap |
| `--space-6` | 24px | Card external spacing |
| `--space-8` | 32px | Large section gaps |
| `--space-10` | 40px | Page-level spacing |
| `--space-12` | 48px | Major section breaks |
| `--space-16` | 64px | Page margins |

### Elevation / Shadow System

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift (tags, chips) |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Cards at rest |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` | Cards on hover, dropdowns |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Modals, floating panels |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)` | Drag state |

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Buttons, inputs, tags |
| `--radius-md` | 8px | Cards, dropdowns |
| `--radius-lg` | 12px | Modals, panels |
| `--radius-xl` | 16px | Large containers |
| `--radius-full` | 9999px | Avatars, pills |

---

## 3. Layout & Navigation Patterns

### Desktop Layout (>1024px): Three-Panel Architecture

```
+------------------+----------------------------+------------------+
|    Sidebar        |     Main Content           |  Detail Panel    |
|    (240-280px)    |     (flexible)             |  (320-400px)     |
|                   |                            |  (collapsible)   |
| [Logo]            | [Breadcrumb / Page Title]  |                  |
| [Quick Add]       | [Filters / View Controls]  | [Task Title]     |
| [Navigation]      |                            | [Description]    |
|  - Inbox          | [Task List / Board]        | [Subtasks]       |
|  - Today          |                            | [Comments]       |
|  - Upcoming       |                            | [Activity]       |
|  - Projects       |                            |                  |
|  - Labels/Tags    |                            |                  |
|                   |                            |                  |
| [Settings]        |                            |                  |
+------------------+----------------------------+------------------+
```

**Key patterns from premium apps:**
- **Sidebar**: Collapsible (icon-only mode at 56-64px width). Smooth 200ms transition.
- **Detail panel**: Slides in from right on task click. Can be pinned open or auto-close.
- **Things 3 approach**: No detail panel — tasks expand inline into a "paper" view.
- **Linear approach**: Split view — list on left, detail on right, resizable divider.

### Sidebar Navigation Best Practices

1. **Group items semantically**: Views (Inbox, Today, Upcoming) → Projects → Labels/Tags
2. **Collapse groups** with smooth accordion animation
3. **Show task counts** as muted badges (e.g., "Inbox 12")
4. **Active state**: Subtle background highlight + left accent border (3px)
5. **Hover state**: Background tint at 4% opacity of accent color
6. **Drag to reorder** projects with grabber handle on hover
7. **Quick add button**: Prominent, always visible, with keyboard shortcut hint (Ctrl+N)

### View Controls Toolbar

```
[List ▼] [Board] [Calendar] | [Sort: Due Date ▼] [Filter ▼] [Group: Priority ▼] | [Search 🔍]
```

- Toggle between views with smooth crossfade transition
- Active view button has filled/solid style; inactive has ghost/outline style
- Filters show as removable pills/chips below the toolbar

---

## 4. Task Card Design

### List View Task Row

```
┌─────────────────────────────────────────────────────────────┐
│ ○  Buy groceries for dinner            🏷 personal   📅 Today │
│    ├─ 2/5 subtasks                     ⬆ High         @me  │
└─────────────────────────────────────────────────────────────┘
```

**Component breakdown:**
- **Checkbox**: Custom circular checkbox with priority-colored border
  - P1 (Urgent): Red border `#EF4444`
  - P2 (High): Amber border `#F59E0B`
  - P3 (Medium): Blue border `#3B82F6`
  - P4 (Low/None): Gray border `#D1D5DB`
- **Title**: 14-16px, medium weight, truncated with ellipsis if too long
- **Metadata row**: 12-13px, muted color, icons + text
- **Tags**: Pill-shaped with colored dot, rounded-full, subtle background
- **Due date**: Color-coded (overdue=red, today=orange, upcoming=gray)
- **Assignee**: Small avatar (24px), overlapping if multiple
- **Hover state**: Subtle background + reveal action icons (edit, delete, drag handle)

### Task Card (Board View)

```
┌─────────────────────────────────┐
│ ⬆ High                    •••  │
│                                 │
│ Design new landing page         │
│                                 │
│ 🏷 design  🏷 frontend          │
│                                 │
│ ─────────────────── 60%         │
│                                 │
│ 📅 Feb 28    👤 AZ    💬 3      │
└─────────────────────────────────┘
```

**Design principles:**
- **Card padding**: 16px (4-unit grid)
- **Card gap**: 8-12px between cards
- **Border radius**: 8px
- **Shadow at rest**: `shadow-sm`
- **Shadow on hover**: `shadow-md` + slight translateY(-2px)
- **Shadow while dragging**: `shadow-xl` + scale(1.02) + rotation(2deg)
- **Priority indicator**: Colored left border (3px) or top-left badge
- **Progress bar**: Thin (3px), rounded, colored by completion %
- **Metadata**: Bottom row with icon + text, muted colors

---

## 5. Kanban Board Design

### Column Layout

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  To Do (5)   │  │ In Progress  │  │  In Review   │  │   Done ✓     │
│              │  │    (3)       │  │    (2)       │  │    (8)       │
│ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │
│ │  Card 1  │ │  │ │  Card 4  │ │  │ │  Card 7  │ │  │ │  Card 9  │ │
│ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │
│ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │             │
│ │  Card 2  │ │  │ │  Card 5  │ │  │ │  Card 8  │ │  │  + Add task │
│ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │             │
│ ┌─────────┐ │  │ ┌─────────┐ │  │             │  │             │
│ │  Card 3  │ │  │ │  Card 6  │ │  │  + Add task │  │             │
│ └─────────┘ │  │ └─────────┘ │  │             │  │             │
│             │  │             │  │             │  │             │
│  + Add task │  │  + Add task │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### Column Design Specifications

| Element | Specification |
|---------|--------------|
| Column width | 280-320px (fixed, horizontal scroll if needed) |
| Column gap | 16-20px |
| Column background | Slightly lighter/darker than page bg |
| Column border-radius | 12px |
| Column padding | 12px |
| Header font | 14px, semibold, with task count badge |
| Add task button | Ghost style, dashed border or simple "+ Add task" text |

### Drag & Drop Visual Feedback

1. **Grab handle**: 6 dots (⠿) visible on card hover, left side
2. **Dragging card**:
   - Opacity reduced to 60% at original position
   - Dragged copy has `shadow-xl`, slight rotation (1-3deg), `scale(1.03)`
   - Cursor: `grabbing`
3. **Drop target indicator**:
   - Thin accent-colored line (2-3px) between cards where it will drop
   - OR: empty space opens up with dashed border placeholder
4. **Column hover**: Subtle background color change when dragging over
5. **Invalid drop**: Cards snap back with spring animation

---

## 6. Responsive Design Patterns

### Breakpoint System

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Desktop XL | ≥1440px | 3-panel (sidebar + content + detail) |
| Desktop | ≥1024px | 2-panel (sidebar + content), detail as overlay |
| Tablet | ≥768px | Collapsible sidebar (overlay), full-width content |
| Mobile | <768px | Bottom navigation, stacked views, no sidebar |

### Desktop (≥1024px)
- Full sidebar visible (can be collapsed)
- Task list/board fills remaining width
- Detail panel slides in from right (320-400px)
- Keyboard shortcuts fully active
- Hover states enabled

### Tablet (768px-1023px)
- Sidebar hidden by default, opens as overlay from left
- Hamburger menu icon in top-left
- Task list/board is full-width
- Detail view opens as a full-width overlay that slides up
- Touch targets enlarged to 44x44px minimum
- Swipe gestures: left to delete, right to complete

### Mobile (<768px)
- **Bottom navigation bar** with 4-5 items:
  ```
  [Inbox] [Today] [Projects] [Board] [Settings]
  ```
- No sidebar — navigation is bottom bar + drill-down
- Task list is full-width, single column
- Kanban board scrolls horizontally (single column visible at a time)
- Task detail opens as a bottom sheet (slide-up modal, 80% height)
- FAB (Floating Action Button) for quick task creation
- Pull-to-refresh for task list
- Touch targets: minimum 48x48px (exceeds WCAG 24px minimum)

### Adaptive Component Patterns

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Navigation | Sidebar | Overlay sidebar | Bottom bar |
| Task list | Compact rows | Medium rows | Large touch rows |
| Kanban | All columns visible | 2-3 columns | 1 column + swipe |
| Task detail | Side panel | Full overlay | Bottom sheet |
| Quick add | Top bar input | Top bar input | FAB → modal |
| Filters | Inline toolbar | Collapsible toolbar | Modal filter sheet |

---

## 7. Micro-Interactions & Animations

### Timing Guidelines (from industry research)

| Animation Type | Duration | Easing |
|---------------|----------|--------|
| Hover feedback | 100-150ms | `ease-out` |
| Button press | 100ms | `ease-in-out` |
| Checkbox completion | 300-400ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Panel slide-in | 200-300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Modal open | 200-250ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Page transition | 250-350ms | `ease-in-out` |
| Drag feedback | Immediate (0ms) | Spring physics |
| Toast notification | 300ms in, 200ms out | `ease-out` |
| Context change | 600-800ms | `ease-in-out` |

### Key Micro-Interactions to Implement

#### 1. Checkbox Animation (Critical — the most-used interaction)
- **Idle**: Empty circle with priority-colored border
- **Hover**: Circle fills slightly (10% opacity of priority color)
- **Click**:
  1. Circle fills with priority color (100ms)
  2. Checkmark draws in with stroke-dashoffset animation (200ms)
  3. Optional: small burst of confetti particles (200ms, 4-6 particles)
  4. Task text gets strikethrough with fade animation (200ms)
  5. Task row fades to 50% opacity, then slides out after 1s delay

#### 2. Task Addition
- New task slides in from top with slight bounce
- Input field appears with expand animation
- On submit: task card materializes with scale(0.95→1.0) + opacity(0→1)

#### 3. Drag and Drop
- Pickup: Card lifts with shadow increase + slight scale
- Move: Physics-based following (slight delay creates "weight")
- Drop: Card settles into position with spring animation (overshoot + settle)
- Other cards: Smoothly rearrange with 200ms transitions

#### 4. Sidebar Collapse
- Width animates from 240px → 56px (200ms)
- Text labels fade out (100ms), icons remain centered
- Main content expands to fill space simultaneously

#### 5. View Transitions (List → Board → Calendar)
- Crossfade with shared element transitions where possible
- Cards morph from list rows to board cards

#### 6. Hover States
- Task row: Background color change at 4% opacity (100ms)
- Buttons: Slight darken/lighten + optional translateY(-1px)
- Cards: Shadow elevation increase + translateY(-2px) (150ms)
- Links: Color shift + optional underline slide-in from left

---

## 8. Empty States, Loading States, Error States

### Empty States Design

**Principles (from SetProduct research):**
1. Concise headline (visually dominant)
2. Supporting description (lighter, smaller)
3. Relevant illustration or icon (adds personality without dominating)
4. Clear call-to-action button

**Examples for FlowTask:**

#### Empty Inbox
```
    ┌─────────────────────────────┐
    │                             │
    │     📥 (subtle icon)        │
    │                             │
    │   All caught up!            │  ← 18px, semibold
    │   Tasks you add will        │  ← 14px, muted
    │   appear here.              │
    │                             │
    │   [+ Create a task]         │  ← Primary CTA button
    │                             │
    └─────────────────────────────┘
```

#### Empty Project
```
    "This project is a blank canvas."
    "Add your first task to get started."
    [+ Add a task]
```

#### Empty Board
```
    "Your board is ready."
    "Create tasks and organize them into columns."
    [+ Create a task]
```

#### No Search Results
```
    "No tasks match your search."
    "Try different keywords or clear filters."
    [Clear filters]
```

**Illustration style**: Simple line art or duotone icons. NOT clipart. Think Things 3 minimalism — subtle, elegant, and on-brand. Consider animated SVG illustrations (gentle floating motion).

### Loading States

#### Skeleton Screens (preferred over spinners)

```
┌─────────────────────────────────────────────────┐
│ ◯  ████████████████████          ███  ██████    │  ← shimmer animation
│ ◯  ██████████████                ███  ████      │     left-to-right
│ ◯  ████████████████████████      ███  ████████  │     gradient sweep
│ ◯  ████████████                  ███  ██████    │
└─────────────────────────────────────────────────┘
```

**Implementation specs:**
- Background: `#E5E7EB` (light) / `#2D3140` (dark)
- Shimmer: Linear gradient sweeping left-to-right, 1.5s cycle, infinite
- Shape: Match actual content layout (circle for avatars, rectangles for text)
- Border radius: Match actual elements

#### Other Loading Patterns
- **Inline spinner**: Small (16-20px) spinner next to action buttons during API calls
- **Progress bar**: Thin (2-3px) accent-colored bar at top of page for bulk operations
- **Optimistic updates**: Show the result immediately, rollback on error

### Error States

```
┌─────────────────────────────────┐
│  ⚠ Couldn't load your tasks     │
│  Check your connection and       │
│  try again.                      │
│                                  │
│  [Retry]    [Go offline]         │
└─────────────────────────────────┘
```

**Principles:**
- Never show raw error codes to users
- Provide actionable next steps
- Use warm, human language ("Couldn't" not "Error 500")
- Inline errors for form fields (red border + helper text below)
- Toast notifications for transient errors (auto-dismiss after 5s)
- Full-page error only for catastrophic failures

---

## 9. Dark Mode

### Design Principles (from research)

1. **Never use pure black (#000000)** — Use dark grays like `#0F1117` or `#1A1D27`
2. **Never use pure white (#FFFFFF) for text** — Use `#E8EAED` or similar off-white
3. **Reduce white-on-dark contrast** — The extreme contrast causes eye strain
4. **Elevate surfaces with lighter shades** — Higher elevation = lighter surface (not shadows)
5. **Desaturate colors slightly** — Vibrant colors that work on white can be jarring on dark backgrounds. Shift accent colors toward lighter/less saturated variants.
6. **Use the LCH color space** (Linear's approach) — Perceptually uniform color generation

### Dark Mode Surface Hierarchy

| Level | Color | Usage |
|-------|-------|-------|
| Background | `#0F1117` | Page background |
| Surface 1 | `#1A1D27` | Sidebar, panels |
| Surface 2 | `#252836` | Cards, dropdowns |
| Surface 3 | `#2D3140` | Hover states |
| Surface 4 | `#363B4D` | Active/selected states |
| Overlay | `rgba(0,0,0,0.6)` | Modal backdrop |

### Theme Switching
- Respect OS preference via `prefers-color-scheme` media query
- Allow manual override (Light / Dark / System toggle)
- Smooth transition: 200ms on `background-color` and `color` properties
- Store preference in localStorage and sync across sessions
- Consider scheduled switching (auto-dark after sunset)

---

## 10. Accessibility

### WCAG 2.2 Requirements

#### Color Contrast
- **Normal text (<18px)**: Minimum 4.5:1 contrast ratio (AA)
- **Large text (≥18px bold or ≥24px)**: Minimum 3:1 (AA)
- **UI components**: Minimum 3:1 against adjacent colors
- **Never rely on color alone** — Always pair with icons, text, or patterns

#### Focus Indicators
- **Visible focus ring**: 2px solid accent color with 2px offset
- **Contrast**: Focus indicator must have 3:1 contrast against adjacent colors
- **Never remove outlines** without providing a custom focus style
- **Focus-visible**: Use `:focus-visible` to show focus only on keyboard navigation

#### Touch Targets
- **Minimum size**: 24×24px (WCAG 2.2 Level AA)
- **Recommended size**: 44×44px (Apple HIG) / 48×48px (Material)
- **Spacing**: Minimum 8px between adjacent touch targets
- **For FlowTask**: Use 44×44px minimum on mobile, 32×32px on desktop

#### Keyboard Navigation
- All interactive elements reachable via Tab
- Logical tab order following visual layout
- Escape closes modals/dropdowns
- Arrow keys navigate within lists/menus
- Enter/Space activates buttons and checkboxes
- Keyboard shortcuts for power users (with discoverable hints)

#### Screen Reader Support
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`
- ARIA labels on icon-only buttons
- Live regions (`aria-live`) for dynamic content (task counts, notifications)
- Announce drag-and-drop operations
- Descriptive link text (not "Click here")

#### Motion Sensitivity
- Respect `prefers-reduced-motion` media query
- Provide option to disable animations in settings
- When reduced motion: instant transitions, no parallax, no auto-playing animations

---

## 11. Recommendations for FlowTask

### Priority 1 — Foundation (Implement First)

1. **Design tokens in CSS custom properties**: All colors, spacing, typography, shadows, radii as CSS variables. One source of truth. Dark mode is just swapping a set of variables.

2. **Typography system**: Switch to Inter (or keep system font stack). Implement the type scale with consistent sizing/weight/spacing.

3. **Spacing system**: Adopt the 4px grid. Every margin, padding, and gap should be a multiple of 4.

4. **Color system**: Light and dark palettes with semantic tokens (`--color-success`, `--color-error`, not `--color-green`).

### Priority 2 — Layout

5. **Three-panel layout**: Sidebar + main content + detail panel (collapsible).

6. **Responsive breakpoints**: Desktop (3-panel) → Tablet (overlay sidebar) → Mobile (bottom nav + stacked views).

7. **Sidebar**: Collapsible, with smooth transitions, grouped navigation, task count badges.

### Priority 3 — Components

8. **Task card redesign**: Priority-colored checkboxes, metadata row, hover reveal actions, smooth completion animation.

9. **Kanban board polish**: Fixed-width columns, proper card shadows, drag-and-drop with visual feedback, drop indicators.

10. **Empty states**: Every empty view gets an illustration + message + CTA.

11. **Loading skeletons**: Replace any spinners with skeleton screens matching content layout.

### Priority 4 — Polish

12. **Micro-interactions**: Checkbox animation, hover states, transitions between views, drag-and-drop physics.

13. **Dark mode**: Full dark palette with proper surface hierarchy and desaturated accents.

14. **Accessibility audit**: Focus indicators, contrast ratios, touch targets, keyboard navigation, screen reader testing.

---

## Key Takeaways

> **Things 3 teaches us**: Restraint is premium. Generous whitespace, hidden complexity, calm interface.
>
> **Linear teaches us**: Dark mode done right (LCH colors), keyboard-first, multiple view modes, professional density.
>
> **Todoist teaches us**: Zero learning curve, vibrant but not overwhelming, natural language input.
>
> **The research consensus**: 200-400ms for feedback animations, never pure black in dark mode, 4px spacing grid, skeleton loaders over spinners, 44px minimum touch targets, and micro-interactions transform mundane actions into delightful moments.

The goal for FlowTask: Combine Things 3's minimalist elegance with Linear's dark mode sophistication and Todoist's approachability. Create a todo app that feels calm, premium, and fast — where every pixel is intentional and every interaction is satisfying.
