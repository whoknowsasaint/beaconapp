// ──────────────────────────────────────────────
// Beacon- GlassPanel
//
// The base surface component for every scene's
// primary object. Encapsulates the glass material
// system: blur, border, shadow, top highlight,
// and optional ambient glow.
//
// Props:
//   children    - content rendered inside the panel
//   className   - additional Tailwind classes
//   blur        - backdrop blur amount (default: "glass" = 12px)
//   shadow      - named shadow token (default: "glass")
//   glow        - glow color string e.g. "#3B82F6" or null
//   glowOpacity - glow intensity 0–1 (default: 0.15)
//   glowSize    - glow radius in px (default: 600)
//   topHighlight- show 1px top-edge gradient (default: true)
//   rounded     - border radius class (default: "rounded-2xl")
//   as          - HTML element to render (default: "div")
//   ...rest     - any other props passed to the root element
// ──────────────────────────────────────────────

"use client"

import { forwardRef } from "react"

const GlassPanel = forwardRef(function GlassPanel(
  {
    children,
    className = "",
    blur = "glass",
    shadow = "glass",
    glow = null,
    glowOpacity = 0.15,
    glowSize = 600,
    topHighlight = true,
    rounded = "rounded-2xl",
    as: Tag = "div",
    style = {},
    ...rest
  },
  ref
) {
  // ─── Build the backdrop blur class ──────────
  // Maps our named blur tokens to Tailwind classes.
  const blurClass = {
    "glass-sm": "backdrop-blur-glass-sm",
    "glass":    "backdrop-blur-glass",
    "glass-lg": "backdrop-blur-glass-lg",
  }[blur] ?? "backdrop-blur-glass"

  // ─── Build the shadow class ──────────────────
  const shadowClass = {
    "glass":    "shadow-glass",
    "glass-lg": "shadow-glass-lg",
    "card":     "shadow-card",
    "none":     "",
  }[shadow] ?? "shadow-glass"

  // ─── Compose inline styles ──────────────────
  // The glow is a CSS radial-gradient on a ::before
  // pseudo-element, but since JSX can't write ::before
  // inline, we use a real sibling div for the glow layer.
  // This keeps it off the main compositing stack.
  const panelStyle = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    ...style,
  }

  return (
    <Tag
      ref={ref}
      className={[
        "relative",           // establishes stacking context for children
        blurClass,
        shadowClass,
        rounded,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={panelStyle}
      {...rest}
    >
      {/* ── Ambient Glow Layer ─────────────────
          Rendered as a real div (not ::before) so it
          works inside Framer Motion animated elements.
          Positioned absolutely behind all content.
          pointer-events: none so it never blocks clicks. */}
      {glow && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background: `radial-gradient(${glowSize}px circle at 50% 50%, ${hexToRgba(glow, glowOpacity)}, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* ── Top Highlight Edge ─────────────────
          A 1px gradient at the top of the panel.
          Simulates a light source from above-
          the "polished glass" effect used in Clerk,
          Linear, and Vercel's card components. */}
      {topHighlight && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* ── Panel Content ──────────────────────
          Rendered above glow (z-index: 2) so content
          is never obscured by the glow layer. */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </Tag>
  )
})

// ─── Utility: hex color → rgba string ─────────
// Used to build the glow gradient from a hex color
// + an opacity value without requiring a CSS-in-JS lib.
//
// hexToRgba("#3B82F6", 0.15) → "rgba(59, 130, 246, 0.15)"

function hexToRgba(hex, opacity) {
  // Strip the leading # if present
  const clean = hex.replace("#", "")

  // Handle both 3-digit and 6-digit hex
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean

  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export default GlassPanel