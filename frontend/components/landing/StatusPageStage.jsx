"use client"

import { motion } from "framer-motion"

const SERVICES = [
  { name: "API",            status: "operational", uptime: 99.98, degradedBars: []        },
  { name: "Authentication", status: "operational", uptime: 100.0, degradedBars: []        },
  { name: "CDN",            status: "degraded",    uptime: 99.71, degradedBars: [25,26,27]},
  { name: "Database",       status: "operational", uptime: 99.95, degradedBars: [17]      },
  { name: "Email",          status: "operational", uptime: 99.99, degradedBars: []        },
]

const STATUS_COLORS = {
  operational: { dot: "#22C55E", badge: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", text: "#22C55E", label: "Operational" },
  degraded:    { dot: "#F59E0B", badge: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", text: "#F59E0B", label: "Degraded" },
}

export default function StatusPageStage() {
  const overall = SERVICES.some(s => s.status === "degraded") ? "degraded" : "operational"

  return (
    <section style={{ padding: "80px 0", background: "#08090C", position: "relative", overflow: "hidden" }}>
      <div
        style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(59,130,246,0.05), transparent)", pointerEvents: "none" }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-6">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 48, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "rgba(59,130,246,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              Public status pages
            </p>
            <h2 style={{ fontSize: 32, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em", marginBottom: 14, lineHeight: 1.2 }}>
              Your users deserve to know.
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.48)", lineHeight: 1.7, marginBottom: 20 }}>
              A branded status page at your own domain. Live service health, 90-day uptime history, and active incident banners -- visible the moment something changes.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Custom domain support",
                "90-day uptime bar history per service",
                "Active incident banners auto-displayed",
                "Telegram and email subscriber notifications",
                "Powered by Beacon badge (optional)",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 8 8" fill="none" stroke="#22C55E" strokeWidth="1.5" style={{ width: 6, height: 6 }}>
                      <path d="M1 4l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
              <div style={{ background: "#0D1117", padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#FF5F57","#FEBC2E","#28C840"].map((c, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                  ))}
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <div style={{ height: 18, padding: "0 10px", borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)", gap: 4 }}>
                    🔒 status.acme.com
                  </div>
                </div>
              </div>

              <div style={{ background: "#0A0D12" }}>
                {overall === "degraded" && (
                  <div style={{ background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.15)", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <p style={{ fontSize: 11, color: "#F59E0B", fontWeight: 500 }}>
                      CDN degraded · Incident in progress · View details
                    </p>
                  </div>
                )}

                <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Acme Corp</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <motion.span
                      style={{ width: 9, height: 9, borderRadius: "50%", background: overall === "degraded" ? "#F59E0B" : "#22C55E", display: "inline-block" }}
                      animate={{ opacity: [1, 0.5, 1], scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span style={{ fontSize: 16, fontWeight: 600, color: overall === "degraded" ? "#F59E0B" : "#22C55E" }}>
                      {overall === "degraded" ? "Partial Service Disruption" : "All Systems Operational"}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "12px 20px 16px" }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500, marginBottom: 10 }}>
                    Services
                  </p>
                  {SERVICES.map((svc, i) => {
                    const cfg = STATUS_COLORS[svc.status]
                    return (
                      <motion.div
                        key={svc.name}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <motion.span
                          style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }}
                          animate={svc.status !== "operational" ? { opacity: [1, 0.4, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500, flex: 1 }}>
                          {svc.name}
                        </span>
                        <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
                          {Array.from({ length: 24 }).map((_, j) => (
                            <div
                              key={j}
                              style={{
                                width:        2.5,
                                height:       svc.degradedBars.includes(j + 3) ? 10 : 14,
                                borderRadius: 1,
                                background:   svc.degradedBars.includes(j + 3) ? "#F59E0B" : "#22C55E",
                                opacity:      0.6,
                                flexShrink:   0,
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.35)", width: 40, textAlign: "right" }}>
                          {svc.uptime}%
                        </span>
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 9999, background: cfg.badge, color: cfg.text, border: `1px solid ${cfg.border}`, fontWeight: 500, flexShrink: 0 }}>
                          {cfg.label}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>

                <div style={{ padding: "10px 20px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Powered by Beacon</p>
                  <button style={{ fontSize: 10, color: "#3B82F6", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}