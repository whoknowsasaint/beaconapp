"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const TIMELINE = [
  { time: "09:42:03", type: "auto",   text: "Monitor check failed: connection refused on api.acme.com:443",    status: "investigating" },
  { time: "09:42:04", type: "auto",   text: "Incident opened automatically. CRITICAL severity assigned.",       status: "investigating" },
  { time: "09:42:05", type: "auto",   text: "847 Telegram subscribers notified. 2 Slack channels notified.",    status: "investigating" },
  { time: "09:44:18", type: "manual", text: "We are investigating elevated error rates. Upstream logs show connection timeouts. -- AK", status: "investigating" },
  { time: "09:51:07", type: "manual", text: "Root cause: misconfigured load balancer rule dropped 18% of requests. Fix in progress. -- SY", status: "identified" },
  { time: "10:03:44", type: "manual", text: "Fix deployed across all regions. Monitoring traffic for full recovery. Error rate dropping. -- AK", status: "monitoring" },
  { time: "10:05:58", type: "auto",   text: "Monitor check passed. Response time: 142ms. Status restored to operational.", status: "resolved" },
  { time: "10:06:00", type: "auto",   text: "Incident resolved automatically. Duration: 23m 57s. Subscribers notified.", status: "resolved" },
]

const STATUS_COLOR = {
  investigating: "#EF4444",
  identified:    "#F59E0B",
  monitoring:    "#3B82F6",
  resolved:      "#22C55E",
}

export default function IncidentStage() {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(v => (v < TIMELINE.length ? v + 1 : v))
    }, 600)
    return () => clearInterval(id)
  }, [])

  const currentStatus = TIMELINE[Math.min(visible - 1, TIMELINE.length - 1)]?.status ?? "investigating"
  const isResolved    = visible >= TIMELINE.length

  return (
    <section
      style={{
        padding:    "80px 0",
        background: "#060809",
        position:   "relative",
        overflow:   "hidden",
      }}
    >
      <div
        style={{
          position:   "absolute",
          inset:      0,
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(239,68,68,0.06), transparent)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "rgba(59,130,246,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Incident management
          </p>
          <h2 style={{ fontSize: 34, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em", marginBottom: 10, lineHeight: 1.15 }}>
            From detection to resolution.
            <br />
            <span style={{ color: "rgba(255,255,255,0.45)" }}>Every step documented.</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div
            style={{
              border:       `1px solid ${isResolved ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.18)"}`,
              borderRadius: 12,
              background:   isResolved ? "rgba(34,197,94,0.02)" : "rgba(239,68,68,0.02)",
              padding:      "20px 20px 16px",
              transition:   "all 0.4s",
              display:      "flex",
              flexDirection:"column",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 6 }}>
                  API Gateway -- Elevated Error Rate
                </p>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <motion.span
                    style={{
                      display:       "inline-flex",
                      alignItems:    "center",
                      gap:           4,
                      padding:       "2px 8px",
                      borderRadius:  9999,
                      fontSize:      9,
                      fontWeight:    600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      background:    `${STATUS_COLOR[currentStatus]}15`,
                      color:         STATUS_COLOR[currentStatus],
                      border:        `1px solid ${STATUS_COLOR[currentStatus]}30`,
                    }}
                    animate={{ color: STATUS_COLOR[currentStatus] }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.span
                      style={{ width: 4, height: 4, borderRadius: "50%", background: STATUS_COLOR[currentStatus], display: "inline-block" }}
                      animate={!isResolved ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                      transition={{ duration: 1.5, repeat: isResolved ? 0 : Infinity }}
                    />
                    {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                  </motion.span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                    Critical · Auto-detected
                  </span>
                </div>
              </div>
              <motion.div
                style={{
                  padding:    "4px 10px",
                  borderRadius: 6,
                  fontSize:   11,
                  fontFamily: "var(--font-mono)",
                  background: "rgba(255,255,255,0.04)",
                  color:      "rgba(255,255,255,0.45)",
                  border:     "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {isResolved ? "23m 57s" : "ongoing"}
              </motion.div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16 }}>
              {[["investigating","Investigating","#EF4444"],["identified","Identified","#F59E0B"],["monitoring","Monitoring","#3B82F6"],["resolved","Resolved","#22C55E"]].map(([id, label, color], i) => {
                const statuses  = ["investigating","identified","monitoring","resolved"]
                const curIdx    = statuses.indexOf(currentStatus)
                const thisIdx   = i
                const isDone    = thisIdx < curIdx || (isResolved && thisIdx === 3)
                const isThis    = thisIdx === curIdx && !isResolved

                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <motion.div
                        style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center" }}
                        animate={{ borderColor: isDone || isThis ? color : "rgba(255,255,255,0.12)", backgroundColor: isDone ? color : isThis ? `${color}20` : "transparent" }}
                        transition={{ duration: 0.4 }}
                      >
                        {isDone ? (
                          <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" style={{ width: 8, height: 8 }}>
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <motion.span style={{ width: 5, height: 5, borderRadius: "50%", display: "inline-block" }} animate={{ backgroundColor: isThis ? color : "rgba(255,255,255,0.15)" }} />
                        )}
                      </motion.div>
                      <span style={{ fontSize: 8, color: isDone || isThis ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>{label}</span>
                    </div>
                    {i < 3 && (
                      <motion.div style={{ flex: 1, height: 1, margin: "0 3px", marginBottom: 14 }} animate={{ backgroundColor: isDone ? color : "rgba(255,255,255,0.08)" }} transition={{ duration: 0.4 }} />
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Affected monitors", value: "1"  },
                { label: "Subscribers notified", value: "861" },
                { label: "Auto-resolved", value: isResolved ? "Yes" : "--" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 7, padding: "8px 10px" }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-mono)", marginBottom: 2 }}>{stat.value}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              border:       "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              background:   "#0A0D12",
              display:      "flex",
              flexDirection:"column",
              overflow:     "hidden",
            }}
          >
            <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>
                Incident timeline
              </span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
                {visible} events
              </span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
              {TIMELINE.slice(0, visible).map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1,  x:  0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", gap: 10, padding: "5px 16px" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{
                      width:        8,
                      height:       8,
                      borderRadius: "50%",
                      background:   entry.type === "auto" ? "rgba(255,255,255,0.2)" : STATUS_COLOR[entry.status],
                      marginTop:    4,
                      flexShrink:   0,
                    }} />
                    {i < TIMELINE.slice(0, visible).length - 1 && (
                      <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 3 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}>
                        {entry.time}
                      </span>
                      <span style={{
                        fontSize:   8,
                        padding:    "0 5px",
                        borderRadius: 3,
                        background: entry.type === "auto" ? "rgba(255,255,255,0.05)" : `${STATUS_COLOR[entry.status]}15`,
                        color:      entry.type === "auto" ? "rgba(255,255,255,0.3)" : STATUS_COLOR[entry.status],
                        border:     `1px solid ${entry.type === "auto" ? "rgba(255,255,255,0.08)" : `${STATUS_COLOR[entry.status]}25`}`,
                      }}>
                        {entry.type === "auto" ? "auto" : entry.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                      {entry.text}
                    </p>
                  </div>
                </motion.div>
              ))}

              {!isResolved && visible > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 16px" }}>
                  <motion.div
                    style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", flexShrink: 0 }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)" }}>
                    Monitoring...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}