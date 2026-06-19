"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import usePolling from "@/lib/usePolling"
import { useBreakpoint } from "@/lib/useBreakpoint"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getCsrf() {
  const m = document.cookie.match(/csrftoken=([^;]+)/)
  return m ? m[1] : ""
}

async function apiFetch(path, options = {}) {
  return fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrf(), ...options.headers },
    ...options,
  })
}

const STATUS_CONFIG = {
  operational: { label: "Operational", color: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)"   },
  degraded:    { label: "Degraded",    color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)"  },
  outage:      { label: "Outage",      color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)"   },
  pending:     { label: "Pending",     color: "#6B7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
  paused:      { label: "Paused",      color: "#6B7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
}

function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 8,  scale: 0.96 }}
      transition={{ duration: 0.22 }}
      style={{
        position:     "fixed",
        bottom:       24,
        right:        24,
        zIndex:       100,
        padding:      "10px 16px",
        borderRadius: 10,
        background:   type === "error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
        border:       `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
        color:        type === "error" ? "#EF4444" : "#22C55E",
        fontSize:     13,
        fontWeight:   500,
        boxShadow:    "0 8px 32px rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
      }}
    >
      {message}
    </motion.div>
  )
}

function UptimeBars({ buckets, loading }) {
  const TOTAL = 90

  if (loading) {
    return (
      <div>
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 36, marginBottom: 8 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <motion.div
              key={i}
              style={{ flex: 1, height: 20, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, delay: i * 0.008, repeat: Infinity }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>90 days ago</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>Today</span>
        </div>
      </div>
    )
  }

  const display = buckets && buckets.length > 0
    ? buckets
    : Array.from({ length: TOTAL }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (TOTAL - 1 - i))
        return { date: d.toISOString().split("T")[0], status: "no_data", up: 0, down: 0 }
      })

  const withData  = display.filter(b => b.status !== "no_data")
  const upCount   = withData.filter(b => b.status === "up").length
  const uptimePct = withData.length > 0
    ? ((upCount / withData.length) * 100).toFixed(2)
    : null

  return (
    <div>
      {uptimePct !== null && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: "#22C55E", fontFamily: "var(--font-jetbrains-mono,monospace)", letterSpacing: "-0.03em" }}>
              {uptimePct}%
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              uptime over 90 days
            </span>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {[
              ["#22C55E", "Up"],
              ["#F59E0B", "Degraded"],
              ["#EF4444", "Down"],
              ["rgba(255,255,255,0.2)", "No data"],
            ].map(([color, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 36 }}>
        {display.map((b, i) => {
          const isNoData = b.status === "no_data"
          const color =
            b.status === "up"       ? "#22C55E" :
            b.status === "down"     ? "#EF4444" :
            b.status === "degraded" ? "#F59E0B" :
            "rgba(255,255,255,0.15)"

          return (
            <motion.div
              key={i}
              title={`${b.date} · ${b.status}${b.up > 0 ? ` · ${b.up} checks up` : ""}${b.down > 0 ? ` · ${b.down} checks down` : ""}`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.25, delay: i * 0.004, ease: [0.16, 1, 0.3, 1] }}
              style={{
                flex:            1,
                height:          isNoData ? 16 : 32,
                borderRadius:    2,
                background:      color,
                opacity:         isNoData ? 0.35 : 0.88,
                transformOrigin: "bottom",
                cursor:          isNoData ? "default" : "pointer",
                transition:      "opacity 0.15s",
              }}
              whileHover={!isNoData ? { opacity: 1, scaleY: 1.06 } : {}}
            />
          )
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
          90 days ago
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
          Today
        </span>
      </div>
    </div>
  )
}

function CheckHistoryRow({ check, index }) {
  const isUp = check.status === "up"

  function formatTime(str) {
    if (!str) return "—"
    return new Date(str).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  function formatMs(ms) {
    if (!ms && ms !== 0) return "—"
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
    return `${ms}ms`
  }

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <td style={{ padding: "10px 12px" }}>
        <span style={{
          display:      "inline-flex",
          alignItems:   "center",
          gap:          5,
          padding:      "2px 8px",
          borderRadius: "9999px",
          fontSize:     11,
          fontWeight:   500,
          background:   isUp ? "rgba(34,197,94,0.1)"   : "rgba(239,68,68,0.1)",
          color:        isUp ? "#22C55E"                : "#EF4444",
          border:       `1px solid ${isUp ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: isUp ? "#22C55E" : "#EF4444", display: "inline-block" }} />
          {isUp ? "Up" : "Down"}
        </span>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
        {formatMs(check.response_time_ms)}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: check.http_status_code === 200 ? "#22C55E" : "rgba(255,255,255,0.5)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
        {check.http_status_code ?? "—"}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
        {check.region ?? "local"}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
        {formatTime(check.checked_at)}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: "rgba(239,68,68,0.7)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {check.error || "—"}
      </td>
    </motion.tr>
  )
}

