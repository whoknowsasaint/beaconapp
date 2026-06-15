"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

/* ─── Shared animation hook ─────────────────────────────────────────────────── */

function useFeatureAnimation() {
  const ref                    = useRef(null)
  const [active, setActive]    = useState(false)
  const [isTouch, setIsTouch]  = useState(false)
  const reducedMotion           = useReducedMotion()

  useEffect(() => { setIsTouch(window.matchMedia("(hover: none)").matches) }, [])

  useEffect(() => {
    if (!ref.current || reducedMotion || !isTouch) return
    const obs = new IntersectionObserver(
      ([e]) => setActive(e.isIntersecting), { threshold: 0.5 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [reducedMotion, isTouch])

  return {
    ref,
    active,
    onMouseEnter: () => !isTouch && !reducedMotion && setActive(true),
    onMouseLeave: () => !isTouch && setActive(false),
  }
}

/* ─── Card shell ─────────────────────────────────────────────────────────────── */

function FeatureCard({ title, description, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden flex flex-col ${className}`}
      style={{
        background:  "#17171A",
        borderColor: "rgba(255,255,255,0.1)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.02), 0 1px 3px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {children}
      </div>
      <div className="px-5 py-5 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <p
          className="font-semibold mb-1.5"
          style={{ fontSize: 15, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}
        >
          {title}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
          {description}
        </p>
      </div>
    </div>
  )
}

/* ─── Mini UI 1: Uptime ─────────────────────────────────────────────────────── */

const UPTIME_SERVICES = [
  { name: "API Gateway",    degraded: false },
  { name: "Authentication", degraded: false },
  { name: "CDN",            degraded: true  },
  { name: "Database",       degraded: false },
  { name: "Webhooks",       degraded: false },
]

function makeBars(degraded) {
  return Array.from({ length: 16 }, (_, i) =>
    degraded && i >= 14 ? "degraded" : "healthy"
  )
}

function UptimeVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()
  const [tick,     setTick]     = useState(4)
  const [scanLine, setScanLine] = useState(0)  // idle: scanner sweeps rows
  const reducedMotion            = useReducedMotion()

  
  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => setTick(t => t >= 29 ? 2 : t + 1), 3000)
    return () => clearInterval(id)
  }, [reducedMotion])

 
  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => setScanLine(s => (s + 1) % 5), 1400)
    return () => clearInterval(id)
  }, [reducedMotion])

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full flex flex-col justify-center gap-2.5 px-5 py-5"
      style={{ background: "#0C0E12" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <motion.span
            style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", display: "inline-block" }}
            animate={!reducedMotion ? { opacity: [1, 0.35, 1], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
            Uptime Monitor
          </span>
        </div>
        <motion.span
          key={tick}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}
        >
          Last checked: {tick}s ago
        </motion.span>
      </div>

      {/* Service rows */}
      {UPTIME_SERVICES.map((svc, rowIdx) => {
        const bars      = makeBars(svc.degraded)
        const animating = active && svc.degraded
        const isScanned = scanLine === rowIdx && !active

        return (
          <motion.div
            key={svc.name}
            className="flex items-center gap-3"
            animate={isScanned && !reducedMotion ? { background: ["rgba(255,255,255,0)", "rgba(255,255,255,0.025)", "rgba(255,255,255,0)"] } : {}}
            transition={{ duration: 0.8 }}
            style={{ borderRadius: 6, padding: "1px 4px", margin: "0 -4px" }}
          >
            {/* Status dot */}
            <motion.span
              style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0 }}
              animate={
                animating
                  ? { backgroundColor: ["#22C55E","#F59E0B","#22C55E"], scale: [1,1.6,1] }
                  : isScanned && !reducedMotion
                    ? { scale: [1, 1.35, 1] }
                    : !reducedMotion && svc.degraded
                      ? { backgroundColor: "#F59E0B", opacity: [1, 0.45, 1] }
                      : { backgroundColor: svc.degraded ? "#F59E0B" : "#22C55E" }
              }
              transition={{
                duration: animating ? 1.5 : isScanned ? 0.8 : 2.5,
                repeat:   (animating || (!reducedMotion && svc.degraded)) ? Infinity : 0,
              }}
            />

            <span style={{ flex:1, fontSize:11, color: isScanned && !reducedMotion ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.6)", fontFamily:"var(--font-jetbrains-mono,monospace)", transition: "color 0.4s" }}>
              {svc.name}
            </span>

            {/* 16 bars — rightmost lights up on scan */}
            <div className="flex gap-0.5">
              {bars.map((bar, j) => (
                <motion.div
                  key={j}
                  style={{ width: 4, height: 20, borderRadius: 1.5 }}
                  animate={
                    bar === "degraded"
                      ? { backgroundColor: "#F59E0B", opacity: active ? 1 : 0.6 }
                      : isScanned && j === 15 && !reducedMotion
                        ? { backgroundColor: ["#22C55E","#4ADE80","#22C55E"], opacity: [0.65, 1, 0.65] }
                        : { backgroundColor: "#22C55E", opacity: 0.65 }
                  }
                  transition={{ duration: bar === "degraded" ? 0.3 : 0.6 }}
                />
              ))}
            </div>

            {/* Badge */}
            <span style={{
              fontSize:9, padding:"2px 7px", borderRadius:"9999px", fontWeight:500,
              textTransform:"uppercase", letterSpacing:"0.04em", flexShrink:0,
              background: svc.degraded ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.10)",
              color:      svc.degraded ? "#F59E0B" : "#22C55E",
              border:     `1px solid ${svc.degraded ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.2)"}`,
            }}>
              {svc.degraded ? "Degraded" : "Operational"}
            </span>
          </motion.div>
        )
      })}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity:0, y:8, height:0 }}
            animate={{ opacity:1, y:0, height:"auto" }}
            exit={{    opacity:0, y:4, height:0 }}
            transition={{ duration:0.25 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg mt-1 overflow-hidden"
            style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)" }}
          >
            <motion.span
              style={{ width:5, height:5, borderRadius:"50%", background:"#F59E0B", display:"inline-block", flexShrink:0 }}
              animate={{ opacity:[1,0.3,1], scale:[1,1.2,1] }}
              transition={{ duration:1.2, repeat:Infinity }}
            />
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.6)", fontFamily:"var(--font-jetbrains-mono,monospace)" }}>
              CDN degraded for 14m · Investigating
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Mini UI 2: Incident ───────────────────────────────────────────────────── */

