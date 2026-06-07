"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const MONITORS = [
  { name: "api.acme.com",   type: "HTTP", status: "operational", uptime: 99.98, ms: 142,  interval: "60s",  degradedAt: []        },
  { name: "auth.acme.com",  type: "HTTP", status: "operational", uptime: 100.0, ms: 89,   interval: "30s",  degradedAt: []        },
  { name: "cdn.acme.com",   type: "HTTP", status: "degraded",    uptime: 99.71, ms: 284,  interval: "60s",  degradedAt: [25,26,27]},
  { name: "db.internal",    type: "TCP",  status: "operational", uptime: 99.95, ms: 12,   interval: "30s",  degradedAt: [17]      },
  { name: "hooks.acme.com", type: "HTTP", status: "operational", uptime: 100.0, ms: 67,   interval: "120s", degradedAt: []        },
  { name: "mail.acme.com",  type: "HTTP", status: "operational", uptime: 99.99, ms: 203,  interval: "300s", degradedAt: []        },
]

const INCIDENT_UPDATES = [
  { initials: "AK", time: "09:44", status: "investigating", message: "We are investigating elevated error rates on the API Gateway. Upstream logs show connection timeouts." },
  { initials: "SY", time: "09:51", status: "investigating", message: "Root cause identified: a misconfigured load balancer rule dropped 18% of requests." },
  { initials: "AK", time: "10:03", status: "monitoring",    message: "Fix deployed to all regions. Monitoring traffic for full recovery. Error rate dropping." },
]

const STATUS_SVCS = [
  { name: "API",            status: "operational", uptime: 99.98 },
  { name: "Authentication", status: "operational", uptime: 100.0 },
  { name: "CDN",            status: "degraded",    uptime: 99.71 },
  { name: "Database",       status: "operational", uptime: 99.95 },
  { name: "Email",          status: "operational", uptime: 99.99 },
]

const NOTIF_LOG = [
  { ch: "Telegram", color: "#229ED9", target: "847 subscribers",  event: "Incident opened",   time: "09:44", ok: true  },
  { ch: "Slack",    color: "#4A154B", target: "#ops-alerts",       event: "Incident opened",   time: "09:44", ok: true  },
  { ch: "Email",    color: "#3B82F6", target: "12 subscribers",    event: "Incident opened",   time: "09:44", ok: true  },
  { ch: "Telegram", color: "#229ED9", target: "847 subscribers",   event: "Incident resolved", time: "10:06", ok: true  },
  { ch: "Slack",    color: "#4A154B", target: "#ops-alerts",       event: "Incident resolved", time: "10:06", ok: true  },
  { ch: "Email",    color: "#3B82F6", target: "12 subscribers",    event: "Incident resolved", time: "10:06", ok: false },
]

function StatusDot({ status }) {
  const color = status === "operational" ? "#22C55E" : status === "degraded" ? "#F59E0B" : "#EF4444"
  return (
    <motion.span
      style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }}
      animate={status !== "operational" ? { opacity: [1, 0.4, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  )
}

function StatusBadge({ status }) {
  const cfg = {
    operational: { label: "Operational", color: "#22C55E", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.2)"  },
    degraded:    { label: "Degraded",    color: "#F59E0B", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.2)" },
    outage:      { label: "Outage",      color: "#EF4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.2)"  },
  }[status] ?? { label: status, color: "rgba(255,255,255,0.4)", bg: "transparent", border: "rgba(255,255,255,0.1)" }

  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      gap:          4,
      padding:      "2px 7px",
      borderRadius: 9999,
      fontSize:     9,
      fontWeight:   500,
      textTransform:"uppercase",
      letterSpacing:"0.04em",
      background:   cfg.bg,
      color:        cfg.color,
      border:       `1px solid ${cfg.border}`,
      flexShrink:   0,
      whiteSpace:   "nowrap",
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  )
}

function UptimeBars({ degradedAt }) {
  return (
    <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
      {Array.from({ length: 28 }).map((_, i) => {
        const isDeg = degradedAt.includes(i)
        return (
          <div
            key={i}
            style={{
              width:        2.5,
              height:       isDeg ? 12 : 16,
              borderRadius: 1,
              background:   isDeg ? "#F59E0B" : "#22C55E",
              opacity:      isDeg ? 0.9 : 0.55 + Math.random() * 0.3,
              flexShrink:   0,
            }}
          />
        )
      })}
    </div>
  )
}

