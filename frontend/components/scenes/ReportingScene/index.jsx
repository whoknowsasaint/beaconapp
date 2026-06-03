"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { EASE, DURATION, panelVariants } from "@/lib/motion"
import GlassPanel from "@/components/scenes/shared/GlassPanel"
import SceneWrapper from "@/components/scenes/shared/SceneWrapper"
import styles from "./ReportingScene.module.css"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

const BAR_DATA = [
  { month: "Jan", pct: 100,  status: "green"  },
  { month: "Feb", pct: 100,  status: "green"  },
  { month: "Mar", pct: 99.9, status: "green"  },
  { month: "Apr", pct: 100,  status: "green"  },
  { month: "May", pct: 100,  status: "green"  },
  { month: "Jun", pct: 99.9, status: "green"  },
  { month: "Jul", pct: 100,  status: "green"  },
  { month: "Aug", pct: 99.71,status: "amber"  },
  { month: "Sep", pct: 100,  status: "green"  },
  { month: "Oct", pct: 100,  status: "green"  },
  { month: "Nov", pct: 99.9, status: "green"  },
  { month: "Dec", pct: 100,  status: "green"  },
]

const SLA_PCT = 99.9
const MAX_HEIGHT = 80

const BAR_COLOR = {
  green: "#22C55E",
  amber: "#F59E0B",
}

function useCountUp(target, duration, active) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!active || target === 0) return
    const start     = performance.now()
    const startVal  = 0

    function tick(now) {
      const elapsed  = now - start
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(startVal + (target - startVal) * eased)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [active, target, duration])

  return value
}

function BarChart({ inView, reducedMotion }) {
  const [hoveredBar, setHoveredBar] = useState(null)
  const [autoTooltip, setAutoTooltip] = useState(false)

  useEffect(() => {
    if (!inView || reducedMotion) return
    const t = setTimeout(() => setAutoTooltip(true), 1800)
    return () => clearTimeout(t)
  }, [inView, reducedMotion])

  const slaLineY = ((100 - SLA_PCT) / (100 - 99.5)) * MAX_HEIGHT

  return (
    <div className={styles.chartArea}>
      {BAR_DATA.map((bar, i) => {
        const h          = ((bar.pct - 99.5) / (100 - 99.5)) * MAX_HEIGHT
        const isHovered  = hoveredBar === i
        const showTip    = isHovered || (autoTooltip && bar.status === "amber" && hoveredBar === null)
        const color      = BAR_COLOR[bar.status]

        return (
          <div
            key={bar.month}
            className={styles.bar}
            style={{ height: `${h}px`, background: color, opacity: isHovered ? 1 : 0.85 }}
            onMouseEnter={() => { setHoveredBar(i); setAutoTooltip(false) }}
            onMouseLeave={() => setHoveredBar(null)}
          >
            <motion.div
              style={{
                position: "absolute",
                inset:    0,
                background: color,
                borderRadius: "3px 3px 0 0",
                transformOrigin: "bottom",
              }}
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : {}}
              transition={{
                duration: DURATION.draw,
                ease:     EASE.entrance,
                delay:    0.1 + i * 0.05,
              }}
            />

            {showTip && (
              <AnimatePresence>
                <motion.div
                  className={styles.tooltip}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{    opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  {bar.month} · {bar.pct}% · {bar.status === "amber" ? "2 incidents" : "No incidents"}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )
      })}

      <motion.div
        className={styles.slaLine}
        style={{
          bottom:     `${slaLineY}px`,
          background: "rgba(59,130,246,0.5)",
          boxShadow:  "0 0 6px rgba(59,130,246,0.4)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{
          duration:   DURATION.draw,
          ease:       EASE.entrance,
          delay:      0.8,
          scaleX:     { duration: DURATION.draw },
          transformOrigin: "left",
        }}
      >
        <span className={styles.slaLabel}>SLA 99.9%</span>
      </motion.div>
    </div>
  )
}

function ReportingSceneInner({ inView = false, reducedMotion = false }) {
  const uptimeVal = useCountUp(99.94, DURATION.draw, inView && !reducedMotion)
  const displayPct = reducedMotion ? "99.94" : uptimeVal.toFixed(2)

  return (
    <div className={styles.scene}>
      <div className={styles.glowCenter} aria-hidden="true" />

      <div className={styles.panel}>
        <GlassPanel
          glow="#3B82F6"
          glowOpacity={0.07}
          glowSize={380}
          className="p-5"
          as={motion.div}
          variants={panelVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          style={{ position: "relative" }}
        >
          <div className={styles.tabBar}>
            {["30 days", "90 days", "12 months"].map(t => (
              <span key={t} className={[styles.tab, t === "12 months" ? styles.tabActive : ""].join(" ")}>
                {t}
              </span>
            ))}
          </div>

          <BarChart inView={inView} reducedMotion={reducedMotion} />

          <div style={{
            display:      "flex",
            gap:          "2px",
            marginBottom: "10px",
          }}>
            {MONTHS.map(m => (
              <span key={m} style={{
                flex:       1,
                textAlign:  "center",
                fontSize:   "7px",
                color:      "rgba(255,255,255,0.2)",
                fontFamily: "var(--font-mono)",
              }}>
                {m}
              </span>
            ))}
          </div>

          <div className={styles.summaryRow}>
            <div>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>Average uptime</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#22C55E", fontFamily: "var(--font-mono)" }}>
                {displayPct}%
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>Total downtime</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono)" }}>
                3h 12m
              </p>
            </div>
          </div>

          <motion.div
            className={styles.exportBadge}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: 1 }}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 9, height: 9 }}>
              <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5M2 10h8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export PDF
          </motion.div>
        </GlassPanel>
      </div>
    </div>
  )
}

export default function ReportingScene() {
  return (
    <SceneWrapper
      ariaLabel="Historical reporting panel showing 12 months of uptime data with 99.94% average uptime and one degraded month in August."
      id="scene-reporting-visual"
    >
      <ReportingSceneInner />
    </SceneWrapper>
  )
}