const INC_STEPS = [
  { label:"Investigating", color:"#EF4444" },
  { label:"Identified",    color:"#F59E0B" },
  { label:"Monitoring",    color:"#3B82F6" },
  { label:"Resolved",      color:"#22C55E" },
]

const INC_UPDATES = [
  "Investigating elevated error rates on API Gateway.",
  "Root cause identified: misconfigured load balancer.",
  "Fix deployed. Monitoring for full recovery.",
]

function IncidentVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()
  const [step, setStep] = useState(0)
  const [idlePulse, setIdlePulse] = useState(false)
  const reducedMotion = useReducedMotion()

 
  const STEP_COLORS = {
    "#EF4444": { full: "#EF4444", faint: "rgba(239,68,68,0.15)" },
    "#F59E0B": { full: "#F59E0B", faint: "rgba(245,158,11,0.15)" },
    "#3B82F6": { full: "#3B82F6", faint: "rgba(59,130,246,0.15)" },
    "#22C55E": { full: "#22C55E", faint: "rgba(34,197,94,0.15)" },
  }

  
  useEffect(() => {
    if (!active) { setStep(0); return }
    const id = setInterval(() => setStep(s => (s < 2 ? s + 1 : s)), 1400)
    return () => clearInterval(id)
  }, [active])


  useEffect(() => {
    if (reducedMotion || active) return
    const id = setInterval(() => {
      setIdlePulse(true)
      setTimeout(() => setIdlePulse(false), 800)
    }, 4000)
    return () => clearInterval(id)
  }, [reducedMotion, active])

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full flex flex-col justify-center px-5 py-5"
      style={{ background: "linear-gradient(160deg,rgba(239,68,68,0.06) 0%,#0C0E12 60%)" }}
    >
      <div className="mb-4">
        <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 5 }}>
          API Gateway — Elevated Error Rate
        </p>

        <motion.span
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px",
            borderRadius: "9999px", fontSize: 9, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.05em", background: "rgba(239,68,68,0.12)", color: "#EF4444",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
          animate={
            active
              ? { boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 14px rgba(239,68,68,0.45)", "0 0 0px rgba(239,68,68,0)"] }
              : idlePulse && !reducedMotion
                ? { boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 10px rgba(239,68,68,0.3)", "0 0 0px rgba(239,68,68,0)"] }
                : {}
          }
          transition={{ duration: active ? 2 : 0.8, repeat: active ? Infinity : 0 }}
        >
          <motion.span
            style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF4444", display: "inline-block" }}
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          Critical
        </motion.span>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-1 mb-4">
        {INC_STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center" style={{ flex: i < 3 ? 1 : "none" }}>
            <div className="flex flex-col items-center gap-1">
              <motion.div
                style={{
                  width: 22, height: 22, borderRadius: "50%", border: "2px solid",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
                animate={{
                  borderColor: i <= step ? s.color : "rgba(255,255,255,0.12)",
                  backgroundColor: i < step
                    ? STEP_COLORS[s.color]?.full ?? s.color
                    : i === step
                      ? STEP_COLORS[s.color]?.faint ?? "rgba(255,255,255,0.08)"
                      : "transparent",
                  scale: i === step && active ? [1, 1.08, 1] : 1,
                }}
                transition={{ duration: i === step ? 1.2 : 0.3, repeat: i === step && active ? Infinity : 0 }}
              >
                {i < step ? (
                  <motion.svg
                    viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2"
                    style={{ width: 7, height: 7 }}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.25, type: "spring", stiffness: 280 }}
                  >
                    <polyline points="1.5,5 4,7.5 8.5,2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                ) : (
                  <motion.span
                    style={{ width: 5, height: 5, borderRadius: "50%", display: "inline-block" }}
                    animate={{ backgroundColor: i === step ? s.color : "rgba(255,255,255,0.2)" }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>
              <span style={{ fontSize: 8, color: i <= step ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.22)", whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            </div>
            {i < 3 && (
              <motion.div
                style={{ flex: 1, height: 1, margin: "0 3px", marginBottom: 14 }}
                animate={{ backgroundColor: i < step ? s.color : "rgba(255,255,255,0.08)" }}
                transition={{ duration: 0.5 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Update entry — slides and fades between steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <motion.span
            style={{ width: 7, height: 7, borderRadius: "50%", background: INC_STEPS[step]?.color, display: "inline-block", flexShrink: 0, marginTop: 3 }}
            animate={{ opacity: [1, 0.45, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", lineHeight: 1.55 }}>
            {INC_UPDATES[step] ?? INC_UPDATES[0]}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ─── Mini UI 3: Status Page ────────────────────────────────────────────────── */

function StatusPageVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()
  const [idleRow, setIdleRow] = useState(-1)  // which row is "pinging" at idle
  const reducedMotion          = useReducedMotion()

  const svcs = ["API","Authentication","CDN","Database"]


  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => setIdleRow(r => (r + 1) % 4), 1800)
    return () => clearInterval(id)
  }, [reducedMotion])

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full"
      style={{ background:"#0C0E12", position:"relative" }}
    >
      {/* Browser chrome */}
      <div style={{ background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"7px 10px", display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ display:"flex", gap:4 }}>
          {["#FF5F57","#FEBC2E","#28C840"].map((c,i) => (
            <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:c }} />
          ))}
        </div>
        <div style={{ flex:1, background:"rgba(255,255,255,0.06)", borderRadius:4, padding:"2px 8px", fontSize:9, fontFamily:"var(--font-jetbrains-mono,monospace)", color:"rgba(255,255,255,0.4)" }}>
          status.acme.com
        </div>
      </div>

      <div style={{ padding:"12px 14px" }}>
        {/* Operational headline */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <motion.span
            style={{ width:8, height:8, borderRadius:"50%", background:"#22C55E", display:"inline-block", flexShrink:0 }}
            animate={!reducedMotion ? { opacity:[1,0.3,1], scale:[1,1.4,1] } : {}}
            transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut" }}
          />
          <motion.span
            style={{ fontSize:12, fontWeight:600 }}
            animate={{ color: active ? "#22C55E" : "rgba(255,255,255,0.75)" }}
            transition={{ duration:0.4 }}
          >
            All Systems Operational
          </motion.span>
        </div>

        {/* Service rows — idle scan + hover stagger */}
        {svcs.map((s,i) => {
          const isPinging = idleRow === i && !active && !reducedMotion
          return (
            <motion.div
              key={s}
              animate={
                active
                  ? { opacity:1, x:0 }
                  : isPinging
                    ? { background:["rgba(34,197,94,0)","rgba(34,197,94,0.04)","rgba(34,197,94,0)"] }
                    : { opacity:1 }
              }
              initial={{ opacity:0, x:-6 }}
              transition={
                active
                  ? { delay:i*0.07, duration:0.3, ease:[0.16,1,0.3,1] }
                  : { duration: 0.9 }
              }
              style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 4px", borderBottom:"1px solid rgba(255,255,255,0.04)", borderRadius:4, margin:"0 -4px" }}
            >
              {/* Ping dot — lights bright when this row is being checked */}
              <motion.span
                style={{ width:6, height:6, borderRadius:"50%", flexShrink:0 }}
                animate={
                  isPinging
                    ? { backgroundColor:"#4ADE80", scale:[1,1.5,1], opacity:[1,0.6,1] }
                    : { backgroundColor:"#22C55E", scale:1, opacity:0.7 }
                }
                transition={{ duration:0.8 }}
              />
              <span style={{ fontSize:10, color: isPinging ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.55)", flex:1, transition:"color 0.4s" }}>
                {s}
              </span>
              <div style={{ display:"flex", gap:1 }}>
                {Array.from({length:20}).map((_,j) => (
                  <motion.div
                    key={j}
                    style={{ width:2.5, borderRadius:1, background:"#22C55E" }}
                    animate={{
                      height:   isPinging && j === 19 ? [10, 16, 10] : 10,
                      opacity:  isPinging && j === 19 ? [0.6, 1, 0.6] : 0.6,
                    }}
                    transition={{ duration:0.8 }}
                  />
                ))}
              </div>
              <span style={{ fontSize:8, padding:"1px 5px", borderRadius:"9999px", background:"rgba(34,197,94,0.10)", color:"#22C55E", border:"1px solid rgba(34,197,94,0.2)", fontWeight:500 }}>
                Up
              </span>
            </motion.div>
          )
        })}

        {/* Subscribe pill */}
        <motion.div
          animate={{ opacity: active ? 1 : 0.38 }}
          transition={{ duration:0.3 }}
          style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:"9999px", background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)" }}
        >
          <motion.span
            style={{ width:5, height:5, borderRadius:"50%", background:"#3B82F6", display:"inline-block" }}
            animate={!reducedMotion ? { scale:[1,1.3,1], opacity:[1,0.5,1] } : {}}
            transition={{ duration:2.5, repeat:Infinity }}
          />
          <span style={{ fontSize:9, color:"rgba(59,130,246,0.85)", fontWeight:500 }}>Subscribe to updates</span>
        </motion.div>
      </div>

      <div style={{ position:"absolute", bottom:10, right:14, fontSize:8, color:"rgba(255,255,255,0.16)", fontFamily:"var(--font-jetbrains-mono,monospace)" }}>
        Powered by Beacon
      </div>
    </div>
  )
}

/* ─── Mini UI 4: Telegram ────────────────────────────────────────────────────── */

function TelegramVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()
  const [showNotif, setShowNotif] = useState(false)
  const reducedMotion              = useReducedMotion()

  useEffect(() => {
    if (!active) { setShowNotif(false); return }
    const t = setTimeout(() => setShowNotif(true), 160)
    return () => clearTimeout(t)
  }, [active])

  const DOCK_ITEMS = [
    { label:"Phone",
      icon:<svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)" style={{width:18,height:18}}><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.2 2.2z"/></svg>,
    },
    { label:"Messages",
      icon:<svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)" style={{width:18,height:18}}><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>,
    },
    { label:"Telegram", tg:true,
      icon:<svg viewBox="0 0 24 24" fill="white" style={{width:18,height:18}}><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
    },
    { label:"Gmail",
      icon:<svg viewBox="0 0 24 24" style={{width:18,height:18}}><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="rgba(234,67,53,0.65)"/></svg>,
    },
  ]

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ height:"100%", position:"relative", overflow:"visible", background:"#111116" }}
    >
      <div style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)" }}>
        <motion.div
          animate={{ y: active ? -40 : 0 }}
          transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
          style={{
            width:    238,
            height:   320,
            borderRadius: 28,
            background:   "#1C1C20",
            border:       "1px solid rgba(255,255,255,0.13)",
            overflow:     "hidden",
            boxShadow:    active
              ? "0 32px 72px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07) inset, 0 0 28px rgba(34,158,217,0.12)"
              : "0 8px 40px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.06) inset",
            transition:   "box-shadow 0.4s",
            position:     "relative",
          }}
        >
          {/* Screen gloss */}
          <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse 120% 35% at 50% 0%,rgba(255,255,255,0.05),transparent 65%)",pointerEvents:"none" }} />

          {/* Side button */}
          <div style={{ position:"absolute",right:-2,top:68,width:3,height:32,background:"rgba(255,255,255,0.15)",borderRadius:"0 2px 2px 0" }} />
          {[50,78].map(t => (
            <div key={t} style={{ position:"absolute",left:-2,top:t,width:3,height:22,background:"rgba(255,255,255,0.1)",borderRadius:"2px 0 0 2px" }} />
          ))}

          {/* Wallpaper */}
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(160deg,#1a2744 0%,#0d1117 50%,#0a0a12 100%)",borderRadius:"inherit" }} />

          {/* Star dots */}
          {[{top:"22%",left:"18%"},{top:"35%",left:"78%"},{top:"58%",left:"42%"},{top:"72%",left:"15%"},{top:"48%",left:"88%"},{top:"15%",left:"62%"}].map((p,i) => (
            <motion.div
              key={i}
              style={{ position:"absolute",top:p.top,left:p.left,width:1.5,height:1.5,borderRadius:"50%",background:"white" }}
              animate={!reducedMotion ? { opacity:[0.15,0.5,0.15] } : { opacity:0.2 }}
              transition={{ duration: 2.5 + i * 0.7, repeat:Infinity, delay: i * 0.4 }}
            />
          ))}

          {/* Camera */}
          <div style={{ display:"flex",justifyContent:"center",paddingTop:14 }}>
            <div style={{ width:11,height:11,borderRadius:"50%",background:"#242428",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.07)" }} />
          </div>

          {/* Beacon radar mark */}
          <div style={{ display:"flex",justifyContent:"center",marginTop:8 }}>
            <motion.div
              animate={{
                background: active ? "rgba(42,171,238,0.16)" : "rgba(255,255,255,0.06)",
                boxShadow:  active ? "0 0 16px rgba(42,171,238,0.3)" : "none",
              }}
              transition={{ duration:0.35 }}
              style={{ width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center" }}
            >
              <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                <motion.circle cx="10" cy="18" r="2.2"
                  animate={{ fill: active?"#2AABEE":"rgba(255,255,255,0.48)" }}
                  transition={{ duration:0.3 }}
                />
                <motion.path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18"
                  animate={{ stroke: active?"#2AABEE":"rgba(255,255,255,0.4)", opacity: active?1:[0.9,0.5,0.9] }}
                  transition={{ duration: active?0.3:2.5, repeat: active?0:Infinity }}
                  strokeWidth="1.8" strokeLinecap="round" fill="none"
                />
                <motion.path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18"
                  animate={{ stroke: active?"#2AABEE":"rgba(255,255,255,0.3)", opacity: active?1:[0.55,0.25,0.55] }}
                  transition={{ duration: active?0.3:2.5, repeat: active?0:Infinity, delay:0.3 }}
                  strokeWidth="1.8" strokeLinecap="round" fill="none"
                />
                <motion.path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18"
                  animate={{ stroke: active?"#2AABEE":"rgba(255,255,255,0.2)", opacity: active?1:[0.25,0.1,0.25] }}
                  transition={{ duration: active?0.3:2.5, repeat: active?0:Infinity, delay:0.6 }}
                  strokeWidth="1.8" strokeLinecap="round" fill="none"
                />
              </svg>
            </motion.div>
          </div>

          {/* Notification zone */}
          <div style={{ padding:"10px 10px 0",minHeight:10 }}>
            <AnimatePresence>
              {showNotif && (
                <motion.div
                  initial={{ opacity:0, y:-20, scale:0.96 }}
                  animate={{ opacity:1, y:0,   scale:1    }}
                  exit={{    opacity:0, y:-20, scale:0.96 }}
                  transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
                  style={{
                    background:"rgba(42,42,48,0.97)",backdropFilter:"blur(24px)",
                    WebkitBackdropFilter:"blur(24px)",borderRadius:14,padding:"9px 11px",
                    border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 6px 24px rgba(0,0,0,0.55)",
                    display:"flex",alignItems:"center",gap:10,
                  }}
                >
                  <div style={{ width:34,height:34,borderRadius:9,flexShrink:0,background:"linear-gradient(145deg,#2AABEE,#1a97d4)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <svg viewBox="0 0 24 24" fill="white" style={{width:17,height:17}}>
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:11,fontWeight:700,color:"#2AABEE",marginBottom:2,letterSpacing:"-0.01em" }}>Beacon Alerts</p>
                    <p style={{ fontSize:10,color:"rgba(255,255,255,0.7)",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis" }}>
                      🔴 API Gateway — CRITICAL
                    </p>
                  </div>
                  <span style={{ fontSize:8,color:"rgba(255,255,255,0.28)",flexShrink:0,alignSelf:"flex-start",paddingTop:1 }}>now</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ height:26 }} />

          {/* Dock */}
          <div style={{ padding:"0 12px" }}>
            <div style={{ background:"rgba(255,255,255,0.07)",backdropFilter:"blur(8px)",borderRadius:16,padding:"9px 6px 8px",display:"flex",justifyContent:"space-around" }}>
              {DOCK_ITEMS.map(d => (
                <div key={d.label} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                  <motion.div
                    style={{
                      width:40,height:40,borderRadius:10,
                      background: d.tg ? "rgba(42,171,238,0.18)" : "rgba(255,255,255,0.08)",
                      border:     d.tg ? "1px solid rgba(42,171,238,0.28)" : "1px solid rgba(255,255,255,0.05)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}
                    animate={d.tg && active ? { boxShadow:["0 0 0px rgba(42,171,238,0)","0 0 12px rgba(42,171,238,0.4)","0 0 0px rgba(42,171,238,0)"] } : {}}
                    transition={{ duration:1.5, repeat:Infinity }}
                  >
                    {d.icon}
                  </motion.div>
                  <span style={{ fontSize:9,color:"rgba(255,255,255,0.42)" }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ghost rows */}
          <div style={{ padding:"12px 14px 0" }}>
            {[0,1,2].map(row => (
              <div key={row} style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:9 }}>
                {[0,1,2,3].map(col => (
                  <div key={col} style={{ height:42,borderRadius:11,background:"rgba(255,255,255,0.065)",border:"1px solid rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Mini UI 5: Slack ──────────────────────────────────────────────────────── */

const SLACK_CHANNELS = [
  { name:"#incidents",  active:false, unread:false },
  { name:"#ops-alerts", active:true,  unread:true  },
  { name:"#deployments",active:false, unread:false },
]

function SlackVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()
  const [typing, setTyping] = useState(false)  
  const reducedMotion        = useReducedMotion()


  useEffect(() => {
    if (reducedMotion || active) return
    const id = setInterval(() => {
      setTyping(true)
      setTimeout(() => setTyping(false), 2200)
    }, 6000)
    return () => clearInterval(id)
  }, [reducedMotion, active])

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full flex"
      style={{ background:"#0C0E12" }}
    >
      {/* Sidebar */}
      <div style={{ width:88,background:"rgba(74,21,91,0.2)",padding:"10px 7px",borderRight:"1px solid rgba(255,255,255,0.06)",flexShrink:0 }}>
        <p style={{ fontSize:8,fontWeight:700,color:"rgba(255,255,255,0.35)",marginBottom:8,paddingLeft:4 }}>Acme Corp</p>
        {SLACK_CHANNELS.map(ch => (
          <div
            key={ch.name}
            style={{
              padding:"2px 5px",borderRadius:4,fontSize:9,marginBottom:2,
              color:      ch.active?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.3)",
              background: ch.active?"rgba(255,255,255,0.08)":"transparent",
              display:"flex",alignItems:"center",justifyContent:"space-between",
              overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",
            }}
          >
            {ch.name}
            {ch.unread && (
              <motion.span
                style={{ width:5,height:5,borderRadius:"50%",background:"#ECB22E",display:"inline-block",flexShrink:0 }}
                animate={!active ? { opacity:[1,0.2,1] } : { opacity:0 }}
                transition={{ duration:1.5,repeat:Infinity }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Message area */}
      <div style={{ flex:1,padding:"10px 10px",overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:7 }}>
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none" style={{ flexShrink:0 }}>
            <rect width="28" height="28" rx="7" fill="#1D4ED8"/>
            <circle cx="10" cy="18" r="2.2" fill="white"/>
            <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
            <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
            <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25"/>
          </svg>
          <span style={{ fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.7)" }}>Beacon</span>
          <span style={{ fontSize:8,padding:"1px 4px",borderRadius:3,background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.35)" }}>App</span>
          <span style={{ fontSize:8,color:"rgba(255,255,255,0.2)",marginLeft:"auto",fontFamily:"var(--font-jetbrains-mono,monospace)" }}>3m ago</span>
        </div>

        {/* Incident block */}
        <motion.div
          animate={active ? { opacity:1, x:0 } : { opacity:0.6, x:0 }}
          transition={{ duration:0.3 }}
          style={{ background:"rgba(255,255,255,0.03)",borderLeft:"3px solid #EF4444",borderRadius:"0 6px 6px 0",padding:"7px 8px",marginBottom:6 }}
        >
          <p style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.85)",marginBottom:4 }}>
            🔴 CRITICAL — API Gateway
          </p>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:4 }}>
            {[["Status","Investigating"],["Severity","Critical"],["Duration","14m"],["Services","API"]].map(([l,v]) => (
              <div key={l}>
                <p style={{ fontSize:8,fontWeight:600,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.05em" }}>{l}</p>
                <p style={{ fontSize:9,color:"rgba(255,255,255,0.65)",fontWeight:500 }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Reactions — appear on hover */}
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity:0,y:4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:4 }}
                transition={{ duration:0.2,delay:0.2 }}
                style={{ display:"flex",gap:4,marginTop:6,paddingTop:5,borderTop:"1px solid rgba(255,255,255,0.06)" }}
              >
                {[["🔴",3],["✅",1],["👀",5]].map(([e,c]) => (
                  <div key={e} style={{ display:"flex",alignItems:"center",gap:3,padding:"1px 5px",borderRadius:4,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",fontSize:9,color:"rgba(255,255,255,0.5)" }}>
                    {e} {c}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Idle typing indicator */}
        <AnimatePresence>
          {typing && !active && (
            <motion.div
              initial={{ opacity:0, y:4 }}
              animate={{ opacity:1, y:0 }}
              exit={{    opacity:0, y:4 }}
              transition={{ duration:0.2 }}
              style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 6px" }}
            >
              <div style={{ display:"flex",gap:3,alignItems:"center" }}>
                {[0,1,2].map(i => (
                  <motion.span
                    key={i}
                    style={{ width:4,height:4,borderRadius:"50%",background:"rgba(255,255,255,0.4)",display:"inline-block" }}
                    animate={{ y:[0,-3,0], opacity:[0.4,1,0.4] }}
                    transition={{ duration:0.8,delay:i*0.18,repeat:Infinity }}
                  />
                ))}
              </div>
              <span style={{ fontSize:9,color:"rgba(255,255,255,0.3)" }}>SJ is typing...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resolved message */}
        <div style={{ background:"rgba(34,197,94,0.05)",borderLeft:"3px solid rgba(34,197,94,0.3)",borderRadius:"0 5px 5px 0",padding:"5px 8px",opacity: typing || active ? 0.35 : 0.5 }}>
          <p style={{ fontSize:9,color:"rgba(255,255,255,0.55)" }}>
            ✅ Resolved · API Gateway · All systems operational
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Mini UI 6: Reporting ───────────────────────────────────────────────────── */

const REPORT_BARS = [
  { month:"J", pct:100,   amber:false },
  { month:"F", pct:100,   amber:false },
  { month:"M", pct:99.9,  amber:false },
  { month:"A", pct:100,   amber:false },
  { month:"M", pct:100,   amber:false },
  { month:"J", pct:99.85, amber:false },
  { month:"J", pct:100,   amber:false },
  { month:"A", pct:99.71, amber:true  },
  { month:"S", pct:100,   amber:false },
  { month:"O", pct:100,   amber:false },
  { month:"N", pct:99.9,  amber:false },
  { month:"D", pct:100,   amber:false },
]

const MAX_BAR_H = 72

function barH(pct) {
  return Math.max(4, ((pct - 99.0) / 1.0) * MAX_BAR_H)
}

function ReportingVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()
  const [hoveredBar,  setHoveredBar]  = useState(null)
  const [idleHighlight, setIdleHighlight] = useState(null)  
  const reducedMotion                     = useReducedMotion()


  useEffect(() => {
    if (reducedMotion || active) { setIdleHighlight(null); return }
    let i = 0
    const seq = [0,1,2,3,4,5,6,7,8,9,10,11,7] 
    const id  = setInterval(() => {
      setIdleHighlight(seq[i % seq.length])
      i++
    }, 500)
    return () => clearInterval(id)
  }, [reducedMotion, active])

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full flex flex-col justify-center"
      style={{ background:"#0C0E12",padding:"14px 14px 10px" }}
    >
      {/* Chart */}
      <div style={{ display:"flex",gap:3,alignItems:"flex-end",height:MAX_BAR_H,marginBottom:5 }}>
        {REPORT_BARS.map((bar,i) => {
          const h           = barH(bar.pct)
          const isHovered   = hoveredBar === i
          const isIdle      = idleHighlight === i && !active
          const showTip     = isHovered || (active && bar.amber && hoveredBar === null) || (isIdle && bar.amber)

          return (
            <div
              key={i}
              style={{ flex:1,height:h,position:"relative" }}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <motion.div
                style={{
                  position:        "absolute",
                  inset:           0,
                  borderRadius:    "2px 2px 0 0",
                  background:      bar.amber ? "#F59E0B" : "#22C55E",
                  transformOrigin: "bottom",
                }}
                initial={{ scaleY: 0.45 }}
                animate={{
                  scaleY:  active ? 1 : isIdle ? 0.85 : 0.45,
                  opacity: isIdle ? 1 : bar.amber ? 0.9 : 0.7,
                  filter:  isIdle ? "brightness(1.4)" : "brightness(1)",
                }}
                transition={{ duration: 0.45, delay: active ? i*0.04 : 0, ease:[0.16,1,0.3,1] }}
              />

              {showTip && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity:0,y:4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:4 }}
                    transition={{ duration:0.15 }}
                    style={{
                      position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",
                      background:"rgba(15,20,30,0.96)",border:"1px solid rgba(245,158,11,0.3)",
                      borderRadius:5,padding:"4px 8px",whiteSpace:"nowrap",fontSize:9,
                      color:"rgba(255,255,255,0.8)",zIndex:10,
                    }}
                  >
                    Aug · 99.71% · 2 incidents
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )
        })}
      </div>

      {/* Month labels */}
      <div style={{ display:"flex",gap:3,marginBottom:8 }}>
        {REPORT_BARS.map((b,i) => (
          <span
            key={i}
            style={{
              flex:1, textAlign:"center", fontSize:7,
              color: idleHighlight===i && !active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)",
              fontFamily:"var(--font-jetbrains-mono,monospace)",
              transition:"color 0.2s",
              fontWeight: idleHighlight===i && !active ? 600 : 400,
            }}
          >
            {b.month}
          </span>
        ))}
      </div>

      {/* SLA line */}
      <div style={{ height:1,background:"rgba(59,130,246,0.2)",marginBottom:8,position:"relative" }}>
        <span style={{ position:"absolute",right:0,top:-10,fontSize:7,color:"rgba(59,130,246,0.45)",fontFamily:"var(--font-jetbrains-mono,monospace)" }}>
          99.9% SLA
        </span>
      </div>

      {/* Stats */}
      <div style={{ display:"flex",justifyContent:"space-between",paddingTop:6,borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <p style={{ fontSize:8,color:"rgba(255,255,255,0.3)",marginBottom:2 }}>Average uptime</p>
          <p style={{ fontSize:16,fontWeight:700,color:"#22C55E",fontFamily:"var(--font-jetbrains-mono,monospace)" }}>99.94%</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:8,color:"rgba(255,255,255,0.3)",marginBottom:2 }}>Total downtime</p>
          <p style={{ fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.6)",fontFamily:"var(--font-jetbrains-mono,monospace)" }}>3h 12m</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Mini UI 7: API ─────────────────────────────────────────────────────────── */

const API_REST = [
  { text:"POST",                        color:"#3B82F6"               },
  { text:" /api/v1/incidents\n",         color:"rgba(255,255,255,0.7)" },
  { text:"Authorization: ",             color:"rgba(255,255,255,0.4)" },
  { text:"Bearer bk_live_••••Xk9m",     color:"#22C55E"               },
]

const API_HOVER = [
  { text:"\n\n{\n  ",                   color:"rgba(255,255,255,0.3)" },
  { text:'"title"',                     color:"#F59E0B"               },
  { text:": ",                          color:"rgba(255,255,255,0.3)" },
  { text:'"API Gateway degraded"',      color:"#22C55E"               },
  { text:",\n  ",                       color:"rgba(255,255,255,0.3)" },
  { text:'"severity"',                  color:"#F59E0B"               },
  { text:": ",                          color:"rgba(255,255,255,0.3)" },
  { text:'"critical"',                  color:"#22C55E"               },
  { text:"\n}",                         color:"rgba(255,255,255,0.3)" },
]

const HOVER_FULL = API_HOVER.map(p => p.text).join("")


const WEBHOOK_ENTRIES = [
  { time:"09:42:01", endpoint:"acme.com/webhook", status:200 },
  { time:"09:42:03", endpoint:"api.monitor.io",   status:200 },
  { time:"09:42:05", endpoint:"hooks.slack.com",  status:200 },
]

function APIVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()
  const [chars,       setChars]       = useState(0)
  const [idleCursor,  setIdleCursor]  = useState(true)  // blinking cursor at rest
  const [webhookIdx,  setWebhookIdx]  = useState(0)      // idle: new log entries arrive
  const [showWebhook, setShowWebhook] = useState(false)
  const timerRef                       = useRef(null)
  const reducedMotion                  = useReducedMotion()

 
  useEffect(() => {
    if (!active) {
      setChars(0)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    let c = 0
    timerRef.current = setInterval(() => {
      c++
      setChars(c)
      if (c >= HOVER_FULL.length) clearInterval(timerRef.current)
    }, 22)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [active])

  
  useEffect(() => {
    if (reducedMotion || active) { setShowWebhook(false); return }
    const show = setTimeout(() => setShowWebhook(true), 1500)
    return () => clearTimeout(show)
  }, [reducedMotion, active])

  useEffect(() => {
    if (!showWebhook || active || reducedMotion) return
    const id = setInterval(() => setWebhookIdx(i => (i + 1) % WEBHOOK_ENTRIES.length), 2000)
    return () => clearInterval(id)
  }, [showWebhook, active, reducedMotion])

  let rendered   = 0
  const hoverSegs = API_HOVER.map(part => {
    const start   = rendered
    const visible = Math.max(0, Math.min(chars - start, part.text.length))
    rendered     += part.text.length
    return { text: part.text.slice(0, visible), color: part.color }
  })
  const done = chars >= HOVER_FULL.length

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full"
      style={{ background:"#060809",fontFamily:"var(--font-jetbrains-mono,monospace)",fontSize:10,position:"relative" }}
    >
      {/* Tabs */}
      <div style={{ background:"rgba(34,197,94,0.04)",borderBottom:"1px solid rgba(34,197,94,0.12)",padding:"7px 12px",display:"flex",gap:6 }}>
        {["API Keys","Webhooks","Docs"].map(t => (
          <span key={t} style={{
            padding:"1px 8px",borderRadius:4,fontSize:9,
            color:      t==="API Keys"?"rgba(34,197,94,0.8)":"rgba(255,255,255,0.25)",
            background: t==="API Keys"?"rgba(34,197,94,0.12)":"transparent",
            border:     t==="API Keys"?"1px solid rgba(34,197,94,0.2)":"none",
          }}>{t}</span>
        ))}
      </div>

      {/* Key row */}
      <div style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderBottom:"1px solid rgba(34,197,94,0.08)" }}>
        <span style={{ color:"#22C55E",fontSize:10 }}>bk_live_</span>
        <span style={{ color:"rgba(34,197,94,0.3)",fontSize:10,letterSpacing:"0.08em" }}>{"•".repeat(12)}</span>
        <span style={{ color:"#22C55E",fontSize:10 }}>Xk9m</span>
        <div style={{ display:"flex",gap:3,marginLeft:"auto" }}>
          {["Reveal","Copy"].map(l => (
            <span key={l} style={{ padding:"1px 6px",borderRadius:3,fontSize:8,color:"rgba(34,197,94,0.55)",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.15)" }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Code block */}
      <div style={{ padding:"10px 12px",lineHeight:1.8,whiteSpace:"pre-wrap",position:"relative",minHeight:80 }}>
        {API_REST.map((seg,i) => (
          <span key={i} style={{ color:seg.color }}>{seg.text}</span>
        ))}
        {hoverSegs.map((seg,i) => (
          <span key={`h${i}`} style={{ color:seg.color }}>{seg.text}</span>
        ))}
        {/* Cursor — always visible, stops when typing complete */}
        {(!done || !active) && (
          <motion.span
            style={{ display:"inline-block",width:5,height:11,background:"#22C55E",verticalAlign:"middle",marginLeft:2 }}
            animate={{ opacity:[1,0,1] }}
            transition={{ duration:1,repeat:Infinity,ease:"linear" }}
          />
        )}
      </div>

      {/* Idle webhook log — arrives at bottom right before hover */}
      <AnimatePresence>
        {showWebhook && !active && (
          <motion.div
            key={webhookIdx}
            initial={{ opacity:0, y:6 }}
            animate={{ opacity:1, y:0 }}
            exit={{    opacity:0, y:-4 }}
            transition={{ duration:0.3 }}
            style={{
              position:"absolute",right:10,bottom:10,
              background:"rgba(10,15,10,0.94)",border:"1px solid rgba(34,197,94,0.15)",
              borderRadius:6,padding:"5px 8px",
              display:"flex",alignItems:"center",gap:8,
            }}
          >
            <span style={{ fontSize:8,color:"rgba(255,255,255,0.25)",fontFamily:"var(--font-jetbrains-mono,monospace)" }}>
              {WEBHOOK_ENTRIES[webhookIdx].time}
            </span>
            <span style={{ fontSize:8,color:"rgba(255,255,255,0.5)" }}>
              {WEBHOOK_ENTRIES[webhookIdx].endpoint}
            </span>
            <span style={{ fontSize:8,fontWeight:600,color:"#22C55E" }}>
              {WEBHOOK_ENTRIES[webhookIdx].status}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 201 response on hover complete */}
      <AnimatePresence>
        {done && active && (
          <motion.div
            initial={{ opacity:0,x:14 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:14 }}
            transition={{ duration:0.22 }}
            style={{ position:"absolute",right:10,bottom:10,background:"rgba(10,15,10,0.97)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:7,padding:"7px 10px",boxShadow:"0 8px 24px rgba(0,0,0,0.5)" }}
          >
            <span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:4,background:"rgba(34,197,94,0.15)",color:"#22C55E",border:"1px solid rgba(34,197,94,0.3)",fontFamily:"var(--font-jetbrains-mono,monospace)" }}>
              201 Created
            </span>
            <p style={{ fontSize:8,color:"rgba(255,255,255,0.3)",fontFamily:"var(--font-jetbrains-mono,monospace)",marginTop:3 }}>
              id: "inc_xK9m..."
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Grid assembly ──────────────────────────────────────────────────────────── */

export default function BentoGrid() {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-16">
      <div className="text-center mb-10">
        <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color:"rgba(59,130,246,0.8)" }}>
          Everything you need
        </p>
        <h2
          className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3"
          style={{ color:"rgba(255,255,255,0.92)" }}
        >
          Everything between you
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage:"linear-gradient(135deg,#3B82F6 0%,#60A5FA 60%,#93C5FD 100%)" }}
          >
            and an outage.
          </span>
        </h2>
        <p className="text-base max-w-lg mx-auto" style={{ color:"rgba(255,255,255,0.42)" }}>
          Monitoring, incidents, status pages, and notifications — all in one open source platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">

        <FeatureCard title="Uptime Monitoring" description="Watch every service 24/7. HTTP, TCP, and ICMP checks at 30-second intervals.">
          <div style={{ height:300 }}><UptimeVisual /></div>
        </FeatureCard>

        <FeatureCard title="Incident Management" description="Structured workflow from detection to resolution with team updates.">
          <div style={{ height:300 }}><IncidentVisual /></div>
        </FeatureCard>

        <FeatureCard title="Public Status Pages" description="Branded, live status pages your customers actually trust.">
          <div style={{ height:300 }}><StatusPageVisual /></div>
        </FeatureCard>

        {/* Telegram — overflow:visible so phone lifts above card */}
        <div
          className="rounded-2xl border flex flex-col"
          style={{
            background:"#17171A",
            borderColor:"rgba(255,255,255,0.1)",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 3px rgba(0,0,0,0.4)",
            overflow:"visible",
            position:"relative",
            zIndex:10,
          }}
        >
          <div style={{ height:240,overflow:"visible",position:"relative" }}>
            <TelegramVisual />
          </div>
          <div
            className="px-5 py-5 flex-shrink-0 rounded-b-2xl"
            style={{ borderTop:"1px solid rgba(255,255,255,0.07)",background:"#17171A",position:"relative",zIndex:1 }}
          >
            <p className="font-semibold mb-1.5" style={{ fontSize:15,color:"rgba(255,255,255,0.92)",letterSpacing:"-0.02em" }}>
              Telegram Notifications
            </p>
            <p className="text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.38)" }}>
              Subscribers get instant alerts the moment an incident starts or resolves.
            </p>
          </div>
        </div>

        <FeatureCard title="Slack Notifications" description="Structured Slack alerts in the right channel with full context.">
          <div style={{ height:210 }}><SlackVisual /></div>
        </FeatureCard>

        <FeatureCard title="Historical Reporting" description="90 days of uptime history. Honest, exportable, and clear.">
          <div style={{ height:210 }}><ReportingVisual /></div>
        </FeatureCard>

        <FeatureCard
          title="API & Integrations"
          description="Full REST API. Automate incident creation, monitor management, and more."
          className="lg:col-span-3"
        >
          <div style={{ height:220 }}><APIVisual /></div>
        </FeatureCard>

      </div>
    </section>
  )
}