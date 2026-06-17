// ──────────────────────────────────────────────
// Beacon- Motion Constants
// Single source of truth for all animation values.
// Import these in every Framer Motion component
// instead of hard-coding easing and duration values.
//
// Usage:
//   import { EASE, DURATION, variants } from "@/lib/motion"
//   <motion.div transition={{ duration: DURATION.entrance, ease: EASE.entrance }}>
// ──────────────────────────────────────────────

// ─── Easing Curves ────────────────────────────
// Matches the CSS custom properties in globals.css
// and the scene spec exactly.

export const EASE = {
  /** Snappy ease-out- used for all scene entrances */
  entrance: [0.16, 1, 0.3, 1],

  /** Material standard- used for hover states */
  hover: [0.4, 0, 0.2, 1],

  /** Standard ease-in-out for idle loops */
  idle: [0.45, 0, 0.55, 1],
}

// ─── Duration Scale ───────────────────────────
// All values in seconds (Framer Motion convention).

export const DURATION = {
  /** 0.1s- copy feedback, micro-interactions */
  instant: 0.1,

  /** 0.15s- hover states */
  fast: 0.15,

  /** 0.3s- most transitions */
  normal: 0.3,

  /** 0.5s- scene entrances */
  entrance: 0.5,

  /** 0.8s- path drawing, bar growth */
  draw: 0.8,
}

// ─── Reusable Variant Sets ────────────────────
// Pre-built Framer Motion variant objects.
// Compose these in scene components.

/** Standard panel entrance- fade up from 20px below */
export const panelVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.entrance,
      ease: EASE.entrance,
    },
  },
}

/** Faster panel entrance for terminal/developer scenes */
export const terminalVariants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASE.entrance,
    },
  },
}

/** Staggered children- parent container variant */
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

/** Individual staggered child */
export const staggerChildVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASE.entrance,
    },
  },
}

/** Slide in from right- notification cards, thread panels */
export const slideFromRightVariants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASE.entrance,
    },
  },
}

/** Tooltip- fade up 4px */
export const tooltipVariants = {
  hidden: {
    opacity: 0,
    y: 4,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASE.hover,
    },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: {
      duration: DURATION.fast,
      ease: EASE.hover,
    },
  },
}

/** Ambient glow- fades in before the panel */
export const glowVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASE.idle,
    },
  },
}