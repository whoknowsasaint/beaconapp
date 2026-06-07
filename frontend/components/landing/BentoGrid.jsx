"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

function useFeatureAnimation() {
  const ref       = useRef(null)
  const [active, setActive]   = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const reducedMotion          = useReducedMotion()

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches)
  }, [])

  useEffect(() => {
    if (!ref.current || reducedMotion || !isTouch) return
    const el  = ref.current
    const obs = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [reducedMotion, isTouch])

  return {
    ref,
    active,
    onMouseEnter: () => !isTouch && !reducedMotion && setActive(true),
    onMouseLeave: () => !isTouch && setActive(false),
  }
}

const CARD_BASE = [
  "rounded-xl border overflow-hidden flex flex-col cursor-default",
  "transition-all duration-200",
].join(" ")

const CARD_STYLE = {
  background:   "#111113",
  borderColor:  "rgba(255,255,255,0.08)",
}

function FeatureCard({ title, description, children, className = "" }) {
  return (
    <div className={`${CARD_BASE} ${className}`} style={CARD_STYLE}>
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {children}
      </div>
      <div className="px-5 py-4 flex-shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
          {title}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          {description}
        </p>
      </div>
    </div>
  )
}

const SERVICES = [
  { name: "API Gateway",     status: "operational" },
  { name: "Authentication",  status: "operational" },
  { name: "CDN",             status: "degraded"    },
  { name: "Database",        status: "operational" },
  { name: "Webhooks",        status: "operational" },
]

function UptimeVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full flex flex-col justify-center px-5 py-4 gap-2"
      style={{ background: "#0C0E12" }}
    >
      {SERVICES.map((svc, i) => {
        const isDegraded = svc.status === "degraded"
        const animating  = active && isDegraded
        return (
          <div key={svc.name} className="flex items-center gap-3">
            <motion.span
              className="h-1.5 w-1.5 rounded-full flex-shrink-0"
              animate={animating
                ? { backgroundColor: ["#22C55E","#F59E0B","#22C55E"], scale: [1,1.3,1] }
                : { backgroundColor: isDegraded ? "#F59E0B" : "#22C55E", scale: 1 }
              }
              transition={{ duration: 1.5, repeat: animating ? Infinity : 0 }}
            />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", flex: 1, fontFamily: "var(--font-mono)" }}>
              {svc.name}
            </span>
            <div className="flex gap-px">
              {Array.from({ length: 28 }).map((_, j) => (
                <div
                  key={j}
                  style={{
                    width:        3,
                    height:       14,
                    borderRadius: 1,
                    background:   isDegraded && j >= 25
                      ? "#F59E0B"
                      : "#22C55E",
                    opacity: isDegraded && j >= 25 ? (active ? 1 : 0.6) : 0.7,
                    transition:   "all 0.3s",
                  }}
                />
              ))}
            </div>
            <motion.span
              style={{
                fontSize:      9,
                padding:       "1px 6px",
                borderRadius:  "9999px",
                fontWeight:    500,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                background:    isDegraded ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.10)",
                color:         isDegraded ? "#F59E0B" : "#22C55E",
                border:        `1px solid ${isDegraded ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.2)"}`,
                flexShrink:    0,
              }}
              animate={animating ? { boxShadow: ["0 0 0px rgba(245,158,11,0)", "0 0 8px rgba(245,158,11,0.4)", "0 0 0px rgba(245,158,11,0)"] } : {}}
              transition={{ duration: 1.5, repeat: animating ? Infinity : 0 }}
            >
              {isDegraded ? "Degraded" : "Operational"}
            </motion.span>
          </div>
        )
      })}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 8 }}
            transition={{ duration: 0.2, delay: 0.3 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg mt-1"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#F59E0B", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-mono)" }}>
              CDN degraded for 14m · Investigating
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const INC_STEPS = ["Investigating","Identified","Monitoring","Resolved"]

function IncidentVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) { setStep(0); return }
    const id = setInterval(() => setStep(s => (s < 2 ? s + 1 : s)), 1200)
    return () => clearInterval(id)
  }, [active])

  const COLORS = ["#EF4444","#F59E0B","#3B82F6","#22C55E"]

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full flex flex-col justify-center px-5 py-5"
      style={{ background: "linear-gradient(160deg, rgba(239,68,68,0.06) 0%, #0C0E12 60%)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>
            API Gateway -- Error Rate
          </p>
          <motion.span
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           5,
              padding:       "2px 8px",
              borderRadius:  "9999px",
              fontSize:      9,
              fontWeight:    600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background:    "rgba(239,68,68,0.12)",
              color:         "#EF4444",
              border:        "1px solid rgba(239,68,68,0.25)",
            }}
            animate={active ? { boxShadow: ["0 0 0 rgba(239,68,68,0)","0 0 10px rgba(239,68,68,0.35)","0 0 0 rgba(239,68,68,0)"] } : {}}
            transition={{ duration: 2, repeat: active ? Infinity : 0 }}
          >
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
            Critical
          </motion.span>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-5">
        {INC_STEPS.map((s, i) => (
          <div key={s} className="flex items-center" style={{ flex: i < 3 ? 1 : "none" }}>
            <div className="flex flex-col items-center gap-1">
              <motion.div
                style={{
                  width:         24,
                  height:        24,
                  borderRadius:  "50%",
                  border:        `2px solid`,
                  display:       "flex",
                  alignItems:    "center",
                  justifyContent:"center",
                  flexShrink:    0,
                }}
                animate={{
                  borderColor:     i <= step ? COLORS[i] : "rgba(255,255,255,0.12)",
                  backgroundColor: i < step  ? COLORS[i] : i === step ? `${COLORS[i]}25` : "transparent",
                }}
                transition={{ duration: 0.4 }}
              >
                {i < step ? (
                  <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" style={{ width: 8, height: 8 }}>
                    <polyline points="1.5,5 4,7.5 8.5,2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <motion.span
                    style={{ width: 6, height: 6, borderRadius: "50%", display: "inline-block" }}
                    animate={{ backgroundColor: i === step ? COLORS[i] : "rgba(255,255,255,0.2)" }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>
              <span style={{ fontSize: 9, color: i <= step ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
                {s}
              </span>
            </div>
            {i < 3 && (
              <motion.div
                style={{ flex: 1, height: 1, margin: "0 3px", marginBottom: 14 }}
                animate={{ backgroundColor: i < step ? COLORS[i] : "rgba(255,255,255,0.08)" }}
                transition={{ duration: 0.4 }}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex items-start gap-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>AK</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            {[
              "Investigating elevated error rates on API Gateway.",
              "Root cause identified: misconfigured load balancer.",
              "Fix deployed. Monitoring for full recovery.",
            ][step] ?? "Monitoring elevated error rates."}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function StatusPageVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()

  const svcs = ["API","Authentication","CDN","Database"]
  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full"
      style={{ background: "#0C0E12" }}
    >
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {["#FF5F57","#FEBC2E","#28C840"].map((c, i) => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "2px 8px", fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.4)" }}>
          status.acme.com
        </div>
      </div>

      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <motion.span
            style={{ width: 9, height: 9, borderRadius: "50%", background: "#22C55E", display: "inline-block", flexShrink: 0 }}
            animate={active ? { opacity: [1, 0.4, 1], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: active ? Infinity : 0 }}
          />
          <motion.span
            style={{ fontSize: 13, fontWeight: 600 }}
            animate={{ color: active ? "#22C55E" : "rgba(255,255,255,0.8)" }}
            transition={{ duration: 0.4 }}
          >
            All Systems Operational
          </motion.span>
        </div>

        <div className="flex flex-col gap-2">
          {svcs.map((s, i) => (
            <motion.div
              key={s}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: active ? i * 0.08 : 0 }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", flex: 1 }}>{s}</span>
              <div style={{ display: "flex", gap: 1 }}>
                {Array.from({ length: 20 }).map((_, j) => (
                  <div key={j} style={{ width: 3, height: 10, borderRadius: 1, background: "#22C55E", opacity: 0.65 }} />
                ))}
              </div>
              <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: "9999px", background: "rgba(34,197,94,0.10)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 500 }}>
                Up
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TelegramVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, rgba(34,158,217,0.08) 0%, #0C0E12 70%)", padding: "20px 24px" }}
    >
      <div style={{ width: "100%", maxWidth: 200, background: "#0D1117", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(34,158,217,0.08)", position: "relative" }}>
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0,   opacity: 1 }}
              exit={{    y: -40, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position:   "absolute",
                top: 0, left: 0, right: 0,
                background: "rgba(13,17,23,0.96)",
                backdropFilter: "blur(8px)",
                borderBottom: "1px solid rgba(34,158,217,0.2)",
                padding:    "7px 10px",
                display:    "flex",
                alignItems: "center",
                gap:        6,
                zIndex:     10,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#229ED9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" style={{ width: 7, height: 7 }}>
                  <path d="M1 5l2.5 2.5 5-5.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1 }}>Beacon Alerts</p>
                <p style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>New incident reported</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, width: 40, margin: "8px auto" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#229ED9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" style={{ width: 8, height: 8 }}>
              <path d="M1 5l2 2 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Beacon Alerts</p>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.4)" }}>bot</p>
          </div>
        </div>

        <div style={{ padding: "8px 8px 10px" }}>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ background: "rgba(34,158,217,0.12)", border: "1px solid rgba(34,158,217,0.25)", borderRadius: 8, padding: "7px 9px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>CRITICAL</span>
            </div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>API Gateway -- Error Rate</p>
            <p style={{ fontSize: 8, color: "#229ED9", marginTop: 3 }}>View status page →</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function SlackVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full flex flex-col"
      style={{ background: "#0C0E12" }}
    >
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 100, background: "rgba(74,21,91,0.2)", padding: "10px 8px", borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Acme Corp</p>
          {["#incidents","#ops-alerts","#deploys"].map((ch, i) => (
            <div key={ch} style={{ padding: "2px 5px", borderRadius: 4, fontSize: 10, color: i === 1 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)", background: i === 1 ? "rgba(255,255,255,0.08)" : "transparent", marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {ch}
              {i === 1 && (
                <motion.span
                  style={{ width: 5, height: 5, borderRadius: "50%", background: "#ECB22E", display: "inline-block" }}
                  animate={!active ? { opacity: [1, 0.3, 1] } : { opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, padding: "10px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: "#3B82F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Beacon</span>
            <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 3, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>App</span>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>now</span>
          </div>

          <motion.div
            initial={{ opacity: 0.5 }}
            animate={active ? { opacity: 1 } : { opacity: 0.5 }}
            transition={{ duration: 0.3 }}
            style={{ background: "rgba(255,255,255,0.03)", borderLeft: "3px solid #EF4444", borderRadius: "0 5px 5px 0", padding: "7px 8px" }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>🔴 CRITICAL -- API Gateway</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[["Status","Investigating"],["Severity","Critical"],["Duration","14m"],["Services","API"]].map(([l, v]) => (
                <div key={l}>
                  <p style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{v}</p>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {active && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{    opacity: 0, y: 4 }}
                  transition={{ duration: 0.2, delay: 0.3 }}
                  style={{ display: "flex", gap: 4, marginTop: 6, paddingTop: 5, borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {["🔴 3","✅ 1","👀 5"].map(r => (
                    <div key={r} style={{ display: "flex", alignItems: "center", gap: 3, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 9, color: "rgba(255,255,255,0.5)" }}>
                      {r}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

const MONTHS_SHORT = ["J","F","M","A","M","J","J","A","S","O","N","D"]
const BAR_VALS     = [100,100,99.9,100,100,99.9,100,99.71,100,100,99.9,100]

function ReportingVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full flex flex-col justify-center"
      style={{ background: "#0C0E12", padding: "16px 16px 10px" }}
    >
      <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: 70, marginBottom: 4 }}>
        {BAR_VALS.map((v, i) => {
          const isAmber = v < 99.9
          const h       = ((v - 99.5) / 0.5) * 60 + 10
          return (
            <div key={i} style={{ flex: 1, position: "relative" }}>
              <motion.div
                style={{ borderRadius: "2px 2px 0 0", background: isAmber ? "#F59E0B" : "#22C55E", position: "absolute", bottom: 0, left: 0, right: 0 }}
                initial={{ height: 0 }}
                animate={{ height: active ? `${h}px` : 0 }}
                transition={{ duration: 0.6, delay: active ? i * 0.04 : 0, ease: [0.16,1,0.3,1] }}
              />
              {isAmber && active && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.9 }}
                  style={{
                    position:  "absolute",
                    bottom:    "calc(100% + 6px)",
                    left:      "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(15,20,30,0.96)",
                    border:    "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 5,
                    padding:   "4px 7px",
                    whiteSpace: "nowrap",
                    fontSize:  9,
                    color:     "rgba(255,255,255,0.75)",
                    zIndex:    10,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  Aug · 99.71% · 2 incidents
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
        {MONTHS_SHORT.map(m => (
          <span key={m} style={{ flex: 1, textAlign: "center", fontSize: 7, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-mono)" }}>
            {m}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Average uptime</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#22C55E", fontFamily: "var(--font-mono)" }}>99.94%</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Total downtime</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-mono)" }}>3h 12m</p>
        </div>
      </div>
    </div>
  )
}

const CODE_PARTS = [
  { t: "POST",                         c: "#3B82F6"               },
  { t: " /api/v1/incidents\n",          c: "rgba(255,255,255,0.7)" },
  { t: "Authorization: ",               c: "rgba(255,255,255,0.4)" },
  { t: "Bearer bk_live_••••Xk9m\n\n",  c: "#22C55E"               },
  { t: "{\n  ",                         c: "rgba(255,255,255,0.3)" },
  { t: '"title"',                       c: "#F59E0B"               },
  { t: ': ',                            c: "rgba(255,255,255,0.3)" },
  { t: '"API Gateway degraded"',        c: "#22C55E"               },
  { t: ",\n  ",                         c: "rgba(255,255,255,0.3)" },
  { t: '"severity"',                    c: "#F59E0B"               },
  { t: ': ',                            c: "rgba(255,255,255,0.3)" },
  { t: '"critical"',                    c: "#22C55E"               },
  { t: "\n}",                           c: "rgba(255,255,255,0.3)" },
]

function APIVisual() {
  const { ref, active, onMouseEnter, onMouseLeave } = useFeatureAnimation()
  const [chars, setChars] = useState(0)

  const fullText = CODE_PARTS.map(p => p.t).join("")

  useEffect(() => {
    if (!active) { setChars(0); return }
    let c = 0
    const id = setInterval(() => {
      c++
      setChars(c)
      if (c >= fullText.length) clearInterval(id)
    }, 18)
    return () => clearInterval(id)
  }, [active, fullText.length])

  let rendered = 0
  const segments = CODE_PARTS.map(part => {
    const start   = rendered
    const end     = rendered + part.t.length
    const visible = Math.max(0, Math.min(chars - start, part.t.length))
    rendered      = end
    return { text: part.t.slice(0, visible), color: part.c }
  })

  const done = chars >= fullText.length

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="h-full"
      style={{ background: "#060809", fontFamily: "var(--font-mono)", fontSize: 10, position: "relative" }}
    >
      <div style={{ background: "rgba(34,197,94,0.04)", borderBottom: "1px solid rgba(34,197,94,0.12)", padding: "7px 12px", display: "flex", gap: 6 }}>
        {["API Keys","Webhooks","Docs"].map(t => (
          <span
            key={t}
            style={{
              padding:      "1px 8px",
              borderRadius: 4,
              fontSize:     9,
              fontFamily:   "var(--font-mono)",
              color:        t === "API Keys" ? "rgba(34,197,94,0.8)" : "rgba(255,255,255,0.25)",
              background:   t === "API Keys" ? "rgba(34,197,94,0.12)" : "transparent",
              border:       t === "API Keys" ? "1px solid rgba(34,197,94,0.2)" : "none",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid rgba(34,197,94,0.08)" }}>
        <span style={{ color: "#22C55E", fontSize: 10 }}>bk_live_</span>
        <span style={{ color: "rgba(34,197,94,0.35)", fontSize: 10 }}>{"•".repeat(14)}</span>
        <span style={{ color: "#22C55E", fontSize: 10 }}>Xk9m</span>
        <div style={{ display: "flex", gap: 3, marginLeft: "auto" }}>
          {["Reveal","Copy"].map(l => (
            <span key={l} style={{ padding: "1px 7px", borderRadius: 3, fontSize: 8, color: "rgba(34,197,94,0.6)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 12px", lineHeight: 1.8, whiteSpace: "pre-wrap", position: "relative" }}>
        {segments.map((seg, i) => (
          <span key={i} style={{ color: seg.color }}>
            {seg.text}
          </span>
        ))}
        {active && !done && (
          <span style={{ display: "inline-block", width: 5, height: 11, background: "#22C55E", verticalAlign: "middle", animation: "cursorBlink 1s step-end infinite" }} />
        )}
      </div>

      <AnimatePresence>
        {done && active && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{    opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            style={{
              position:  "absolute",
              right:     12,
              bottom:    12,
              background:"rgba(10,15,10,0.97)",
              border:    "1px solid rgba(34,197,94,0.25)",
              borderRadius: 7,
              padding:   "7px 10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", fontFamily: "var(--font-mono)" }}>
              201 Created
            </span>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)", marginTop: 3 }}>
              id: "inc_xK9m..."
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function BentoGrid() {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-16">
      <div className="text-center mb-10">
        <p className="text-2xs font-mono uppercase tracking-widest mb-3" style={{ color: "rgba(59,130,246,0.8)" }}>
          Everything you need
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.92)" }}>
          The complete reliability stack
        </h2>
        <p className="text-base max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
          Monitoring, incidents, status pages, and notifications -- all in one open source platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <FeatureCard
          title="Uptime Monitoring"
          description="Watch every service 24/7. HTTP, TCP, and ICMP checks at 30-second intervals."
          className="lg:row-span-1"
        >
          <div style={{ height: 240 }}>
            <UptimeVisual />
          </div>
        </FeatureCard>

        <FeatureCard
          title="Incident Management"
          description="Structured workflow from detection to resolution with team updates."
          className="lg:row-span-1"
        >
          <div style={{ height: 240 }}>
            <IncidentVisual />
          </div>
        </FeatureCard>

        <FeatureCard
          title="Public Status Pages"
          description="Branded, live status pages your customers actually trust."
          className="lg:row-span-1"
        >
          <div style={{ height: 240 }}>
            <StatusPageVisual />
          </div>
        </FeatureCard>

        <FeatureCard
          title="Telegram Notifications"
          description="Subscribers get instant alerts the moment an incident starts or resolves."
        >
          <div style={{ height: 200 }}>
            <TelegramVisual />
          </div>
        </FeatureCard>

        <FeatureCard
          title="Slack Notifications"
          description="Structured Slack alerts in the right channel with full context."
        >
          <div style={{ height: 200 }}>
            <SlackVisual />
          </div>
        </FeatureCard>

        <FeatureCard
          title="Historical Reporting"
          description="90 days of uptime history. Honest, exportable, and clear."
        >
          <div style={{ height: 200 }}>
            <ReportingVisual />
          </div>
        </FeatureCard>

        <FeatureCard
          title="API & Integrations"
          description="Full REST API. Automate incident creation, monitor management, and more."
          className="lg:col-span-3"
        >
          <div style={{ height: 180 }}>
            <APIVisual />
          </div>
        </FeatureCard>
      </div>
    </section>
  )
}