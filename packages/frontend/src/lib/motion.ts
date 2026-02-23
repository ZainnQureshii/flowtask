/**
 * Motion animation presets for FlowTask.
 *
 * Use Motion (motion/react) for: AnimatePresence, layout animations, gesture-based animations.
 * Use GSAP (lib/gsap.ts) for: multi-step timelines, DrawSVG, ScrollTrigger, celebrations.
 * Never mix both on the same element simultaneously.
 */
import type { Transition, Variants } from 'motion/react'

// ── Timing presets ─────────────────────────────────────────────────────────

export const DURATION = {
  instant:  0.08,
  fast:     0.15,
  normal:   0.22,
  moderate: 0.30,
  slow:     0.40,
} as const

// ── Easing presets ─────────────────────────────────────────────────────────

export const EASE = {
  out:    [0.0, 0.0, 0.2, 1.0],
  in:     [0.4, 0.0, 1.0, 1.0],
  inOut:  [0.4, 0.0, 0.2, 1.0],
  spring: [0.16, 1.0, 0.3, 1.0],  // Panel slides, modals
  bounce: [0.34, 1.56, 0.64, 1.0], // Subtle overshoot
} as const

// ── Component animation variants ───────────────────────────────────────────

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal, ease: EASE.out } },
  exit:    { opacity: 0, transition: { duration: DURATION.fast,   ease: EASE.in } },
}

export const slideInRight: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: DURATION.moderate, ease: EASE.spring } },
  exit:    { x: '100%', opacity: 0, transition: { duration: DURATION.normal, ease: EASE.in } },
}

export const slideUpModal: Variants = {
  hidden:  { scale: 0.96, opacity: 0, y: 8 },
  visible: { scale: 1, opacity: 1, y: 0, transition: { duration: DURATION.moderate, ease: EASE.spring } },
  exit:    { scale: 0.96, opacity: 0, y: 8, transition: { duration: DURATION.fast, ease: EASE.in } },
}

export const slideUpSheet: Variants = {
  hidden:  { y: '100%' },
  visible: { y: 0, transition: { duration: DURATION.moderate, ease: EASE.spring } },
  exit:    { y: '100%', transition: { duration: DURATION.normal, ease: EASE.in } },
}

export const taskEnter: Variants = {
  hidden:  { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: DURATION.normal, ease: EASE.spring } },
  exit:    { opacity: 0, x: -16,             transition: { duration: DURATION.fast,   ease: EASE.in } },
}

export const emptyStateEnter: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0,  transition: { duration: DURATION.slow, ease: EASE.out, delay: 0.1 } },
}

export const sidebarCollapse: Transition = {
  duration: DURATION.normal,
  ease: EASE.inOut,
}

/** Fallback variants for users who prefer reduced motion */
export const noMotion: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
}
