# FlowTask UI/UX Audit
*Audited: 2026-02-23 | Auditor: UI Audit Agent*

---

## 1. Tech Stack

| Item | Version / Detail |
|------|-----------------|
| React | 19.0 |
| Vite | 6.1 |
| Tailwind CSS | 4.0 (v4 `@theme` syntax, no tailwind.config.ts) |
| shadcn/ui | Manually installed Radix UI primitives |
| Framer Motion | 12.4 |
| @dnd-kit | 6.3 (core) + 10.0 (sortable) |
| Zustand | 5.0 |
| cmdk | 1.0 (command palette) |
| date-fns | 4.1 |
| lucide-react | 0.474 |
| react-router-dom | 7.1 |

---

## 2. Design System

### Colors (index.css `@theme`)

**Light mode:**
```
background:   #ffffff
foreground:   #0a0a0a
card:         #ffffff
primary:      #3b82f6  (Tailwind blue-500 — completely generic)
secondary:    #f1f5f9
muted:        #f1f5f9  ← SAME as secondary
accent:       #f1f5f9  ← SAME as secondary and muted
border:       #e2e8f0
sidebar:      #f8fafc
```

**Dark mode:**
```
background:   #0a0a0a
card:         #111111
secondary:    #1e293b
muted:        #1e293b  ← SAME as secondary
accent:       #1e293b  ← SAME as secondary and muted
border:       #1e293b  ← SAME as everything else in dark
primary:      #3b82f6  (unchanged)
```

**Problems:**
- `secondary`, `muted`, and `accent` are identical — zero design vocabulary.
- In dark mode, `border` and `muted` and `accent` are all `#1e293b` — no visual separation.
- `primary` is stock Tailwind blue with zero customization — indistinguishable from any shadcn starter.
- No brand identity whatsoever. Could be any random demo app.

### Typography

- **Font:** System font stack only: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- No custom font loaded (no Inter, Geist, Outfit, etc.)
- **Scale used:** text-[10px], text-[11px], text-xs, text-sm, text-lg, text-2xl — no consistent type scale
- Font weights: font-medium, font-semibold, font-bold — scattered usage

**Problems:**
- System fonts are the #1 signal that a developer rushed the UI. Every polished SaaS uses Inter, Geist, or similar.
- Font sizes below 12px (`text-[10px]`, `text-[11px]`) are used for priority badges, tag labels — hard to read.
- No display font for headings — everything uses the same body font.

### Spacing

- Radii: `--radius-sm: 0.25rem`, `--radius-md: 0.375rem`, `--radius-lg: 0.5rem`, `--radius-xl: 0.75rem`
- No custom radius — these are default shadcn values
- Padding: inconsistent throughout (p-1 through p-4, mixed within same component)

### Shadows

No shadow system. Components use:
- `shadow-sm` — task cards in list view
- `shadow-md` — kanban cards on hover
- `shadow-lg` — pomodoro widget
- `shadow-xl` — task detail panel

No layered elevation system (e.g., level 1/2/3 shadows for different depths).

---

