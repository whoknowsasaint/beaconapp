"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import usePolling from "@/lib/usePolling"
import { useBreakpoint } from "@/lib/useBreakpoint"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function fetchJson(path) {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include", cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

function StatCard({ label, value, color, loading, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{
        background:   "#111318",
        border:       "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding:      "18px 20px",
        cursor:       onClick ? "pointer" : "default",
        boxShadow:    "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 700, color: loading ? "rgba(255,255,255,0.2)" : (color ?? "rgba(255,255,255,0.9)"), fontFamily: "var(--font-jetbrains-mono,monospace)", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {loading ? "—" : value}
      </p>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router               = useRouter()
  const { isMobile, mounted} = useBreakpoint()
  const [monitors,  setMonitors]  = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    const [m, i] = await Promise.all([
      fetchJson("/api/v1/monitors/"),
      fetchJson("/api/v1/incidents/?ordering=-started_at"),
    ])
    if (m) setMonitors(m.results  ?? [])
    if (i) setIncidents(i.results ?? [])
    setLoading(false)
  }, [])

  usePolling(load, 30000)

  const operational = monitors.filter(m => m.status === "operational").length
  const outage      = monitors.filter(m => m.status === "outage").length
  const active      = incidents.filter(i => i.status !== "resolved").length
  const mobile      = mounted && isMobile

  return (
    <div style={{ padding: mobile ? "20px 16px" : "32px 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: mobile ? 20 : 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: mobile ? 18 : 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", marginBottom: 2 }}>
            Overview
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Live · updates every 30s</p>
        </div>
        {active > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => router.push("/dashboard/incidents")}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            <motion.span
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            {active} active incident{active > 1 ? "s" : ""}
          </motion.button>
        )}
      </div>

      {/* Stat cards — 2×2 on mobile, 4×1 on desktop */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)",
        gap:                 mobile ? 8 : 12,
        marginBottom:        mobile ? 16 : 24,
      }}>
        <StatCard label="Total monitors"    value={monitors.length}  loading={loading} onClick={() => router.push("/dashboard/monitors")} />
        <StatCard label="Operational"       value={operational}      loading={loading} color="#22C55E" />
        <StatCard label="Active incidents"  value={active}           loading={loading} color={active > 0 ? "#EF4444" : "#22C55E"} onClick={() => router.push("/dashboard/incidents")} />
        <StatCard label="Outage / degraded" value={outage}           loading={loading} color={outage > 0 ? "#EF4444" : "rgba(255,255,255,0.9)"} />
      </div>

      {/* Monitors + Incidents panels */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
        gap:                 mobile ? 8 : 12,
        marginBottom:        12,
      }}>
        {/* Monitors */}
        <div style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Monitors</p>
            <button onClick={() => router.push("/dashboard/monitors")} style={{ fontSize: 11, color: "#3B82F6", background: "none", border: "none", cursor: "pointer" }}>
              {monitors.length === 0 ? "Add →" : "View all →"}
            </button>
          </div>
          {loading ? (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Loading...</p>
          ) : monitors.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              No monitors yet.{" "}
              <button onClick={() => router.push("/dashboard/monitors")} style={{ color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                Add one →
              </button>
            </p>
          ) : (
            monitors.slice(0, mobile ? 4 : 6).map(m => (
              <div
                key={m.id}
                onClick={() => router.push(`/dashboard/monitors/${m.id}`)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: m.status === "operational" ? "#22C55E" : m.status === "outage" ? "#EF4444" : "#F59E0B", display: "inline-block" }} />
                <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", textTransform: "capitalize", flexShrink: 0 }}>{m.status}</span>
              </div>
            ))
          )}
        </div>

        {/* Recent incidents */}
        <div style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Recent Incidents</p>
            <button onClick={() => router.push("/dashboard/incidents")} style={{ fontSize: 11, color: "#3B82F6", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          {loading ? (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Loading...</p>
          ) : incidents.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No incidents. All clear ✓</p>
          ) : (
            incidents.slice(0, mobile ? 4 : 5).map(i => {
              const mins = Math.floor((Date.now() - new Date(i.started_at)) / 60000)
              const rel  = mins < 60 ? `${mins}m ago` : `${Math.floor(mins/60)}h ago`
              return (
                <div
                  key={i.id}
                  onClick={() => router.push(`/dashboard/incidents/${i.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: i.status === "resolved" ? "#22C55E" : "#EF4444", display: "inline-block" }} />
                  <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", flexShrink: 0 }}>{rel}</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Quick nav cards */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr", gap: mobile ? 8 : 12 }}>
        {[
          { label: "Status Pages", desc: "Manage your public pages",  path: "/dashboard/status-pages" },
          { label: "API Keys",     desc: "Create and revoke API keys", path: "/dashboard/api-keys"     },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: mobile ? "14px 16px" : "18px 20px", textAlign: "left", cursor: "pointer", transition: "border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
          >
            <p style={{ fontSize: mobile ? 13 : 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>{item.label}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}