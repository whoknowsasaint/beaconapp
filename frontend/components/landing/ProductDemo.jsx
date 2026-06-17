"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

const STEP_DURATION = 4500

const STEPS = [
  {
    number:      "01",
    title:       "Add a monitor",
    description: "Point Beacon at any HTTP endpoint, TCP port, or host. Checks start in under 30 seconds.",
    ui:          "monitor-form",
  },
  {
    number:      "02",
    title:       "Checks run automatically",
    description: "Beacon pings your service on your chosen interval and records response time and status.",
    ui:          "checks-running",
  },
  {
    number:      "03",
    title:       "Incident detected",
    description: "A failed check instantly opens an incident, sets severity, and notifies your team.",
    ui:          "incident-open",
  },
  {
    number:      "04",
    title:       "Subscribers notified",
    description: "Telegram, Slack, and email subscribers receive structured alerts the moment it opens.",
    ui:          "notification",
  },
  {
    number:      "05",
    title:       "Back to operational",
    description: "When checks pass again, the incident auto-resolves and subscribers get the all-clear.",
    ui:          "resolved",
  },
]

/* ─── Step UIs ──────────────────────────────────────────────────────────────── */

function MonitorFormUI() {
  const [typed, setTyped] = useState("")
  const full              = "https://api.acme.com/health"

  useEffect(() => {
    setTyped("")
    let i = 0
    const id = setInterval(() => {
      i++
      setTyped(full.slice(0, i))
      if (i >= full.length) clearInterval(id)
    }, 38)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ padding: "24px 28px" }}>
      <p
        style={{
          fontSize:    13,
          fontWeight:  600,
          color:       "rgba(255,255,255,0.85)",
          marginBottom: 20,
        }}
      >
        Add monitor
      </p>

      {[
        { label: "Name", value: "API Gateway"  },
        { label: "Type", value: "HTTP / HTTPS" },
      ].map(f => (
        <div key={f.label} style={{ marginBottom: 14 }}>
          <label
            style={{
              display:      "block",
              fontSize:     11,
              fontWeight:   500,
              color:        "rgba(255,255,255,0.55)",
              marginBottom: 5,
            }}
          >
            {f.label}
          </label>
          <div
            style={{
              height:       34,
              borderRadius: 7,
              background:   "rgba(255,255,255,0.04)",
              border:       "1px solid rgba(255,255,255,0.1)",
              display:      "flex",
              alignItems:   "center",
              padding:      "0 10px",
              fontSize:     12,
              color:        "rgba(255,255,255,0.65)",
            }}
          >
            {f.value}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display:      "block",
            fontSize:     11,
            fontWeight:   500,
            color:        "rgba(255,255,255,0.55)",
            marginBottom: 5,
          }}
        >
          URL
        </label>
        <div
          style={{
            height:       34,
            borderRadius: 7,
            background:   "rgba(255,255,255,0.04)",
            border:       "1px solid rgba(59,130,246,0.5)",
            boxShadow:    "0 0 0 3px rgba(59,130,246,0.1)",
            display:      "flex",
            alignItems:   "center",
            padding:      "0 10px",
            fontSize:     12,
            fontFamily:   "var(--font-jetbrains-mono, monospace)",
            color:        "rgba(255,255,255,0.8)",
          }}
        >
          {typed}
          <span
            style={{
              display:    "inline-block",
              width:      1,
              height:     14,
              background: "#3B82F6",
              marginLeft: 1,
              animation:  "cursorBlink 1s step-end infinite",
            }}
          />
        </div>
      </div>

      <div
        style={{
          height:         34,
          borderRadius:   7,
          background:     "#3B82F6",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       12,
          fontWeight:     500,
          color:          "white",
        }}
      >
        Start monitoring
      </div>
    </div>
  )
}

