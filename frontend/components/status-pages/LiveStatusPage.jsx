"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import usePolling from "@/lib/usePolling"

const API_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : "http://localhost:8000"

async function fetchPageData(slug) {
  const res = await fetch(`${API_URL}/api/v1/status-pages/${slug}/public/`, { cache: "no-store" })
  if (!res.ok) return null
  const page = await res.json()

  try {
    const uptimeRes = await fetch(
      `${API_URL}/api/v1/status-pages/${slug}/uptime/?days=90`,
      { cache: "no-store" }
    )
    if (uptimeRes.ok) {
      const uptimeData = await uptimeRes.json()
      const uptimeMap  = {}
      for (const mon of uptimeData.monitors ?? []) uptimeMap[mon.id] = mon.buckets ?? []
      return {
        ...page,
        monitors: (page.monitors ?? []).map(m => ({
          ...m,
          uptime_buckets: m.show_uptime_history ? (uptimeMap[m.id] ?? []) : [],
        })),
      }
    }
  } catch {}

  return page
}

function getOverallStatus(page) {
  const monitors = page.monitors ?? []
  if (monitors.some(m => m.status === "outage"))   return "outage"
  if (monitors.some(m => m.status === "degraded"))  return "degraded"
  const active = (page.active_incidents ?? []).filter(i => i.status !== "resolved")
  if (active.length > 0)                            return "degraded"
  return "operational"
}

