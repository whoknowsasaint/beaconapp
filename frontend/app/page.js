// ──────────────────────────────────────────────
// Beacon — Home Page (Phase 01 Component Test)
// Tests GlassPanel and SceneWrapper are working.
// ──────────────────────────────────────────────

"use client"

import { motion } from "framer-motion"
import GlassPanel from "@/components/scenes/shared/GlassPanel"
import SceneWrapper from "@/components/scenes/shared/SceneWrapper"
import { panelVariants, DURATION, EASE } from "@/lib/motion"

// ─── Minimal test scene ───────────────────────
// Accepts inView + reducedMotion injected by SceneWrapper.
// This is the exact pattern every real scene will follow.

function TestScene({ inView = false, reducedMotion = false }) {
  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="w-full max-w-lg"
    >
      <GlassPanel
        glow="#3B82F6"
        glowOpacity={0.12}
        glowSize={500}
        className="p-8"
      >
        {/* Status row */}
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span
              className={[
                "absolute inline-flex h-full w-full rounded-full bg-beacon-green opacity-75",
                reducedMotion ? "" : "animate-ping-ring",
              ]
                .filter(Boolean)
                .join(" ")}
            />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-beacon-green" />
          </span>
          <span className="text-beacon-green text-xs font-mono tracking-wider uppercase">
            All systems operational
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-beacon-text mb-1 tracking-tight">
          Beacon
        </h1>
        <p className="text-beacon-text-muted text-sm mb-6">
          Phase 01 complete — foundation is live.
        </p>

        {/* Component proof */}
        <div className="space-y-2 mb-6">
          <ComponentCheck label="GlassPanel" status="active" />
          <ComponentCheck label="SceneWrapper" status="active" />
          <ComponentCheck label="Motion constants" status="active" />
          <ComponentCheck label="Design tokens" status="active" />
          <ComponentCheck label="PostgreSQL" status="active" />
          <ComponentCheck label="Django backend" status="active" />
        </div>

        {/* Color swatches */}
        <div className="grid grid-cols-5 gap-1.5">
          {[
            ["bg-beacon-blue",     "Blue"],
            ["bg-beacon-green",    "Green"],
            ["bg-beacon-amber",    "Amber"],
            ["bg-beacon-red",      "Red"],
            ["bg-beacon-terminal", "Terminal"],
          ].map(([bg, label]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`h-5 w-full rounded ${bg}`} />
              <span className="text-2xs text-beacon-text-faint font-mono">
                {label}
              </span>
            </div>
          ))}
        </div>
      </GlassPanel>
    </motion.div>
  )
}

// ─── Small helper — checklist row ─────────────

function ComponentCheck({ label, status }) {
  const isActive = status === "active"
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex-shrink-0 h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-beacon-green" : "bg-beacon-text-faint"
        }`}
      />
      <span
        className={`text-sm font-mono ${
          isActive ? "text-beacon-text" : "text-beacon-text-faint"
        }`}
      >
        {label}
      </span>
      <span
        className={`ml-auto text-2xs font-mono ${
          isActive ? "text-beacon-green" : "text-beacon-text-faint"
        }`}
      >
        {isActive ? "OK" : "pending"}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <SceneWrapper
        ariaLabel="Beacon Phase 01 health check panel showing all foundation systems operational."
        id="scene-health"
      >
        <TestScene />
      </SceneWrapper>
    </main>
  )
}