## 3. Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (240px or 56px collapsed) │  Header (h-auto) │
│  [hidden on mobile]                ├────────────────  │
│  - Logo (Clock icon + FlowTask)    │  Main Content    │
│  - Nav: Tasks / Planner / Settings │  (overflow-y-auto│
│  - View switcher (Tasks page only) │   p-4)           │
│  - Tags filter                     │                  │
└─────────────────────────────────────────────────────┘
[Mobile only: Fixed bottom nav bar]
[Overlays: Task Detail panel, Task Form modal, Quick Capture, Pomodoro widget]
```

The basic structure is architecturally sound but visually bland.

---

## 4. All Views / Pages

### Page: Tasks (`/`)
**3 sub-views toggled via sidebar:**

#### 4a. List View
- Sort controls: inline text buttons (`Sort: title | priority | dueDate | createdAt`)
- Group by: inline text buttons (`Group: none | status | priority`)
- Task list with AnimatePresence enter/exit animations
- Empty state: plain text "No tasks yet" message

**Issues:** Sort/group UI looks like programmer buttons, not a real UI. No visual affordance. Empty state has zero personality.

#### 4b. Kanban View
- 4 fixed columns: Todo, In Progress, Done, Archived
- Each column: 280px fixed width
- Drag-and-drop with @dnd-kit (working)
- DragOverlay with 2deg rotation (nice touch)
- Scrollable horizontally on parent

**Issues:** 4 columns require 1180px+ to show without scroll. Fixed width not responsive. "Archived" column probably shouldn't be shown by default — users don't drag to Archived. No WIP limit indicators. No column color coding.

#### 4c. Calendar View
- Monthly calendar, 7-column grid
- Today highlighted with primary-colored circle (good)
- Tasks shown as small pill/button on due date
- Popover for overflow tasks (+N more)
- Month navigation (prev/today/next)

**Issues:** Cell height is `min-h-[100px]` which collapses badly on smaller screens. Calendar cells have no background differentiation for weekend/weekday. No visual distinction between overdue tasks and future tasks in the calendar.

---

### Page: Planner (`/planner`)
**Daily planner showing today's tasks:**
- 3 stat cards: Tasks done, Focus time, Pomodoros
- Today's task list (tasks with today's due date)
- 24-hour timeline

**Issues:** The timeline is **completely non-functional** — 24 empty rows with hour labels but NO tasks placed on them. This is a placeholder/stub that looks broken. Users with no due-date-today tasks see nothing useful. The timeline doesn't show time tracking entries or any data at all.

---

### Page: Settings (`/settings`)
**Sections:**
1. Theme toggle (Light/Dark/System buttons)
2. Tag manager
3. Import / Export (JSON)
4. Stats / Productivity panel (4 stat cards + bar chart)
5. Keyboard shortcuts hint (tiny footer text)

**Issues:** Settings page is a scrollable page, not a proper settings layout. Stats feel misplaced here — they belong on a dashboard. Bar chart is minimal CSS bars with no axis labels, no interactive tooltips, no date ranges. The keyboard shortcuts hint is buried in tiny text at the very bottom.

---

## 5. Component Quality

### Shadcn/ui Components Installed
- Button, Input, Badge, Checkbox, Dialog, DropdownMenu, Popover, Select, Tabs, Tooltip, Progress, Separator

### Missing shadcn components that would help:
- `Card` — would improve stat blocks
- `Sheet` — better for task detail panel (currently custom)
- `Skeleton` — no loading states at all (just a spinner)
- `Toast/Sonner` — no feedback on actions (create, delete, error)
- `Alert` — no structured error display
- `Command` — uses cmdk directly instead of shadcn Command wrapper

### TaskCard
- Both list and kanban variants in one component (appropriate)
- Left-border color indicator: good pattern
- Priority badge uses `text-[10px]` — too small
- Tags limited to 3 with "+N more" for overflow — good
- Hover menu opacity: `opacity-0 group-hover:opacity-100` — good pattern
- Missing: No visual indication of subtask progress in the list view (only count)
- Missing: No "in progress" visual status on list cards

### TaskDetail
- Slide-in panel from right (spring animation) — good
- Sticky header — good
- Tabs for Subtasks / Time — good information architecture
- Color indicator: just a 16px circle with "Task color" label — weird and useless display
- Description: `whitespace-pre-wrap` in a bg-muted block — functional but plain

### TaskForm (Modal)
- Standard Dialog with inputs
- Textarea for description is visually inconsistent (manually styled to match inputs)
- Color picker: 24px circles — too small, no labels, hard to tap
- TagPicker renders inside the modal — untested to see it but likely works

### QuickCapture (cmdk)
- Command palette at 20% from top — good position
- Syntax parsing (!priority, #tag, @date) — excellent feature
- Search mode (/) and command mode (>) — powerful
- Tip text in footer — good discoverability

**Issues:** No syntax highlighting in the input. The inline tip "!priority #tag @date" would be much clearer if the input showed colored preview of parsed tokens.

### PomodoroTimer
- Fixed bottom-right floating widget (desktop only — `hidden md:block`)
- Collapsed: timer display + state label — good
- Expanded: SVG progress ring — genuinely nice
- Framer motion height animation — smooth

**Issues:** Completely hidden on mobile. Mobile users cannot access Pomodoro at all. No sound notification support. The "Start" button just picks `tasks[0]` — should let user select the task.

### StatsPanel
- 4 stat cards in 2x2 grid — fine
- Bar chart: `h-24` container, bars are CSS height percentages — minimal
- No chart library used, no tooltips, no axis labels
- No date range filtering

### DailyPlanner
- Today's task list — good
- 24-hour timeline: empty rows only, no task placement logic — **broken/incomplete feature**

---

## 6. Responsive / Mobile

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Sidebar navigation | ✅ (collapsible) | ❌ (hidden) |
| Bottom nav | ❌ | ✅ |
| View switcher (List/Kanban/Calendar) | ✅ | ❌ (no access) |
| Task creation | ✅ | ✅ (via header button) |
| Quick Capture | ✅ | ✅ (keyboard shortcut works) |
| Pomodoro timer | ✅ | ❌ (hidden) |
| Time tracking widget | ✅ | ❌ |
| Task detail panel | ✅ (right panel) | ⚠️ (takes full width, OK) |
| Kanban horizontal scroll | ✅ | ⚠️ (clunky) |
| Calendar 7-col grid | ✅ | ⚠️ (very tight) |

**Mobile is an afterthought.** Core productivity features (Pomodoro, view switching) are desktop-only. The mobile nav only provides basic page navigation — no access to power features.

---

## 7. Animations / Transitions

| Animation | Component | Quality |
|-----------|-----------|---------|
| Sidebar collapse width | Sidebar | ✅ Good (framer-motion 0.2s) |
| Task card enter/exit | ListView | ✅ Good (AnimatePresence) |
| Task detail slide-in | TaskDetail | ✅ Good (spring, x: 100%→0) |
| Pomodoro widget entry | PomodoroTimer | ✅ Good (y: 100→0) |
| Pomodoro expand/collapse | PomodoroTimer | ✅ Good (height animation) |
| SVG ring progress | PomodoroTimer | ✅ Good (stroke transition) |
| Drag overlay | KanbanView | ✅ Good (rotate-2) |
| Theme transition | html element | ✅ Good (150ms) |
| Kanban cards on drag | KanbanColumn | ⚠️ Opacity only (no lift effect) |
| Filters expand | TaskFilters | ❌ No animation (instant show/hide) |
| Empty states | All views | ❌ No animation |
| Stats bar chart | StatsPanel | ❌ No animation on load |

Good animation foundation — more than many apps. But filters panel, empty states, and some interactions lack polish.

---

## 8. Dark Mode

- Well-implemented via CSS variables in `.dark` selector
- Theme applied via Zustand `useUIStore` + `useTheme` hook that adds/removes `.dark` on `document.documentElement`
- Persisted via Zustand `persist` middleware
- Smooth 150ms transition on `html` element
- Supports `system` preference via `prefers-color-scheme` media query
- `@custom-variant dark (&:is(.dark *))` in Tailwind v4 syntax

**Issues:**
- Dark sidebar `#111111` vs dark background `#0a0a0a` — the contrast is minimal (barely distinguishable)
- Dark border color `#1e293b` = dark muted = dark accent = dark secondary — no visual layer separation

