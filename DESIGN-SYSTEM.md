# FlowTask Design System
*Version 1.0 — 2026-02-23*

**Design direction:** Things 3 minimalism + Linear dark mode + Todoist approachability
**Mood:** Calm, premium, fast. Every pixel intentional.
**Stack:** React 19 + Tailwind CSS v4 (`@theme` syntax) + Framer Motion

---

## Table of Contents

1. [Color Palette](#1-color-palette)
2. [Typography](#2-typography)
3. [Spacing](#3-spacing)
4. [Elevation & Shadows](#4-elevation--shadows)
5. [Border Radius](#5-border-radius)
6. [Responsive Breakpoints](#6-responsive-breakpoints)
7. [Component Specs](#7-component-specs)
8. [Implementation — Paste-Ready Code](#8-implementation--paste-ready-code)

---

## 1. Color Palette

### Brand Color

**Primary: Slate Violet** — `#6463F0`
Not blue-500. A medium violet with slight slate warmth. Premium, distinctive, calm.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--color-brand` | `#6463F0` | `#8B89F8` | Primary actions, active nav, focus rings |
| `--color-brand-hover` | `#5452D6` | `#9D9BFA` | Button hover, interactive hover |
| `--color-brand-subtle` | `#EEEEFF` | `rgba(100,99,240,0.12)` | Brand tint backgrounds, selected state |
| `--color-brand-muted` | `#C8C7FA` | `rgba(139,137,248,0.25)` | Brand borders, chip borders |

### Light Mode Semantic Tokens

```
bg-base:        #FAFBFC   Page background (slightly warm white — not pure #fff)
bg-secondary:   #F3F4F8   Sidebar, left panel background
bg-tertiary:    #EBEDF2   Cards at rest, subtle hover backgrounds
bg-hover:       #E2E5EC   Interactive hover (list rows, menu items)
bg-active:      #D9DCE6   Active/pressed states

text-primary:   #1C1D24   Headings, task titles (almost-black with slight violet warmth)
text-secondary: #5C6070   Body copy, descriptions, metadata
text-tertiary:  #8F96A6   Placeholders, hints, timestamps
text-disabled:  #B8BEC9   Disabled inputs, de-emphasized content
text-inverse:   #FFFFFF   Text on brand-colored backgrounds

border-strong:  #D6DAE4   Card borders, input borders (visible but not heavy)
border-subtle:  #E8EAEF   Section dividers, subtle separators
border-focus:   #6463F0   Focus rings (2px solid)

status-online:  #16A34A   Connected indicator
```

### Dark Mode Semantic Tokens — 6-Level Surface Hierarchy

Linear-inspired: higher elevation = lighter surface (no box shadows at depth — color IS the elevation).

```
Level 0  bg-base:      #0D0E14   Page background (deepest, near-black with violet tint)
Level 1  surface-1:    #13151F   Sidebar, navigation panels
Level 2  surface-2:    #1A1D2B   Cards, dropdowns, popovers
Level 3  surface-3:    #222538   Hover states on Level 2 surfaces
Level 4  surface-4:    #2A2E43   Active/selected states, focused inputs
Level 5  surface-5:    #353A52   Tooltips, contextual menus above cards
         overlay:      rgba(0,0,0,0.65)   Modal backdrop

text-primary:   #E4E6F0   Headings (off-white with violet warmth — never pure #fff)
text-secondary: #9299AD   Body copy, secondary labels
text-tertiary:  #5C6278   Placeholders, muted timestamps
text-disabled:  #3E4358   Disabled elements
text-inverse:   #1C1D24   Text on brand-colored (light) backgrounds

border-strong:  #2D3248   Visible card borders, input outlines
border-subtle:  #1E2135   Section dividers only
border-focus:   #8B89F8   Focus rings in dark mode
```

### Priority Colors P1–P4

Distinct from brand indigo. Priority is critical information — never muted.

| Priority | Name | Light Mode | Dark Mode | Rationale |
|----------|------|-----------|-----------|-----------|
| P1 — Urgent | Crimson | `#DC2626` | `#F87171` | Bold red, immediate danger |
| P2 — High | Amber | `#D97706` | `#FBBF24` | Warm amber, attention-needed |
| P3 — Medium | Cornflower | `#4A7CF0` | `#7AA2F7` | Cool blue-ish (distinct from brand violet) |
| P4 — Low | Slate | `#8B92A3` | `#6B7280` | Neutral, non-urgent |
| None | — | `#B8BEC9` | `#4A4F63` | Invisible, placeholder-level |

**Checkbox border colors:**
P1: `#DC2626` / P2: `#D97706` / P3: `#4A7CF0` / P4: `#B8BEC9`

### Semantic/Status Colors

| Purpose | Light | Dark | Usage |
|---------|-------|------|-------|
| Success | `#16A34A` | `#4ADE80` | Completion, synced, saved |
| Warning | `#D97706` | `#FBBF24` | Overdue warnings, near-limit |
| Error | `#DC2626` | `#F87171` | Failed actions, delete states |
| Info | `#0284C7` | `#38BDF8` | Tooltips, informational banners |
| Due Today | `#EA580C` | `#FB923C` | Orange — urgent but not error |

---

## 2. Typography

### Font Stack

```
Headings:  Manrope — variable weight, geometric, premium feel
Body:      Inter — optimized screen readability, neutral, trustworthy
Mono:      JetBrains Mono — keyboard shortcuts, code
Fallback:  -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

**Google Fonts import (add at top of index.css):**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Type Scale — 9 Levels

| Level | Size | px | Font | Weight | Line-height | Letter-spacing | Usage |
|-------|------|----|------|--------|-------------|----------------|-------|
| `display` | 2.25rem | 36px | Manrope | 800 | 1.15 | -0.025em | Hero, onboarding splash |
| `h1` | 1.75rem | 28px | Manrope | 700 | 1.25 | -0.02em | Page titles |
| `h2` | 1.375rem | 22px | Manrope | 700 | 1.3 | -0.015em | Section headers, modal titles |
| `h3` | 1.125rem | 18px | Manrope | 600 | 1.35 | -0.01em | Card section headings |
| `body-lg` | 1rem | 16px | Inter | 400 | 1.6 | 0 | Primary body text, descriptions |
| `body-md` | 0.9375rem | 15px | Inter | 400 | 1.55 | 0 | Task titles in list view |
| `body-sm` | 0.875rem | 14px | Inter | 400 | 1.5 | 0 | Secondary content, sidebar items |
| `label` | 0.8125rem | 13px | Inter | 500 | 1.4 | 0.01em | Tags, badges, metadata row |
| `micro` | 0.75rem | 12px | Inter | 500 | 1.35 | 0.02em | Timestamps, count badges |

**Rule: Never go below 12px.** Audit found `text-[10px]` and `text-[11px]` — eliminate these.

### Font Weight Reference

| Weight | Name | Usage |
|--------|------|-------|
| 400 | Regular | Body copy, task descriptions, input values |
| 500 | Medium | Labels, metadata, sidebar nav items |
| 600 | Semibold | Task titles, button text, h3 |
| 700 | Bold | Page headings h1/h2 |
| 800 | ExtraBold | Display text (Manrope only) |

---

## 3. Spacing

### 4px Base Grid — 13 Tokens

Every margin, padding, and gap must be a multiple of 4px. No arbitrary values.

| Token | Value | px | Primary Usage |
|-------|-------|----|---------------|
| `space-px` | 1px | 1px | Fine borders, 1px offsets |
| `space-0.5` | 0.125rem | 2px | Micro gaps, icon nudges |
| `space-1` | 0.25rem | 4px | Icon padding, tight inline gaps |
| `space-2` | 0.5rem | 8px | Gaps between small elements, tag margins |
| `space-3` | 0.75rem | 12px | Compact component padding |
| `space-4` | 1rem | 16px | Standard card padding, form field gaps |
| `space-5` | 1.25rem | 20px | Section gaps within panels |
| `space-6` | 1.5rem | 24px | Card-to-card gaps, sidebar section gaps |
| `space-8` | 2rem | 32px | Major section separators |
| `space-10` | 2.5rem | 40px | Page section vertical rhythm |
| `space-12` | 3rem | 48px | Large content blocks |
| `space-16` | 4rem | 64px | Page top/side margins |
| `space-20` | 5rem | 80px | Empty state illustration spacing |

**Component padding quick reference:**
- Tag/chip: `px-2 py-0.5` (8px / 2px)
- Button sm: `px-3 py-1.5` (12px / 6px)
- Button md: `px-4 py-2` (16px / 8px)
- Button lg: `px-5 py-2.5` (20px / 10px)
- Card: `p-4` (16px all sides)
- Sidebar item: `px-3 py-2` (12px / 8px)
- Modal: `p-6` (24px)
- Page container: `px-6 py-8` (24px / 32px)

---

## 4. Elevation & Shadows

### Light Mode — 5 Levels

| Level | Token | CSS Value | Usage |
|-------|-------|-----------|-------|
| 0 | `shadow-none` | none | Flush with background |
| 1 | `shadow-xs` | `0 1px 2px rgba(28,29,36,0.06)` | Tags, chips |
| 2 | `shadow-sm` | `0 1px 3px rgba(28,29,36,0.08), 0 1px 2px rgba(28,29,36,0.06)` | Task cards at rest |
| 3 | `shadow-md` | `0 4px 8px rgba(28,29,36,0.10), 0 2px 4px rgba(28,29,36,0.06)` | Hover cards, dropdowns |
| 4 | `shadow-lg` | `0 8px 16px rgba(28,29,36,0.12), 0 4px 6px rgba(28,29,36,0.06)` | Modals, detail panels |
| 5 | `shadow-xl` | `0 20px 32px rgba(28,29,36,0.14), 0 8px 12px rgba(28,29,36,0.06)` | Dragging cards |

### Dark Mode — 5 Levels

In dark mode, surface-color elevation is primary. Shadows add depth on top.

| Level | Token | CSS Value | Usage |
|-------|-------|-----------|-------|
| 0 | `shadow-none` | none | Flush with bg-base |
| 1 | `shadow-xs` | `0 1px 2px rgba(0,0,0,0.30)` | Tags |
| 2 | `shadow-sm` | `0 1px 4px rgba(0,0,0,0.40), 0 1px 2px rgba(0,0,0,0.30)` | Cards (+ surface-2) |
| 3 | `shadow-md` | `0 4px 12px rgba(0,0,0,0.50), 0 2px 4px rgba(0,0,0,0.30)` | Hover cards |
| 4 | `shadow-lg` | `0 8px 20px rgba(0,0,0,0.60), 0 4px 8px rgba(0,0,0,0.30)` | Modals, panels |
| 5 | `shadow-xl` | `0 20px 40px rgba(0,0,0,0.70), 0 8px 16px rgba(0,0,0,0.40)` | Dragging |

**Brand glow (focus/active):** `0 0 0 3px rgba(100,99,240,0.25)` — subtle violet halo on focused elements.

---

## 5. Border Radius

Match radius to component visual weight: small elements = small radius, large containers = larger.

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 5px | Tags, badges, chips, keyboard shortcut keys |
| `radius-md` | 8px | Buttons, inputs, task cards, dropdowns |
| `radius-lg` | 12px | Kanban columns, panel headers |
| `radius-xl` | 16px | Modals, bottom sheets, floating panels |
| `radius-2xl` | 20px | Command palette, large overlays |
| `radius-full` | 9999px | Avatars, circular checkboxes, pill tags |

**Component mapping:**
- Checkbox: `radius-full` — Kanban column: `radius-lg` — Modal: `radius-xl`
- Task card: `radius-md` — Button: `radius-md` — Tag: `radius-sm`
- Command palette: `radius-2xl` — Toast: `radius-md` — Tooltip: `radius-sm`

---

## 6. Responsive Breakpoints

### 4-Tier Breakpoint System

| Name | Min-width | Layout | Navigation |
|------|-----------|--------|------------|
| `mobile` | 0px | Single column | Bottom nav bar (56px) |
| `tablet` | 768px | Full-width content | Overlay sidebar (hamburger) |
| `desktop` | 1024px | 2-panel (sidebar + content) | Fixed sidebar, detail as overlay |
| `xl` | 1536px | 3-panel (sidebar + content + detail) | Detail panel pinned open |

### Per-Breakpoint Layout Specs

#### Mobile (<768px)
```
┌─────────────────────────────┐
│  Header (48px)              │  ← App name + quick-add FAB (56px circle, bottom-right)
├─────────────────────────────┤
│                             │
│  Main Content               │  ← Full width, single column
│  (scrollable)               │
│                             │
├─────────────────────────────┤
│  [Inbox] [Today] [Board]    │  ← Bottom nav bar (56px + safe-area-inset)
│  [Projects] [Settings]      │
└─────────────────────────────┘
```
- Touch targets: minimum 44×44px
- Task detail: bottom sheet (slide-up, 85vh, `radius-2xl` top corners)
- Kanban: 1 column visible, horizontal swipe to change column

#### Tablet (768px–1023px)
```
┌──┬────────────────────────────────────┐
│☰ │  Header: breadcrumb + controls    │
│  ├────────────────────────────────────┤
│  │                                   │
│  │  Main Content (full width)        │
│  │                                   │
└──┴────────────────────────────────────┘
+ Sidebar: overlay from left (240px, z-50) on hamburger tap
+ Task detail: full-screen overlay slide-up
```

#### Desktop (1024px–1535px)
```
┌────────────────┬──────────────────────────┐
│  Sidebar       │  Header + View Controls  │
│  240px         ├──────────────────────────┤
│  (collapsible  │                          │
│   → 56px)      │  Main Content (flex-1)   │
│                │                          │
└────────────────┴──────────────────────────┘
+ Task detail: right panel (360px) slides over main content on task click
```

#### XL / 3-panel (≥1536px)
```
┌──────────────┬──────────────────────┬─────────────────┐
│  Sidebar     │  Main Content        │  Detail Panel   │
│  240–280px   │  (flex-1)            │  360–400px      │
│              │                      │  (pinned open)  │
└──────────────┴──────────────────────┴─────────────────┘
```

### Sidebar Collapse Behavior
- Default: 240px, text labels visible
- Collapsed: 56px, icon-only, tooltips on hover
- Transition: `200ms ease-out` on width + `opacity: 0` on labels
- Persist collapsed state in localStorage

---

## 7. Component Specs

### 7.1 Task Card — List View

```
┌──────────────────────────────────────────────────────────────────┐
│▌ ○  Task title (15px Inter)                  🏷 tag   📅 Mar 5  │  ← 52px min-height
│   ▸ 2/5 subtasks   @me   ⬆ P2 High                              │  ← metadata row (13px)
└──────────────────────────────────────────────────────────────────┘
▌ = 3px left accent border (priority color)
○ = 18px circular checkbox (priority-colored border)
```

| Element | Spec |
|---------|------|
| Row min-height | 52px |
| Row padding | `px-4 py-3` |
| Background | transparent → `bg-hover` on hover |
| Priority accent | 3px left border, full height, priority color |
| Checkbox size | 18×18px, `radius-full` |
| Checkbox border | 1.5px solid, priority color |
| Title font | `body-md` (15px) Inter 400 → 500 on hover |
| Metadata font | `label` (13px) Inter 500, `text-tertiary` |
| Tag chip | `px-2 py-0.5` `radius-sm` `label` font |
| Hover reveal actions | `opacity-0 group-hover:opacity-100` |
| Transition | `120ms ease-out` on bg, opacity |
| Completed state | title `line-through` + `text-tertiary`, row `opacity-60` |
| Row exit animation | fade + slide-up, 300ms delay after check |

### 7.2 Task Card — Kanban Board

```
┌────────────────────────────────┐
│ [P2 Amber badge]         [···] │  ← header: priority + menu
│                                │
│  Design new landing page       │  ← 14px Inter 600
│                                │
│  [🏷 design] [🏷 frontend]    │  ← tags row
│                                │
│  ████████████░░░  60%          │  ← 3px progress bar
│                                │
│  📅 Feb 28   👤 AZ   💬 3     │  ← metadata (12px)
└────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Card width | 280px fixed |
| Card padding | `p-4` |
| Card gap | `gap-2` (8px) between cards |
| Border radius | `radius-md` (8px) |
| Background light | `#FFFFFF` |
| Background dark | `surface-2` (#1A1D2B) |
| Priority left-border | 3px, priority color |
| Shadow at rest | `shadow-sm` |
| Shadow on hover | `shadow-md` + `translateY(-2px)` |
| Shadow dragging | `shadow-xl` + `scale(1.02)` + `rotate(1.5deg)` |
| Title font | `body-sm` (14px) Inter 600 |
| Metadata font | `micro` (12px) Inter 500, `text-tertiary` |
| Progress bar height | 3px, `radius-full` |
| Progress color | matches priority color |
| Transition | `150ms ease-out` |

### 7.3 Sidebar

| Element | Spec |
|---------|------|
| Width expanded | 240px |
| Width collapsed | 56px |
| Collapse duration | 200ms ease-out |
| Background light | `bg-secondary` (#F3F4F8) |
| Background dark | `surface-1` (#13151F) |
| Right border | 1px `border-subtle` |
| Nav item height | 36px |
| Nav item padding | `px-3 py-2` |
| Nav item font | `body-sm` (14px) Inter 500 |
| Nav item color | `text-secondary` |
| Nav hover bg | `bg-hover` |
| Active item bg | `bg-brand-subtle` |
| Active item text | `text-brand` |
| Active left border | 3px brand color |
| Section label | `micro` (12px) uppercase 600, `text-tertiary`, `px-3 pt-4 pb-1` |
| Count badge | `micro` `bg-hover` `radius-full` `px-1.5` |
| Logo area | 56px height, `px-3` |

### 7.4 Mobile Bottom Nav

| Element | Spec |
|---------|------|
| Height | 56px + `safe-area-inset-bottom` |
| Background light | `bg-base` with `backdrop-blur-sm` |
| Background dark | `surface-1` with `backdrop-blur-sm` |
| Top border | 1px `border-subtle` |
| Icon size | 24×24px |
| Label font | `micro` (12px) |
| Active icon+label | brand color |
| Active label weight | 600 |
| Inactive | `text-tertiary` |
| Touch target | 44×44px minimum per item |
| Position | `fixed bottom-0 inset-x-0 z-50` |

### 7.5 Kanban Columns

| Element | Spec |
|---------|------|
| Column width | 280px fixed |
| Column gap | `gap-4` (16px) |
| Background light | `bg-secondary` (#F3F4F8) |
| Background dark | `surface-1` (#13151F) |
| Border radius | `radius-lg` (12px) |
| Padding | `p-3` |
| Header font | `body-sm` (14px) Inter 600 |
| Count badge | `micro` `bg-hover` `radius-full` `px-1.5 py-0.5` |
| Drop indicator line | 2px brand color, between cards |
| Drop placeholder | `border-2 border-dashed border-brand-muted` `radius-md` height 52px |
| Drag-over bg | 4% brand color tint |
| Add task button | Ghost, dashed border, full-width, `radius-md` |

### 7.6 Empty States

| Element | Spec |
|---------|------|
| Container | `flex flex-col items-center gap-4 py-20` |
| Illustration | 80×80px SVG icon, `text-tertiary` stroke |
| Headline | `h3` (18px) Manrope 600 `text-primary` |
| Body text | `body-sm` (14px) Inter 400 `text-secondary` max-width 280px centered |
| CTA button | Primary brand button |
| Animation | 2s `ease-in-out` float loop `translateY(0→-6px→0)` |
| Reduced motion | static, no float |

### 7.7 Skeleton Loaders

| Element | Spec |
|---------|------|
| Base light | `#E8EAEF` |
| Base dark | `#222538` |
| Shimmer | Linear gradient sweep left→right, 1.5s infinite |
| Row height | 52px (matches task rows) |
| Row radius | `radius-md` |
| Checkbox skeleton | 18px circle |
| Recommended count | 5–7 rows |

### 7.8 Modals

| Element | Spec |
|---------|------|
| Backdrop | `rgba(0,0,0,0.65)` + `backdrop-blur-[2px]` |
| Background light | `bg-base` (#FAFBFC) |
| Background dark | `surface-2` (#1A1D2B) |
| Border radius | `radius-xl` (16px) |
| Shadow | `shadow-lg` |
| Padding | `p-6` |
| Max-width | 480px (default) / 600px (large) |
| Header font | `h2` (22px) Manrope 700 |
| Open | `scale(0.95→1)` + `opacity(0→1)`, 200ms ease-out |
| Close | `scale(1→0.95)` + `opacity(1→0)`, 150ms ease-in |
| Dismiss | Overlay click + Escape key |

### 7.9 Toasts

| Element | Spec |
|---------|------|
| Position | `fixed bottom-4 right-4 z-50 flex flex-col gap-2` |
| Width | 320px |
| Background light | `#1C1D24` (dark toast on light BG for pop) |
| Background dark | `surface-3` (#222538) |
| Text light | `#FFFFFF` |
| Text dark | `text-primary` |
| Border radius | `radius-md` (8px) |
| Shadow | `shadow-lg` |
| Enter | slide-up + fade-in, 300ms ease-out |
| Exit | fade-out + slide-down, 200ms ease-in |
| Auto-dismiss | 4s success/info, 6s error, persistent warning |
| Success | 3px left border `#4ADE80` |
| Error | 3px left border `#F87171` |
| Warning | 3px left border `#FBBF24` |
| Info | 3px left border `#38BDF8` |

### 7.10 Inputs & Forms

| Element | Spec |
|---------|------|
| Height md | 40px |
| Height sm | 36px |
| Padding | `px-3 py-2` |
| Border radius | `radius-md` (8px) |
| Border light | 1px `#D6DAE4` |
| Border dark | 1px `#2D3248` |
| Background light | `#FFFFFF` |
| Background dark | `surface-2` (#1A1D2B) |
| Focus border | 1.5px brand color |
| Focus ring | `0 0 0 3px rgba(100,99,240,0.20)` |
| Font | `body-sm` (14px) Inter 400 |
| Placeholder | `text-tertiary` |
| Disabled | `bg-secondary` `text-disabled` `cursor-not-allowed` |
| Error border | 1.5px `#DC2626` |
| Error ring | `0 0 0 3px rgba(220,38,38,0.20)` |
| Error message | `label` (13px) `#DC2626` below field |

### 7.11 Buttons

**Primary:** `bg-brand text-white hover:bg-brand-hover active:scale-[0.98]`
**Secondary:** `bg-secondary text-primary border border-strong hover:bg-hover`
**Ghost:** `bg-transparent text-secondary hover:bg-hover`
**Danger:** `bg-[#DC2626] text-white hover:bg-[#B91C1C]`

| Size | Height | Padding | Font |
|------|--------|---------|------|
| sm | 32px | `px-3 py-1.5` | 13px Inter 500 |
| md | 40px | `px-4 py-2` | 14px Inter 500 |
| lg | 44px | `px-5 py-2.5` | 15px Inter 500 |
| icon-sm | 32×32px | centered | 16px icon |
| icon-md | 40×40px | centered | 20px icon |

Transition: `120ms ease-out` on bg, color, shadow, transform

### 7.12 Quick Capture (Command Palette)

| Element | Spec |
|---------|------|
| Backdrop | `rgba(0,0,0,0.60)` + `backdrop-blur-sm` |
| Background light | `#FFFFFF` |
| Background dark | `surface-2` (#1A1D2B) |
| Border | 1px `border-strong` |
| Border radius | `radius-2xl` (20px) |
| Shadow | `shadow-xl` |
| Width | `min(640px, 90vw)` |
| Max-height | 480px |
| Input font | `body-lg` (16px) Inter 400 |
| Results font | `body-sm` (14px) |
| Active result | `bg-brand-subtle` |
| Section header | `micro` (12px) uppercase `text-tertiary` |
| Open animation | `scale(0.96→1)` + `opacity(0→1)`, 180ms ease-out |

---

## 8. Implementation — Paste-Ready Code

### 8.1 Google Fonts Import

Add at the very top of `packages/frontend/src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
```

### 8.2 Tailwind v4 `@theme` Block

**Important:** FlowTask uses Tailwind v4 with `@theme` CSS syntax — there is no `tailwind.config.ts`.

Replace/extend the existing `@theme` block in `packages/frontend/src/index.css`:

```css
@import "tailwindcss";

@theme {
  /* ============================================================
     FONTS
  ============================================================ */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-display: "Manrope", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "Cascadia Code", monospace;

  /* ============================================================
     BRAND COLOR — Slate Violet (#6463F0)
  ============================================================ */
  --color-brand-50:  #EEEEFF;
  --color-brand-100: #DDDEFE;
  --color-brand-200: #C8C7FA;
  --color-brand-300: #A9A8F5;
  --color-brand-400: #8B89F8;
  --color-brand-500: #6463F0;
  --color-brand-600: #5452D6;
  --color-brand-700: #4341B8;
  --color-brand-800: #332F99;
  --color-brand-900: #25237A;

  /* ============================================================
     PRIORITY COLORS
  ============================================================ */
  --color-priority-urgent:        #DC2626;
  --color-priority-high:          #D97706;
  --color-priority-medium:        #4A7CF0;
  --color-priority-low:           #8B92A3;
  --color-priority-none:          #B8BEC9;
  --color-priority-urgent-dark:   #F87171;
  --color-priority-high-dark:     #FBBF24;
  --color-priority-medium-dark:   #7AA2F7;
  --color-priority-low-dark:      #6B7280;

  /* ============================================================
     SEMANTIC STATUS COLORS
  ============================================================ */
  --color-success:        #16A34A;
  --color-success-dark:   #4ADE80;
  --color-warning:        #D97706;
  --color-warning-dark:   #FBBF24;
  --color-error:          #DC2626;
  --color-error-dark:     #F87171;
  --color-info:           #0284C7;
  --color-info-dark:      #38BDF8;
  --color-due-today:      #EA580C;
  --color-due-today-dark: #FB923C;

  /* ============================================================
     BORDER RADIUS
  ============================================================ */
  --radius-sm:   5px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-full: 9999px;

  /* ============================================================
     BREAKPOINTS
  ============================================================ */
  --breakpoint-sm:  480px;
  --breakpoint-md:  768px;
  --breakpoint-lg:  1024px;
  --breakpoint-xl:  1280px;
  --breakpoint-2xl: 1536px;
}
```

### 8.3 CSS Custom Properties (Semantic Design Tokens)

Add this block after `@theme` in `index.css`:

```css
/* ============================================================
   LIGHT MODE — default
============================================================ */
:root {
  /* Backgrounds */
  --bg-base:          #FAFBFC;
  --bg-secondary:     #F3F4F8;
  --bg-tertiary:      #EBEDF2;
  --bg-hover:         #E2E5EC;
  --bg-active:        #D9DCE6;
  --bg-brand-subtle:  #EEEEFF;
  --bg-brand-muted:   rgba(100,99,240,0.08);

  /* Text */
  --text-primary:     #1C1D24;
  --text-secondary:   #5C6070;
  --text-tertiary:    #8F96A6;
  --text-disabled:    #B8BEC9;
  --text-inverse:     #FFFFFF;
  --text-brand:       #6463F0;

  /* Borders */
  --border-strong:    #D6DAE4;
  --border-subtle:    #E8EAEF;
  --border-focus:     #6463F0;
  --border-brand:     rgba(100,99,240,0.30);

  /* Surfaces */
  --surface-card:     #FFFFFF;
  --surface-sidebar:  #F3F4F8;
  --surface-modal:    #FAFBFC;
  --surface-overlay:  rgba(0,0,0,0.55);

  /* Priority */
  --priority-urgent:  #DC2626;
  --priority-high:    #D97706;
  --priority-medium:  #4A7CF0;
  --priority-low:     #8B92A3;
  --priority-none:    #D6DAE4;

  /* Semantic */
  --color-success:    #16A34A;
  --color-warning:    #D97706;
  --color-error:      #DC2626;
  --color-info:       #0284C7;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(28,29,36,0.06);
  --shadow-sm: 0 1px 3px rgba(28,29,36,0.08), 0 1px 2px rgba(28,29,36,0.06);
  --shadow-md: 0 4px 8px rgba(28,29,36,0.10), 0 2px 4px rgba(28,29,36,0.06);
  --shadow-lg: 0 8px 16px rgba(28,29,36,0.12), 0 4px 6px rgba(28,29,36,0.06);
  --shadow-xl: 0 20px 32px rgba(28,29,36,0.14), 0 8px 12px rgba(28,29,36,0.06);
  --shadow-brand-focus: 0 0 0 3px rgba(100,99,240,0.25);
  --shadow-error-focus: 0 0 0 3px rgba(220,38,38,0.20);

  /* Layout */
  --sidebar-width:           240px;
  --sidebar-width-collapsed: 56px;
  --bottom-nav-height:       56px;
  --detail-panel-width:      360px;
}

/* ============================================================
   DARK MODE
============================================================ */
.dark {
  /* Backgrounds — 6-level surface hierarchy */
  --bg-base:          #0D0E14;  /* Level 0 */
  --bg-secondary:     #13151F;  /* Level 1 */
  --bg-tertiary:      #1A1D2B;  /* Level 2 */
  --bg-hover:         #222538;  /* Level 3 */
  --bg-active:        #2A2E43;  /* Level 4 */
  --bg-brand-subtle:  rgba(100,99,240,0.12);
  --bg-brand-muted:   rgba(100,99,240,0.08);

  /* Text */
  --text-primary:     #E4E6F0;
  --text-secondary:   #9299AD;
  --text-tertiary:    #5C6278;
  --text-disabled:    #3E4358;
  --text-inverse:     #1C1D24;
  --text-brand:       #8B89F8;

  /* Borders */
  --border-strong:    #2D3248;
  --border-subtle:    #1E2135;
  --border-focus:     #8B89F8;
  --border-brand:     rgba(139,137,248,0.30);

  /* Surfaces */
  --surface-card:     #1A1D2B;
  --surface-sidebar:  #13151F;
  --surface-modal:    #1A1D2B;
  --surface-overlay:  rgba(0,0,0,0.70);

  /* Priority */
  --priority-urgent:  #F87171;
  --priority-high:    #FBBF24;
  --priority-medium:  #7AA2F7;
  --priority-low:     #6B7280;
  --priority-none:    #2D3248;

  /* Semantic */
  --color-success:    #4ADE80;
  --color-warning:    #FBBF24;
  --color-error:      #F87171;
  --color-info:       #38BDF8;

  /* Dark shadows */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.30);
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.40), 0 1px 2px rgba(0,0,0,0.30);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.50), 0 2px 4px rgba(0,0,0,0.30);
  --shadow-lg: 0 8px 20px rgba(0,0,0,0.60), 0 4px 8px rgba(0,0,0,0.30);
  --shadow-xl: 0 20px 40px rgba(0,0,0,0.70), 0 8px 16px rgba(0,0,0,0.40);
  --shadow-brand-focus: 0 0 0 3px rgba(139,137,248,0.25);
  --shadow-error-focus: 0 0 0 3px rgba(248,113,113,0.20);
}
```

### 8.4 Global Base Styles

```css
/* ============================================================
   GLOBAL BASE
============================================================ */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  transition: background-color 200ms ease, color 200ms ease;
}

body {
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--text-primary);
  background-color: var(--bg-base);
  margin: 0;
}

:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

:focus:not(:focus-visible) {
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8.5 Skeleton Shimmer Animation

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}
```

### 8.6 Framer Motion Animation Constants

Create `packages/frontend/src/lib/motion.ts`:

```typescript
// Animation easings (cubic-bezier arrays for Framer Motion)
export const easings = {
  snappy:   [0.16, 1, 0.3, 1],     // Panel slides, modals open
  smooth:   [0.4, 0, 0.2, 1],      // Checkbox, view transitions
  bounce:   [0.34, 1.56, 0.64, 1], // New task, FAB press
  ease:     [0.25, 0.1, 0.25, 1],  // General purpose
} as const;

export const durations = {
  instant:  0.08,  // Button press feedback
  fast:     0.12,  // Hover states, row highlights
  normal:   0.20,  // Panel slides, sidebar collapse
  moderate: 0.30,  // Modal open, checkbox animation
  slow:     0.50,  // View transitions list→board
  verySlow: 0.80,  // Month change in calendar
} as const;

// Spring for drag-and-drop card settle
export const dragSpring = {
  type: "spring",
  stiffness: 400,
  damping: 30,
} as const;

// Modal open/close variants
export const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: durations.moderate, ease: easings.snappy } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

// Sidebar panel slide
export const detailPanelVariants = {
  hidden:  { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: durations.normal, ease: easings.snappy } },
  exit:    { x: "100%", opacity: 0, transition: { duration: 0.15 } },
};

// List item enter/exit
export const listItemVariants = {
  hidden:  { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.fast, ease: easings.ease } },
  exit:    { opacity: 0, y: 8, transition: { duration: durations.fast } },
};
```

### 8.7 Priority Helper Utilities

Create `packages/frontend/src/lib/priority.ts`:

```typescript
import type { Priority } from "@flowtask/shared";

export const priorityConfig = {
  urgent: {
    label: "Urgent",
    color: "var(--priority-urgent)",
    textClass: "text-[var(--priority-urgent)]",
    borderClass: "border-l-[var(--priority-urgent)]",
    bgClass: "bg-red-50 dark:bg-red-950/20",
  },
  high: {
    label: "High",
    color: "var(--priority-high)",
    textClass: "text-[var(--priority-high)]",
    borderClass: "border-l-[var(--priority-high)]",
    bgClass: "bg-amber-50 dark:bg-amber-950/20",
  },
  medium: {
    label: "Medium",
    color: "var(--priority-medium)",
    textClass: "text-[var(--priority-medium)]",
    borderClass: "border-l-[var(--priority-medium)]",
    bgClass: "bg-blue-50 dark:bg-blue-950/20",
  },
  low: {
    label: "Low",
    color: "var(--priority-low)",
    textClass: "text-[var(--priority-low)]",
    borderClass: "border-l-[var(--priority-low)]",
    bgClass: "bg-slate-50 dark:bg-slate-950/20",
  },
  none: {
    label: "None",
    color: "var(--priority-none)",
    textClass: "text-[var(--priority-none)]",
    borderClass: "border-l-[var(--priority-none)]",
    bgClass: "",
  },
} satisfies Record<string, { label: string; color: string; textClass: string; borderClass: string; bgClass: string }>;

export function getPriorityConfig(priority: Priority | null | undefined) {
  return priorityConfig[priority ?? "none"] ?? priorityConfig.none;
}
```

---

## Quick Reference Card

```
BRAND:     #6463F0 (light) / #8B89F8 (dark)   Slate Violet — NOT stock blue
FONT BODY:    Inter 400/500/600
FONT HEADING: Manrope 600/700/800
SCALE (px):   12 / 13 / 14 / 15 / 16 / 18 / 22 / 28 / 36
GRID:         4px base. Every spacing value is a multiple of 4.
RADII:        5px / 8px / 12px / 16px / 20px / 9999px

DARK SURFACES (0→5):
  #0D0E14 → #13151F → #1A1D2B → #222538 → #2A2E43 → #353A52

PRIORITY:
  P1 Urgent  #DC2626 / #F87171
  P2 High    #D97706 / #FBBF24
  P3 Medium  #4A7CF0 / #7AA2F7
  P4 Low     #8B92A3 / #6B7280

BREAKPOINTS: 768px tablet / 1024px desktop / 1536px 3-panel
```
