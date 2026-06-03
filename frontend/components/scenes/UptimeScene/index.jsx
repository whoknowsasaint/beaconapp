"use client"

import { useState, useEffect } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { EASE, DURATION, panelVariants, staggerContainerVariants, staggerChildVariants } from "@/lib/motion"
import GlassPanel from "@/components/scenes/shared/GlassPanel"
import SceneWrapper from "@/components/scenes/shared/SceneWrapper"
import styles from "./UptimeScene.module.css"

const SERVICES = [
  {
    name:   "API Gateway",
    status: "operational",
    uptime: 99.98,
    bars:   Array.from({ length: 36 }, (_, i) => i === 34 ? "degraded" : "healthy"),
  },
  {
    name:   "Authentication",
    status: "operational",
    uptime: 100,
    bars:   Array.from({ length: 36 }, () => "healthy"),
  },
  {
    name:   "CDN",
    status: "degraded",
    uptime: 99.71,
    bars:   Array.from({ length: 36 }, (_, i) => (i >= 33) ? "degraded" : "healthy"),
  },
  {
    name:   "Database",
    status: "operational",
    uptime: 99.95,
    bars:   Array.from({ length: 36 }, (_, i) => i === 28 ? "degraded" : "healthy"),
  },
  {
    name:   "Webhooks",
    status: "operational",
    uptime: 100,
    bars:   Array.from({ length: 36 }, () => "healthy"),
  },
]

const BAR_COLOR = {
  healthy:  "#22C55E",
  degraded: "#F59E0B",
  outage:   "#EF4444",
  unknown:  "#374151",
}

const STATUS_CONFIG = {
  operational: { label: "Operational", color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.2)" },
  degraded:    { label: "Degraded",    color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)" },
  outage:      { label: "Outage",      color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.2)"  },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.operational
  return (
    <span
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        gap:           "5px",
        padding:       "2px 8px",
        borderRadius:  "9999px",
        fontSize:      "10px",
        fontWeight:    500,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background:    cfg.bg,
        color:         cfg.color,
        border:        `1px solid ${cfg.border}`,
        flexShrink:    0,
      }}
    >
      <span
        style={{
          display:      "inline-block",
          width:        "5px",
          height:       "5px",
          borderRadius: "50%",
          background:   cfg.color,
          flexShrink:   0,
        }}
      />
      {cfg.label}
    </span>
  )
}

function PingIndicator({ inView, reducedMotion }) {
  return (
    <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          style={{
            position:     "absolute",
            inset:        0,
            borderRadius: "50%",
            border:       "1.5px solid #3B82F6",
          }}
          animate={inView && !reducedMotion ? {
            scale:   [1, 2.2],
            opacity: [0.6, 0],
          } : { scale: 1, opacity: 0.3 }}
          transition={{
            duration: 2,
            ease:     "easeOut",
            repeat:   Infinity,
            delay:    i * 0.65,
          }}
        />
      ))}
      <span
        style={{
          position:     "absolute",
          top:          "50%",
          left:         "50%",
          transform:    "translate(-50%,-50%)",
          width:        "6px",
          height:       "6px",
          borderRadius: "50%",
          background:   "#3B82F6",
        }}
      />
    </div>
  )
}

function SparklinePath({ inView, reducedMotion }) {
  const points = "0,28 8,24 16,20 24,22 32,18 40,14 48,16 56,10 64,12 72,8 80,10 88,16 96,12 104,8 112,6"

  return (
    <svg
      width="120"
      height="36"
      viewBox="0 0 120 36"
      className={styles.sparkline}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        points={points}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{
          pathLength: { duration: DURATION.draw, ease: EASE.entrance, delay: 0.6 },
          opacity:    { duration: 0.3,           delay: 0.6 },
        }}
      />
    </svg>
  )
}

function TimestampTicker({ inView }) {
  const [seconds, setSeconds] = useState(2)

  useEffect(() => {
    if (!inView) return
    const id = setInterval(() => {
      setSeconds(s => (s >= 30 ? 2 : s + 1))
    }, 3000)
    return () => clearInterval(id)
  }, [inView])

  return (
    <span className={styles.timestamp}>
      Last checked: {seconds}s ago
    </span>
  )
}

function ServiceRow({ service, showTooltip, inView, reducedMotion }) {
  const isDegraded = service.status === "degraded"

  return (
    <motion.div
      variants={staggerChildVariants}
      className={styles.serviceRow}
      style={{
        background: isDegraded ? "rgba(245,158,11,0.03)" : "transparent",
        position: "relative",
      }}
    >
      <span
        style={{
          flex:         "0 0 110px",
          fontSize:     "12px",
          fontWeight:   500,
          color:        "rgba(255,255,255,0.85)",
          whiteSpace:   "nowrap",
          overflow:     "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {service.name}
      </span>

      <div className={styles.uptimeBars}>
        {service.bars.map((bar, i) => (
          <div
            key={i}
            className={styles.uptimeBar}
            style={{ background: BAR_COLOR[bar] ?? BAR_COLOR.unknown }}
            title={bar}
          />
        ))}
      </div>

      <StatusBadge status={service.status} />

      {isDegraded && showTooltip && (
        <AnimatePresence>
          <motion.div
            className={styles.tooltip}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            Degraded for 14m · Investigating
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

function UptimeSceneInner({ inView = false, reducedMotion = false }) {
  const [showTooltip,  setShowTooltip]  = useState(false)
  const [panelHovered, setPanelHovered] = useState(false)

  useEffect(() => {
    if (!inView || reducedMotion) return
    const t = setTimeout(() => setShowTooltip(true), 2000)
    return () => clearTimeout(t)
  }, [inView, reducedMotion])

  return (
    <div className={styles.scene}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glowBlue} aria-hidden="true" />
      <div className={styles.glowAmber} aria-hidden="true" />

      <div className={styles.panel}>
        <GlassPanel
          glow="#3B82F6"
          glowOpacity={0.10}
          glowSize={400}
          className="p-5"
          onMouseEnter={() => setPanelHovered(true)}
          onMouseLeave={() => setPanelHovered(false)}
          as={motion.div}
          variants={panelVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          whileHover={reducedMotion ? {} : { y: -4 }}
          transition={{ duration: DURATION.fast, ease: EASE.hover }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PingIndicator inView={inView} reducedMotion={reducedMotion} />
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: "2px" }}>
                  Uptime Monitor
                </p>
                <TimestampTicker inView={inView} />
              </div>
            </div>
            <SparklinePath inView={inView} reducedMotion={reducedMotion} />
          </div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {SERVICES.map(service => (
              <ServiceRow
                key={service.name}
                service={service}
                showTooltip={showTooltip && service.status === "degraded"}
                inView={inView}
                reducedMotion={reducedMotion}
              />
            ))}
          </motion.div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>
              5 services · 1 degraded
            </span>
            <span style={{ fontSize: "11px", color: "#22C55E", fontFamily: "var(--font-mono)" }}>
              99.93% uptime
            </span>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

export default function UptimeScene() {
  return (
    <SceneWrapper
      ariaLabel="Uptime monitoring dashboard showing 5 services, 4 operational and 1 degraded, with a 90-day uptime history and live ping indicator."
      id="scene-uptime-visual"
    >
      <UptimeSceneInner />
    </SceneWrapper>
  )
}