---

## 9. Brutal Honest Pain Points

### Critical (Fix First)
1. **No custom font** — System fonts in 2026 for a SaaS app is unacceptable. Install Inter or Geist immediately.
2. **Accent = Muted = Secondary** — Three design tokens that should be distinct are identical. Collapses all hover states and secondary backgrounds to the same color.
3. **Generic blue primary** — #3b82f6 is the default shadcn/ui color. Zero brand identity.
4. **Timeline is a broken placeholder** — The Daily Planner shows a 24-row timeline with zero functionality. Either complete it or remove it. Looks unprofessional.
5. **Mobile missing key features** — Pomodoro and view switching locked to desktop only. Half the app is missing on mobile.

### High Priority
6. **Sort/Group UI is programmer buttons** — "Sort: title | priority | dueDate | createdAt" as text buttons with "Sort:" prefix looks amateurish. Should be a proper toolbar with icons.
7. **No toast notifications** — Creating, deleting, and editing tasks gives zero feedback to the user. Users don't know if actions succeeded.
8. **No loading skeletons** — Full spinner on initial load; no content-shaped loading state.
9. **Stats chart is decorative, not useful** — 7-day bars with no labels, tooltips, or context. Replace with a real chart or remove.
10. **Settings page feels like a dumping ground** — Stats, import/export, theme, and tags are thrown together with just separators. Needs proper sections with visual hierarchy.