function ChecksRunningUI() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 700)
    return () => clearInterval(id)
  }, [])

  const rows = [
    { name: "API Gateway",    ms: [142, 138, 145, 141] },
    { name: "Authentication", ms: [89, 92, 88, 91]     },
    { name: "CDN",            ms: [34, 36, 35, 33]     },
    { name: "Database",       ms: [12, 11, 13, 12]     },
  ]

  return (
    <div style={{ padding: "18px 24px" }}>
      <div
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          8,
          marginBottom: 16,
        }}
      >
        <motion.span
          style={{
            width:        8,
            height:       8,
            borderRadius: "50%",
            background:   "#22C55E",
            display:      "inline-block",
          }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span
          style={{
            fontSize:   11,
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color:      "rgba(255,255,255,0.45)",
          }}
        >
          Live monitoring- Last check: {tick % 30}s ago
        </span>
      </div>

      {rows.map((row, i) => (
        <div
          key={row.name}
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        10,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width:        6,
              height:       6,
              borderRadius: "50%",
              background:   "#22C55E",
              display:      "inline-block",
              flexShrink:   0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color:    "rgba(255,255,255,0.6)",
              flex:     1,
            }}
          >
            {row.name}
          </span>
          <span
            style={{
              fontSize:   10,
              fontFamily: "var(--font-jetbrains-mono, monospace)",
              color:      "rgba(255,255,255,0.4)",
              minWidth:   42,
              textAlign:  "right",
            }}
          >
            {row.ms[tick % row.ms.length]}ms
          </span>
          <div style={{ display: "flex", gap: 1.5 }}>
            {Array.from({ length: 12 }).map((_, j) => (
              <div
                key={j}
                style={{
                  width:        2.5,
                  height:       12,
                  borderRadius: 1,
                  background:   "#22C55E",
                  opacity:      j === (tick + i) % 12 ? 1 : 0.4,
                  transition:   "opacity 0.2s",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function IncidentOpenUI() {
  return (
    <div style={{ padding: "18px 24px" }}>
      <div style={{ marginBottom: 16 }}>
        <p
          style={{
            fontSize:    12,
            fontWeight:  600,
            color:       "rgba(255,255,255,0.9)",
            marginBottom: 5,
          }}
        >
          API Gateway- Elevated Error Rate
        </p>
        <motion.span
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            display:       "inline-flex",
            alignItems:    "center",
            gap:           5,
            padding:       "2px 9px",
            borderRadius:  "9999px",
            fontSize:      9,
            fontWeight:    600,
            textTransform: "uppercase",
            background:    "rgba(239,68,68,0.12)",
            color:         "#EF4444",
            border:        "1px solid rgba(239,68,68,0.25)",
            boxShadow:     "0 0 10px rgba(239,68,68,0.2)",
          }}
        >
          <motion.span
            style={{
              width:        5,
              height:       5,
              borderRadius: "50%",
              background:   "#EF4444",
              display:      "inline-block",
            }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          Critical · Auto-detected
        </motion.span>
      </div>

      <div
        style={{
          background:   "rgba(239,68,68,0.06)",
          border:       "1px solid rgba(239,68,68,0.15)",
          borderRadius: 8,
          padding:      "10px 12px",
          marginBottom: 14,
        }}
      >
        <p
          style={{
            fontSize:  11,
            color:     "rgba(255,255,255,0.5)",
            lineHeight: 1.6,
          }}
        >
          Automated check failed at 09:42 UTC. Connection refused on{" "}
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono, monospace)",
              color:      "rgba(255,255,255,0.7)",
            }}
          >
            api.acme.com:443
          </span>
          . Incident opened automatically.
        </p>
      </div>

      {/* Mini stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {["Investigating", "Identified", "Monitoring", "Resolved"].map((s, i) => (
          <div key={s} className="flex items-center" style={{ flex: i < 3 ? 1 : "none" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width:          18,
                  height:         18,
                  borderRadius:   "50%",
                  border:         `2px solid ${i === 0 ? "#EF4444" : "rgba(255,255,255,0.12)"}`,
                  background:     i === 0 ? "rgba(239,68,68,0.15)" : "transparent",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  margin:         "0 auto 4px",
                }}
              >
                <span
                  style={{
                    width:        4,
                    height:       4,
                    borderRadius: "50%",
                    background:
                      i === 0 ? "#EF4444" : "rgba(255,255,255,0.15)",
                    display:      "inline-block",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize:   8,
                  color:
                    i === 0
                      ? "rgba(255,255,255,0.8)"
                      : "rgba(255,255,255,0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                {s}
              </span>
            </div>
            {i < 3 && (
              <div
                style={{
                  flex:         1,
                  height:       1,
                  background:   "rgba(255,255,255,0.08)",
                  margin:       "0 3px",
                  marginBottom: 12,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationUI() {
  const CHANNELS = [
    {
      platform: "Telegram",
      detail:   "847 subscribers",
      delay:    0,
      bg:       "linear-gradient(145deg, #2AABEE, #1A97D4)",
      shadow:   "0 4px 14px rgba(34,158,217,0.45)",
      icon: (
        <svg viewBox="0 0 24 24" fill="white" style={{ width: 22, height: 22 }}>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
    },
    {
      platform: "Slack",
      detail:   "#ops-alerts",
      delay:    0.18,
      bg:       "linear-gradient(145deg, #611F69, #4A154B)",
      shadow:   "0 4px 14px rgba(74,21,75,0.5)",
      icon: (
        <svg viewBox="0 0 24 24" fill="white" style={{ width: 20, height: 20 }}>
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
        </svg>
      ),
    },
    {
      platform: "Email",
      detail:   "12 subscribers",
      delay:    0.36,
      bg:       "linear-gradient(145deg, #4285F4, #2A6FE8)",
      shadow:   "0 4px 14px rgba(66,133,244,0.4)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M2 7l10 7 10-7"/>
        </svg>
      ),
    },
  ]

  return (
    <div style={{ padding: "22px 28px" }}>
      <p style={{ fontSize: 11, fontFamily: "var(--font-jetbrains-mono,monospace)", color: "rgba(255,255,255,0.38)", marginBottom: 16 }}>
        Notifying 847 subscribers...
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CHANNELS.map(ch => (
          <motion.div
            key={ch.platform}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: ch.delay, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          12,
              padding:      "10px 14px",
              borderRadius: 10,
              background:   "rgba(255,255,255,0.03)",
              border:       "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{
              width:          38,
              height:         38,
              borderRadius:   10,
              background:     ch.bg,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
              boxShadow:      ch.shadow,
              position:       "relative",
              overflow:       "hidden",
            }}>
              <div style={{
                position:     "absolute",
                top:          0,
                left:         0,
                right:        0,
                height:       "50%",
                background:   "linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)",
                borderRadius: "10px 10px 0 0",
                pointerEvents:"none",
              }} />
              <div style={{ position: "relative", zIndex: 1 }}>{ch.icon}</div>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 1 }}>
                {ch.platform}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                {ch.detail}
              </p>
            </div>

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.28, delay: ch.delay + 0.35, type: "spring", stiffness: 260 }}
              style={{
                width:          22,
                height:         22,
                borderRadius:   "50%",
                background:     "rgba(34,197,94,0.15)",
                border:         "1.5px solid rgba(34,197,94,0.4)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
              }}
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="#22C55E" strokeWidth="2" style={{ width: 10, height: 10 }}>
                <path d="M1.5 6l3 3 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ResolvedUI() {
  return (
    <div
      style={{
        padding:        "24px 28px",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        textAlign:      "center",
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        style={{
          width:          52,
          height:         52,
          borderRadius:   "50%",
          background:     "rgba(34,197,94,0.12)",
          border:         "2px solid rgba(34,197,94,0.3)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          marginBottom:   14,
        }}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="#22C55E"
          strokeWidth="2.5"
          style={{ width: 22, height: 22 }}
        >
          <path
            d="M3 10l5 5 9-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{ fontSize: 16, fontWeight: 700, color: "#22C55E", marginBottom: 6 }}
      >
        All Systems Operational
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}
      >
        Incident resolved · Duration: 23m · 847 subscribers notified
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        style={{
          width:        "100%",
          background:   "rgba(34,197,94,0.06)",
          border:       "1px solid rgba(34,197,94,0.15)",
          borderRadius: 8,
          padding:      "8px 14px",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
          Last 90 days uptime
        </span>
        <span
          style={{
            fontSize:   14,
            fontWeight: 700,
            color:      "#22C55E",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
          }}
        >
          99.94%
        </span>
      </motion.div>
    </div>
  )
}

const UI_MAP = {
  "monitor-form":   MonitorFormUI,
  "checks-running": ChecksRunningUI,
  "incident-open":  IncidentOpenUI,
  "notification":   NotificationUI,
  "resolved":       ResolvedUI,
}

/* ─── Main component ────────────────────────────────────────────────────────── */

export default function ProductDemo() {
  const [active,   setActive]   = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef             = useRef(null)
  const progressRef             = useRef(null)

  const startProgress = useCallback((stepIndex) => {
    setProgress(0)
    setActive(stepIndex)

    if (progressRef.current) clearInterval(progressRef.current)
    progressRef.current = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + 100 / (STEP_DURATION / 50)))
    }, 50)

    if (intervalRef.current) clearTimeout(intervalRef.current)
    intervalRef.current = setTimeout(() => {
      startProgress((stepIndex + 1) % STEPS.length)
    }, STEP_DURATION)
  }, [])

  useEffect(() => {
    startProgress(0)
    return () => {
      if (intervalRef.current)  clearTimeout(intervalRef.current)
      if (progressRef.current)  clearInterval(progressRef.current)
    }
  }, [startProgress])

  function goTo(i) {
    if (progressRef.current) clearInterval(progressRef.current)
    if (intervalRef.current)  clearTimeout(intervalRef.current)
    startProgress(i)
  }

  const UIComponent = UI_MAP[STEPS[active].ui]

  return (
    <section className="max-w-6xl mx-auto px-4 pb-20">
      <div className="text-center mb-12">
        <p
          className="text-xs font-mono uppercase tracking-widest mb-3"
          style={{ color: "rgba(59,130,246,0.8)" }}
        >
          See it in action
        </p>
        <h2
          className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          From zero to operational in minutes
        </h2>
        <p
          className="text-base max-w-md mx-auto"
          style={{ color: "rgba(255,255,255,0.42)" }}
        >
          Watch how Beacon handles a real incident- from detection to resolution.
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.08)", background: "#0D0F12" }}
      >
        <div className="flex flex-col lg:flex-row">
          {/* Left- step list */}
          <div
            className="lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r"
            style={{ borderColor: "rgba(255,255,255,0.07)", padding: "24px 20px" }}
          >
            <p
              className="text-xs font-medium mb-5"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              Beacon workflow
            </p>

            <div className="flex flex-col gap-1">
              {STEPS.map((step, i) => {
                const isActive = i === active
                const isDone   = i < active

                return (
                  <button
                    key={step.number}
                    onClick={() => goTo(i)}
                    className="flex items-start gap-3 text-left rounded-lg px-3 py-2.5 w-full transition-colors duration-150"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                    }}
                  >
                    {/* SVG progress circle */}
                    <div style={{ position: "relative", flexShrink: 0, marginTop: 1 }}>
                      <svg viewBox="0 0 20 20" style={{ width: 20, height: 20 }}>
                        <circle
                          cx="10"
                          cy="10"
                          r="8.5"
                          fill="none"
                          stroke={
                            isActive
                              ? "rgba(59,130,246,0.25)"
                              : isDone
                              ? "rgba(34,197,94,0.25)"
                              : "rgba(255,255,255,0.1)"
                          }
                          strokeWidth="1.5"
                        />
                        {isActive && (
                          <motion.circle
                            cx="10"
                            cy="10"
                            r="8.5"
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="1.5"
                            strokeDasharray={`${(2 * Math.PI * 8.5 * progress) / 100} 9999`}
                            strokeLinecap="round"
                            transform="rotate(-90 10 10)"
                          />
                        )}
                        {isDone ? (
                          <>
                            <circle cx="10" cy="10" r="8.5" fill="rgba(34,197,94,0.1)" />
                            <path
                              d="M6.5 10l2.5 2.5 4.5-4.5"
                              stroke="#22C55E"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </>
                        ) : !isActive ? (
                          <text
                            x="10"
                            y="14"
                            textAnchor="middle"
                            fontSize="7"
                            fill="rgba(255,255,255,0.28)"
                            fontFamily="var(--font-jetbrains-mono, monospace)"
                          >
                            {step.number}
                          </text>
                        ) : null}
                      </svg>
                    </div>

                    <div>
                      <p
                        style={{
                          fontSize:  12,
                          fontWeight: isActive ? 600 : 400,
                          color:     isActive
                            ? "rgba(255,255,255,0.9)"
                            : isDone
                            ? "rgba(255,255,255,0.45)"
                            : "rgba(255,255,255,0.38)",
                          marginBottom: isActive ? 4 : 0,
                        }}
                      >
                        {step.title}
                      </p>
                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          style={{
                            fontSize:  11,
                            color:     "rgba(255,255,255,0.38)",
                            lineHeight: 1.5,
                          }}
                        >
                          {step.description}
                        </motion.p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right- animated product UI */}
          <div className="flex-1" style={{ minHeight: 320 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{    opacity: 0, x: -14 }}
                transition={{ duration: 0.22 }}
                style={{ height: "100%" }}
              >
                <UIComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}