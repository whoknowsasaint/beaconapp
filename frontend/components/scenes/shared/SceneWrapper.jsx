// ──────────────────────────────────────────────
// Beacon — SceneWrapper
//
// The mandatory container for every product scene.
// Handles all cross-cutting concerns so individual
// scenes never need to:
//
//   1. Detect when they enter the viewport
//   2. Check for prefers-reduced-motion
//   3. Set accessibility role/label
//   4. Enforce consistent max-width / layout
//
// Usage:
//   <SceneWrapper ariaLabel="Uptime monitoring dashboard...">
//     <UptimeScene inView={inView} reducedMotion={reducedMotion} />
//   </SceneWrapper>
//
// Props:
//   children      — the scene component
//   ariaLabel     — REQUIRED: full description for screen readers
//   className     — additional class on the outer container
//   innerClassName — additional class on the inner container
//   threshold     — IntersectionObserver threshold (default: 0.2)
//   id            — optional id for anchor links (e.g. "scene-uptime")
// ──────────────────────────────────────────────

"use client"

import { useRef, useState, useEffect, cloneElement, Children } from "react"
import { useReducedMotion } from "framer-motion"
import styles from "./SceneWrapper.module.css"

export default function SceneWrapper({
  children,
  ariaLabel,
  className = "",
  innerClassName = "",
  threshold = 0.2,
  id,
}) {
  // ─── Reduced Motion ──────────────────────────
  // Framer Motion's hook reads the OS/browser
  // prefers-reduced-motion media query once and
  // returns a stable boolean. We pass it to all
  // children so they can disable their animations.
  const reducedMotion = useReducedMotion()

  // ─── Viewport Detection ──────────────────────
  // We use a manual IntersectionObserver rather than
  // Framer Motion's useInView so we have full control
  // over the threshold and can pass `inView` as a prop
  // to children — keeping scenes as pure as possible.
  const outerRef = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = outerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Once in view, stay in view — animations
            // don't reset when the user scrolls back up.
            setInView(true)
            observer.unobserve(element)
          }
        })
      },
      {
        threshold,
        // Small negative rootMargin delays trigger
        // until the scene is meaningfully visible.
        rootMargin: "0px 0px -60px 0px",
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  // ─── Pass inView + reducedMotion to children ─
  // We clone each child and inject the two props.
  // This keeps scene components clean — they just
  // destructure { inView, reducedMotion } from props.
  const enhancedChildren = Children.map(children, (child) => {
    if (!child) return null
    return cloneElement(child, {
      inView: reducedMotion ? true : inView,
      reducedMotion: reducedMotion ?? false,
    })
  })

  return (
    <section
      ref={outerRef}
      id={id}
      // ── Accessibility ────────────────────────
      // role="img" treats the entire scene as a single
      // image for screen readers. The aria-label provides
      // the full description. Decorative SVG elements
      // inside scenes use aria-hidden="true".
      role="img"
      aria-label={ariaLabel}
      className={[
        styles.sceneOuter,
        reducedMotion ? styles.reducedMotion : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[styles.sceneInner, innerClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {enhancedChildren}
      </div>
    </section>
  )
}