export default function MonitorDetailPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params?.id

  const { isMobile, mounted } = useBreakpoint()
  const mobile = mounted && isMobile

  const [monitor,        setMonitor]        = useState(null)
  const [uptimeBuckets,  setUptimeBuckets]  = useState(null)
  const [uptimeLoading,  setUptimeLoading]  = useState(true)
  const [checks,         setChecks]         = useState([])
  const [loading,        setLoading]        = useState(true)
  const [toast,          setToast]          = useState(null)
  const [showDelete,     setShowDelete]     = useState(false)
  const [deleting,       setDeleting]       = useState(false)
  const [pausing,        setPausing]        = useState(false)

  function showToast(message, type = "success") {
    setToast({ message, type, key: Date.now() })
  }

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [mRes, cRes] = await Promise.all([
        apiFetch(`/api/v1/monitors/${id}/`),
        apiFetch(`/api/v1/monitors/${id}/checks/?limit=50`),
      ])
      if (mRes.status === 401) { router.push("/login"); return }
      if (mRes.ok) setMonitor(await mRes.json())
      if (cRes.ok) {
        const cData = await cRes.json()
        setChecks(cData.results ?? cData ?? [])
      }
    } catch {
      showToast("Failed to load monitor", "error")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  const loadUptime = useCallback(async () => {
    if (!id) return
    setUptimeLoading(true)
    try {
      const res = await apiFetch(`/api/v1/monitors/${id}/uptime/?days=90`)
      if (res.ok) {
        const data = await res.json()
        setUptimeBuckets(data.buckets ?? data ?? [])
      } else {
        setUptimeBuckets([])
      }
    } catch {
      setUptimeBuckets([])
    } finally {
      setUptimeLoading(false)
    }
  }, [id])

  useEffect(() => { load(); loadUptime() }, [load, loadUptime])
  usePolling(load, 30000)

  async function togglePause() {
    if (!monitor || pausing) return
    setPausing(true)
    try {
      const newActive = !monitor.is_active
      const res = await apiFetch(`/api/v1/monitors/${id}/`, {
        method: "PATCH",
        body:   JSON.stringify({ is_active: newActive }),
      })
      if (res.ok) {
        setMonitor(await res.json())
        showToast(newActive ? "Monitor resumed" : "Monitor paused")
      } else {
        showToast("Failed to update monitor", "error")
      }
    } catch {
      showToast("Network error", "error")
    } finally {
      setPausing(false)
    }
  }

  async function deleteMonitor() {
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/v1/monitors/${id}/`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        router.push("/dashboard/monitors")
      } else {
        showToast("Failed to delete", "error")
        setDeleting(false)
      }
    } catch {
      showToast("Network error", "error")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
        Loading monitor...
      </div>
    )
  }

  if (!monitor) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Monitor not found.</p>
        <button onClick={() => router.push("/dashboard/monitors")} style={{ fontSize: 13, color: "#3B82F6", background: "none", border: "none", cursor: "pointer" }}>
          ← Back to monitors
        </button>
      </div>
    )
  }

  const statusCfg  = STATUS_CONFIG[monitor.status] ?? STATUS_CONFIG.pending
  const typeLabel  = { http: "HTTP / HTTPS", tcp: "TCP Port", ping: "ICMP Ping" }[monitor.monitor_type] ?? monitor.monitor_type

  function formatDate(str) {
    if (!str) return "—"
    return new Date(str).toLocaleString("en-US", {
      year: "numeric", month: "numeric", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
  }

  const CONFIG_ROWS = [
    { label: "Type",           value: typeLabel },
    { label: "URL",            value: monitor.url   || monitor.host || "—", mono: true },
    { label: "Interval",       value: `${monitor.interval}s` },
    { label: "Timeout",        value: `${monitor.timeout}s` },
    { label: "Expected codes", value: monitor.expected_status_codes || "—" },
    { label: "Active",         value: monitor.is_active ? "Yes" : "No" },
    { label: "Last checked",   value: formatDate(monitor.last_checked_at), mono: true },
  ]

  return (
    <div style={{ flex: 1, padding: mobile ? "20px 16px" : "32px 40px", maxWidth: mobile ? "100%" : "100%", width: "100%" }}>

      <button
        onClick={() => router.push("/dashboard/monitors")}
        style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 4 }}
        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
      >
        ← Monitors
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            {monitor.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: "9999px", fontSize: 11, fontWeight: 500,
              background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
            }}>
              <motion.span
                style={{ width: 5, height: 5, borderRadius: "50%", background: statusCfg.color, display: "inline-block" }}
                animate={monitor.status === "operational" ? { opacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {statusCfg.label}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{typeLabel}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={togglePause}
            disabled={pausing}
            style={{ height: 34, padding: "0 16px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500, cursor: "pointer", opacity: pausing ? 0.6 : 1 }}
          >
            {monitor.is_active ? "Pause" : "Resume"}
          </button>
          <button
            onClick={() => setShowDelete(true)}
            style={{ height: 34, padding: "0 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Config + Uptime — responsive grid */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: mobile ? "1fr" : "1fr 2fr",
        gap:                 12,
        marginBottom:        12,
        alignItems:          "flex-start",
      }}>

        {/* Configuration */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            Configuration
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {CONFIG_ROWS.map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{row.label}</span>
                <span style={{
                  fontSize:   12,
                  color:      "rgba(255,255,255,0.75)",
                  fontFamily: row.mono ? "var(--font-jetbrains-mono,monospace)" : "inherit",
                  fontWeight: 500,
                  maxWidth:   200,
                  overflow:   "hidden",
                  textOverflow:"ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 90-day uptime */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            90-Day Uptime
          </p>
          <UptimeBars buckets={uptimeBuckets} loading={uptimeLoading} />
        </div>
      </div>

      {/* Check history */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Check History
          </p>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
            Last {checks.length} checks
          </span>
        </div>

        {checks.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No checks recorded yet. The checker worker must be running.</p>
            <code style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-jetbrains-mono,monospace)", display: "block", marginTop: 8 }}>
              python manage.py runchecker --settings=core.settings.development
            </code>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Result", "Response Time", "HTTP Status", "Region", "Checked At", "Error"].map(h => (
                    <th
                      key={h}
                      style={{
                        padding:     "8px 12px",
                        textAlign:   "left",
                        fontSize:    10,
                        fontWeight:  600,
                        color:       "rgba(255,255,255,0.3)",
                        textTransform:"uppercase",
                        letterSpacing:"0.06em",
                        whiteSpace:  "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checks.map((check, i) => (
                  <CheckHistoryRow key={check.id ?? i} check={check} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => !deleting && setShowDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#111316", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "28px 28px", maxWidth: 380, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 8 }}>Delete monitor?</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 24, lineHeight: 1.5 }}>
                This will permanently delete <strong style={{ color: "rgba(255,255,255,0.7)" }}>{monitor.name}</strong> and all its check history. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowDelete(false)}
                  disabled={deleting}
                  style={{ flex: 1, height: 38, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteMonitor}
                  disabled={deleting}
                  style={{ flex: 1, height: 38, borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  )
}