### Medium Priority
11. **Priority badges at 10px font** — Too small to read. Priority is important information that deserves proper treatment.
12. **Color indicator in TaskDetail** — A 16px circle with "Task color" label serves no purpose. Either use it meaningfully or remove it.
13. **Header search triggers QuickCapture on focus** — Confusing: clicking search doesn't search, it opens the command palette. These should be separate.
14. **Kanban "Archived" column** — Showing archived tasks by default clutters the board. Should be collapsed or hidden by default.
15. **No visual difference between "Todo" and "In Progress" tasks in list view** — Only the dropdown context menu shows status. Add status indicators visually.
16. **Empty states have no personality** — "No tasks yet" plain text. Add an illustration, a clear CTA, or at minimum a helpful message.
17. **Tag picker in task form not visible in code** — Referenced but wasn't audited separately. Needs review.
18. **Pomodoro start with tasks[0]** — Automatically picks first task when user clicks "Start". Should show a task picker.

### Low Priority / Polish
19. **Calendar has no visual weekday/weekend distinction** — Saturday/Sunday look identical to weekdays.
20. **Sidebar logo is just a Clock icon** — No real logo or brand mark.
21. **Keyboard shortcuts buried in settings footer** — Should be in a proper modal or at minimum an info tooltip.
22. **No scroll-to-top or pagination** — Large task lists will get unwieldy.
23. **Description textarea is manually styled** — Inconsistent with rest of form, uses custom class string instead of shadcn Input.
24. **Recurring task badge just shows type name** — "daily" / "weekly" with a repeat icon; no next-occurrence date.

---

## 10. Summary Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| Architecture / Structure | 8/10 | Clean component structure, good separation |
| Typography | 3/10 | System font only, inconsistent scale, tiny text |
| Color System | 4/10 | Generic blue, collapsed token vocabulary |
| Spacing / Layout | 6/10 | Generally ok, some inconsistencies |
| Animation | 7/10 | Good foundation with framer-motion |
| Dark Mode | 7/10 | Works well, but low contrast in dark |
| Mobile Responsiveness | 4/10 | Afterthought, key features locked to desktop |
| Component Polish | 5/10 | Functional but unpolished |
| Empty States / Feedback | 2/10 | No toasts, no skeletons, plain empty states |
| Completeness | 6/10 | Timeline is broken, stats are minimal |
| **Overall** | **5.2/10** | Functional SaaS skeleton, needs serious visual polish |

---

## 11. Priority Redesign Recommendations

### Immediate (Design System)
1. Install **Inter** or **Geist** font via `@import`
2. Choose a **distinct brand primary color** (not blue-500)
3. Give `accent`, `secondary`, and `muted` distinctly different values
4. Add proper shadow elevation tokens (3 levels)
5. Define a clear type scale (12/14/16/20/24/32px)

### Layout
6. Add a proper header with branding in sidebar
7. Make view switcher accessible on mobile (add to header or bottom sheet)
8. Move Pomodoro to a location accessible on mobile

### Components
9. Add `sonner` for toast notifications
10. Add `Skeleton` loading states
11. Replace sort/group text buttons with a proper toolbar component
12. Design real empty states with illustrations or meaningful messaging
13. Fix or complete the Timeline feature in Daily Planner

### Polish
14. Add hover animations to kanban cards (subtle lift/shadow)
15. Animate filter panel expansion
16. Improve stats chart (use recharts or similar)
17. Make Calendar weekends visually distinct