function MonitoringView({ tick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>Monitors</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            6 monitors · 1 degraded · avg 99.94% uptime
          </p>
        </div>
        <button style={{ height: 28, padding: "0 12px", fontSize: 11, fontWeight: 500, background: "#3B82F6", color: "white", borderRadius: 7, border: "none", cursor: "pointer" }}>
          + Add monitor
        </button>
      </div>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", padding: "0 20px", flexShrink: 0 }}>
        {["Name","Uptime (90d)","Response","Interval","Status"].map((h, i) => (
          <div key={h} style={{
            fontSize:   9,
            fontWeight: 500,
            color:      "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding:    "6px 0",
            flex:       [3,4,2,2,2][i],
          }}>
            {h}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {MONITORS.map((m, i) => {
          const fluctMs = m.ms + Math.floor(Math.sin(tick * 0.7 + i) * 5)
          return (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1,  x:  0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              style={{
                display:       "flex",
                alignItems:    "center",
                padding:       "0 20px",
                height:        40,
                borderBottom:  "1px solid rgba(255,255,255,0.04)",
                background:    m.status === "degraded" ? "rgba(245,158,11,0.02)" : "transparent",
                transition:    "background 0.15s",
              }}
              whileHover={{ background: "rgba(255,255,255,0.025)" }}
            >
              <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 8 }}>
                <StatusDot status={m.status} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-mono)" }}>
                  {m.name}
                </span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "1px 5px" }}>
                  {m.type}
                </span>
              </div>

              <div style={{ flex: 4 }}>
                <UptimeBars degradedAt={m.degradedAt} />
              </div>

              <div style={{ flex: 2 }}>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: m.ms > 200 ? "#F59E0B" : "rgba(255,255,255,0.55)" }}>
                  {fluctMs}ms
                </span>
              </div>

              <div style={{ flex: 2 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)" }}>
                  {m.interval}
                </span>
              </div>

              <div style={{ flex: 2 }}>
                <StatusBadge status={m.status} />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div style={{ padding: "8px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 12 }}>
          {[["#22C55E","5 operational"],["#F59E0B","1 degraded"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{l}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <motion.span
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", display: "inline-block" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>
            Last check: {tick % 30}s ago
          </span>
        </div>
      </div>
    </div>
  )
}

function IncidentView() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s < 2 ? s + 1 : s)), 2000)
    return () => clearInterval(id)
  }, [])

  const STEPS = [
    { label: "Investigating", color: "#EF4444" },
    { label: "Identified",    color: "#F59E0B" },
    { label: "Monitoring",    color: "#3B82F6" },
    { label: "Resolved",      color: "#22C55E" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>Incidents</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>2 active · 14 resolved this month</p>
        </div>
        <button style={{ height: 28, padding: "0 12px", fontSize: 11, fontWeight: 500, background: "#EF4444", color: "white", borderRadius: 7, border: "none", cursor: "pointer" }}>
          + Create incident
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, background: "rgba(239,68,68,0.03)", padding: "14px 16px", marginBottom: 10 }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 5 }}>
                API Gateway -- Elevated Error Rate
              </p>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <motion.span
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 9999, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 0 8px rgba(239,68,68,0.2)" }}
                  animate={{ boxShadow: ["0 0 0px rgba(239,68,68,0.1)","0 0 10px rgba(239,68,68,0.3)","0 0 0px rgba(239,68,68,0.1)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.span style={{ width: 4, height: 4, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  Critical
                </motion.span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Auto-detected · 09:42 UTC</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>23m</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14 }}>
            {STEPS.map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <motion.div
                    style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center" }}
                    animate={{ borderColor: i <= step ? s.color : "rgba(255,255,255,0.12)", backgroundColor: i < step ? s.color : i === step ? `${s.color}20` : "transparent" }}
                    transition={{ duration: 0.4 }}
                  >
                    {i < step ? (
                      <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" style={{ width: 8, height: 8 }}>
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <motion.span style={{ width: 5, height: 5, borderRadius: "50%", display: "inline-block" }} animate={{ backgroundColor: i === step ? s.color : "rgba(255,255,255,0.15)" }} transition={{ duration: 0.3 }} />
                    )}
                  </motion.div>
                  <span style={{ fontSize: 8, color: i <= step ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
                    {s.label}
                  </span>
                </div>
                {i < 3 && (
                  <motion.div
                    style={{ flex: 1, height: 1, margin: "0 3px", marginBottom: 14 }}
                    animate={{ backgroundColor: i < step ? s.color : "rgba(255,255,255,0.08)" }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontWeight: 500 }}>Updates</p>
            {INCIDENT_UPDATES.slice(0, step + 1).map((u, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex", gap: 8, marginBottom: 8 }}
              >
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.45)", flexShrink: 0, marginTop: 1 }}>
                  {u.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{u.initials}</span>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)" }}>{u.time}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{u.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div style={{ border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, opacity: 0.5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>Database connection spike</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Minor · Resolved · 2h ago · 4m duration</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusPageView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>Status Pages</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>2 pages · 859 active subscribers</p>
        </div>
        <button style={{ height: 28, padding: "0 12px", fontSize: 11, fontWeight: 500, background: "#3B82F6", color: "white", borderRadius: 7, border: "none" }}>
          + New page
        </button>
      </div>

      <div style={{ flex: 1, padding: "0 20px 16px", overflowY: "auto" }}>
        {[
          { name: "Acme Corp Status", slug: "acme",     overall: "degraded",    subscribers: 847, monitors: 5 },
          { name: "API Status",       slug: "acme-api", overall: "operational", subscribers: 12,  monitors: 2 },
        ].map((page, i) => (
          <div key={page.slug} style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{page.name}</p>
                  <StatusBadge status={page.overall} />
                </div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>
                  status.acme.com/{page.slug}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{page.subscribers} subscribers</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{page.monitors} monitors</p>
              </div>
            </div>
            <div style={{ padding: "10px 14px" }}>
              {STATUS_SVCS.slice(0, i === 0 ? 5 : 2).map(svc => (
                <div key={svc.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <StatusDot status={svc.status} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", flex: 1 }}>{svc.name}</span>
                  <div style={{ display: "flex", gap: 1 }}>
                    {Array.from({ length: 20 }).map((_, j) => (
                      <div key={j} style={{ width: 2.5, height: 10, borderRadius: 1, background: svc.status === "degraded" && j >= 17 ? "#F59E0B" : "#22C55E", opacity: 0.6 }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}>{svc.uptime}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotifView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px 10px", flexShrink: 0 }}>
        <h1 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>Notification Log</h1>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Last incident · 6 deliveries · 5 succeeded</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, padding: "0 20px 12px", flexShrink: 0 }}>
        {[
          { ch: "Telegram", color: "#229ED9", sent: 847, icon: "TG" },
          { ch: "Slack",    color: "#4A154B", sent: 2,   icon: "SL" },
          { ch: "Email",    color: "#3B82F6", sent: 12,  icon: "@"  },
        ].map(s => (
          <div key={s.ch} style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "white" }}>{s.icon}</div>
              <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>{s.ch}</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-mono)" }}>{s.sent}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>delivered</p>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 12px" }}>
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", padding: "0 0 5px", marginBottom: 4 }}>
          {["Channel","Target","Event","Time","Status"].map(h => (
            <span key={h} style={{ flex: h === "Target" ? 2 : h === "Event" ? 2 : 1, fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
              {h}
            </span>
          ))}
        </div>
        {NOTIF_LOG.map((n, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: n.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: "white" }}>
                {n.ch[0]}
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{n.ch}</span>
            </div>
            <span style={{ flex: 2, fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>{n.target}</span>
            <span style={{ flex: 2, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{n.event}</span>
            <span style={{ flex: 1, fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>{n.time}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 9999, background: n.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: n.ok ? "#22C55E" : "#EF4444", border: `1px solid ${n.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                {n.ok ? "sent" : "failed"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { id: "monitoring",    label: "Monitors",     badge: 1    },
  { id: "incidents",     label: "Incidents",    badge: 2    },
  { id: "status-pages",  label: "Status Pages", badge: null },
  { id: "notifications", label: "Notif. Log",   badge: null },
]

export default function AppFrame({ activeFeature = "monitoring" }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(id)
  }, [])

  const VIEW_MAP = {
    monitoring:    <MonitoringView tick={tick} />,
    incidents:     <IncidentView />,
    "status-pages": <StatusPageView />,
    notifications: <NotifView />,
  }

  return (
    <div
      style={{
        display:      "flex",
        flexDirection:"column",
        height:       "100%",
        background:   "#080B10",
        borderRadius: 12,
        border:       "1px solid rgba(255,255,255,0.09)",
        overflow:     "hidden",
        boxShadow:    "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      <div style={{ height: 38, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "#0A0D12", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#FF5F57","#FEBC2E","#28C840"].map((c, i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ height: 20, padding: "0 10px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}>
            🔒 beacon.app/dashboard
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: 188, flexShrink: 0, background: "#0D1117", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Beacon</span>
            </div>
          </div>

          <nav style={{ padding: "6px 8px", flex: 1 }}>
            {NAV_ITEMS.map(item => {
              const isActive = item.id === activeFeature
              return (
                <motion.div
                  key={item.id}
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          7,
                    padding:      "5px 8px",
                    borderRadius: 6,
                    marginBottom: 1,
                    cursor:       "default",
                  }}
                  animate={{
                    background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                    color:      isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <span style={{ fontSize: 11, flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ fontSize: 9, background: "#EF4444", color: "white", borderRadius: 9999, padding: "0 4px", fontWeight: 600, minWidth: 14, textAlign: "center" }}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, borderRadius: 1, background: "#3B82F6" }}
                    />
                  )}
                </motion.div>
              )
            })}
          </nav>

          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
              AK
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>alex@acme.com</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Free plan</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1,  x:  0 }}
              exit={{    opacity: 0,  x: -10 }}
              transition={{ duration: 0.22 }}
              style={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              {VIEW_MAP[activeFeature]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}