const STATUS_CONFIG = {
  operational: { label: "All Systems Operational", color: "#22C55E", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)"  },
  degraded:    { label: "Partial Outage",           color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  outage:      { label: "Major Outage",             color: "#EF4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)"  },
}

const MONITOR_STATUS = {
  operational: { label: "Operational", color: "#22C55E", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.2)"  },
  degraded:    { label: "Degraded",    color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
  outage:      { label: "Outage",      color: "#EF4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)"  },
  pending:     { label: "Pending",     color: "#6B7280", bg: "rgba(107,114,128,0.1)",border: "rgba(107,114,128,0.2)"},
  paused:      { label: "Paused",      color: "#6B7280", bg: "rgba(107,114,128,0.1)",border: "rgba(107,114,128,0.2)"},
}

const INCIDENT_STATUS = {
  investigating: { label: "Investigating", color: "#EF4444" },
  identified:    { label: "Identified",    color: "#F59E0B" },
  monitoring:    { label: "Monitoring",    color: "#3B82F6" },
  resolved:      { label: "Resolved",      color: "#22C55E" },
}

function StatusBadge({ status }) {
  const cfg = MONITOR_STATUS[status] ?? MONITOR_STATUS.pending
  return (
    <span style={{
      display:       "inline-flex",
      alignItems:    "center",
      gap:           5,
      padding:       "3px 10px",
      borderRadius:  "9999px",
      fontSize:      11,
      fontWeight:    500,
      letterSpacing: "0.03em",
      background:    cfg.bg,
      color:         cfg.color,
      border:        `1px solid ${cfg.border}`,
      flexShrink:    0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  )
}

function UptimeBars({ buckets }) {
  if (!buckets || buckets.length === 0) return null
  const display = buckets.slice(-60)

  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 24 }}>
      {display.map((b, i) => {
        const color =
          b.status === "up"      ? "#22C55E" :
          b.status === "down"    ? "#EF4444" :
          b.status === "degraded"? "#F59E0B" :
          "rgba(255,255,255,0.1)"
        return (
          <motion.div
            key={i}
            title={`${b.date}: ${b.status}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: i * 0.008, ease: [0.16, 1, 0.3, 1] }}
            style={{
              flex:            "0 0 3px",
              height:          b.status === "no_data" ? 8 : 20,
              borderRadius:    1.5,
              background:      color,
              opacity:         b.status === "no_data" ? 0.2 : 0.75,
              transformOrigin: "bottom",
              cursor:          "default",
            }}
          />
        )
      })}
    </div>
  )
}

function IncidentCard({ incident }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = INCIDENT_STATUS[incident.status] ?? INCIDENT_STATUS.investigating

  function formatTime(str) {
    if (!str) return ""
    return new Date(str).toLocaleDateString("en-US", {
      month: "long", day: "numeric",
      hour:  "2-digit", minute: "2-digit",
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background:   "rgba(255,255,255,0.03)",
        border:       "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        overflow:     "hidden",
        cursor:       "pointer",
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color, display: "inline-block", flexShrink: 0 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {incident.title}
            </p>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            Started {formatTime(incident.started_at)}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: cfg.color,
            padding: "3px 10px", borderRadius: "9999px",
            background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`,
          }}>
            {cfg.label}
          </span>
          <motion.svg
            viewBox="0 0 10 6" fill="none" stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5" style={{ width: 10, height: 10, flexShrink: 0 }}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (incident.updates ?? []).length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {(incident.updates ?? []).map((u, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 4 }} />
                    {i < (incident.updates ?? []).length - 1 && (
                      <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 8 }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 4px" }}>
                      {formatTime(u.created_at)}
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.5 }}>
                      {u.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function BackgroundGrid() {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position:            "absolute",
        inset:               0,
        backgroundImage:     "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize:      "52px 52px",
        maskImage:           "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
        WebkitMaskImage:     "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
      }} />
    </div>
  )
}

export default function LiveStatusPage({ initialPage, slug }) {
  const [page,        setPage]        = useState(initialPage)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [hasError,    setHasError]    = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPageData(slug)
      if (data) { setPage(data); setLastUpdated(new Date()); setHasError(false) }
    } catch { setHasError(true) }
  }, [slug])

  usePolling(refresh, 30000)

  if (!page) return null

  const overallStatus  = getOverallStatus(page)
  const statusCfg      = STATUS_CONFIG[overallStatus]
  const activeIncidents = (page.active_incidents ?? []).filter(i => i.status !== "resolved")
  const monitors        = page.monitors ?? []

  function formatUpdated(d) {
    if (!d) return null
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080B10", position: "relative" }}>
      <BackgroundGrid />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "0 20px 80px" }}>

        <div style={{ paddingTop: 60, paddingBottom: 48 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #1D4ED8, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(37,99,235,0.3)" }}>
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                  <circle cx="10" cy="18" r="2.2" fill="white"/>
                  <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
                  <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
                  <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25"/>
                </svg>
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: 0, letterSpacing: "-0.02em" }}>
                {page.name}
              </h1>
            </div>

            {page.description && (
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 20, paddingLeft: 46 }}>
                {page.description}
              </p>
            )}

            <motion.div
              key={overallStatus}
              initial={{ opacity: 0.7, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          10,
                padding:      "10px 18px",
                borderRadius: 10,
                background:   statusCfg.bg,
                border:       `1px solid ${statusCfg.border}`,
                marginLeft:   46,
              }}
            >
              <motion.span
                style={{ width: 9, height: 9, borderRadius: "50%", background: statusCfg.color, display: "inline-block" }}
                animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: statusCfg.color }}>
                {statusCfg.label}
              </span>
            </motion.div>
          </motion.div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 40 }} />

        {activeIncidents.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ marginBottom: 40 }}
          >
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
              Active Incidents
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activeIncidents.map(i => <IncidentCard key={i.id} incident={i} />)}
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{ marginBottom: 40 }}
        >
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
            Services
          </p>

          {monitors.length === 0 ? (
            <div style={{ padding: "24px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>No services configured.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {monitors.map((monitor, idx) => (
                <motion.div
                  key={monitor.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * idx }}
                  style={{
                    background:   "rgba(255,255,255,0.025)",
                    border:       "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding:      "14px 18px",
                    display:      "flex",
                    alignItems:   "center",
                    gap:          16,
                    flexWrap:     "wrap",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.82)", flex: 1, minWidth: 120 }}>
                    {monitor.name ?? monitor.public_name}
                  </span>

                  {monitor.show_uptime_history && monitor.uptime_buckets?.length > 0 && (
                    <div style={{ flex: 2, minWidth: 100 }}>
                      <UptimeBars buckets={monitor.uptime_buckets} />
                    </div>
                  )}

                  <StatusBadge status={monitor.status} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Subscribe section has been removed entirely */}

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>
            Powered by{" "}
            <a href="/" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
            >
              Beacon
            </a>
          </p>
        </div>
      </div>

      {lastUpdated && (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 20 }}>
          <div style={{
            display:        "flex",
            alignItems:     "center",
            gap:            6,
            padding:        "6px 12px",
            borderRadius:   "9999px",
            background:     "rgba(8,11,16,0.9)",
            border:         "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)",
          }}>
            <motion.span
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
              Updated {formatUpdated(lastUpdated)}
            </span>
          </div>
        </div>
      )}

      {hasError && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 20 }}>
          <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <span style={{ fontSize: 12, color: "#F59E0B" }}>Connection issue- retrying...</span>
          </div>
        </div>
      )}
    </div>
  )
}