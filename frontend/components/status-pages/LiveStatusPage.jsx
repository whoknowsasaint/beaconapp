"use client"

import { useState, useEffect, useMemo } from "react"
import StatusBadge from "@/components/ui/StatusBadge"
import UptimeBars from "@/components/monitors/UptimeBars"
import { useBreakpoint } from "@/lib/useBreakpoint"

const OVERALL_CONFIG = {
  operational: {
    label: "All Systems Operational",
    color: "#22C55E",
    bg:    "rgba(34,197,94,0.08)",
    border:"rgba(34,197,94,0.22)",
  },
  degraded: {
    label: "Partial Degradation",
    color: "#F59E0B",
    bg:    "rgba(245,158,11,0.08)",
    border:"rgba(245,158,11,0.22)",
  },
  outage: {
    label: "Service Disruption",
    color: "#EF4444",
    bg:    "rgba(239,68,68,0.08)",
    border:"rgba(239,68,68,0.22)",
  },
}

function formatDate(str) {
  if (!str) return ""
  return new Date(str).toLocaleString("en-US", {
    month: "long",
    day:   "numeric",
    hour:  "2-digit",
    minute:"2-digit",
    timeZoneName: "short",
  })
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function BeaconMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1D4ED8"/>
      <circle cx="10" cy="18" r="2.2" fill="white"/>
      <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
      <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25"/>
    </svg>
  )
}

function IncidentCard({ incident }) {
  return (
    <div
      style={{
        border:       "1px solid rgba(255,255,255,0.09)",
        borderLeft:   "3px solid #EF4444",
        borderRadius: 16,
        padding:      "18px 20px",
        marginBottom: 12,
        background:   "rgba(239,68,68,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.92)", marginBottom: 3 }}>
            {incident.title}
          </h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            Started {formatDate(incident.started_at)}
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <StatusBadge status={incident.status} />
        </div>
      </div>

      {incident.summary && (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 10 }}>
          {incident.summary}
        </p>
      )}

      {incident.updates?.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, marginTop: 12, display: "flex", flexDirection: "column", gap: 11 }}>
          {incident.updates.slice(0, 3).map(u => (
            <div key={u.id} style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.25)", marginTop: 5, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <StatusBadge status={u.status_at_update} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>
                    {formatDate(u.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                  {u.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ServiceCard({ monitor, mobile }) {
  return (
    <div
      style={{
        background:   "rgba(255,255,255,0.03)",
        border:       "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding:      mobile ? "16px 16px" : "18px 20px",
        transition:   "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <p style={{ fontSize: mobile ? 14 : 15, fontWeight: 600, color: "rgba(255,255,255,0.9)", minWidth: 0 }}>
          {monitor.name}
        </p>
        <StatusBadge status={monitor.status} />
      </div>
      {monitor.show_uptime_history && monitor.uptime_buckets && monitor.uptime_buckets.length > 0 ? (
        <div>
          <UptimeBars days={monitor.uptime_buckets} totalDays={90} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
              {computeUptimePercentage(monitor.uptime_buckets)}% uptime
            </span>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          No uptime history available yet.
        </p>
      )}
    </div>
  )
}

function computeUptimePercentage(buckets) {
  if (!buckets || buckets.length === 0) return "—"
  const withData = buckets.filter(b => b.status !== "no_data")
  if (withData.length === 0) return "—"
  const up = withData.filter(b => b.status === "up").length
  return ((up / withData.length) * 100).toFixed(2)
}

function combineUptimeBuckets(monitors) {
  if (!monitors || monitors.length === 0) return []
  const allDays = {}
  monitors.forEach(m => {
    if (!m.uptime_buckets || m.uptime_buckets.length === 0) return
    m.uptime_buckets.forEach(b => {
      const date = b.date
      if (!date) return
      if (!allDays[date]) allDays[date] = { date, up: 0, down: 0, degraded: 0, total: 0 }
      allDays[date].total += 1
      if (b.status === "up") allDays[date].up += 1
      else if (b.status === "down") allDays[date].down += 1
      else if (b.status === "degraded") allDays[date].degraded += 1
    })
  })
  const days = Object.values(allDays).sort((a, b) => new Date(a.date) - new Date(b.date))
  return days.map(day => {
    let status = "up"
    if (day.down > 0) status = "down"
    else if (day.degraded > 0) status = "degraded"
    else if (day.total === 0) status = "no_data"
    return { date: day.date, status, up: day.up, total: day.total }
  })
}

export default function LiveStatusPage({ initialPage, slug }) {
  const { isMobile, mounted } = useBreakpoint()
  const mobile = mounted && isMobile

  if (!initialPage) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
        Loading status page...
      </div>
    )
  }

  const page = initialPage
  const overallStatus = page.overall_status || "operational"
  const overallCfg = OVERALL_CONFIG[overallStatus] ?? OVERALL_CONFIG.operational
  const brandHex = `#${page.brand_color ?? "3B82F6"}`
  const hasIncidents = page.active_incidents?.length > 0
  const hasMonitors = page.monitors?.length > 0

  const [updated, setUpdated] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setUpdated(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const combinedBuckets = useMemo(() => combineUptimeBuckets(page.monitors || []), [page.monitors])
  const overallUptimePct = combinedBuckets.length > 0 ? computeUptimePercentage(combinedBuckets) : null

  return (
    <div style={{ minHeight: "100vh", background: "#050816", display: "flex", flexDirection: "column" }}>

      {/* Hero */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: mobile ? "44px 16px 32px" : "60px 20px 40px",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          maxWidth: 600,
          height: 300,
          background: `radial-gradient(ellipse at center, ${brandHex}22, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", textAlign: "center", maxWidth: 720, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
            <svg width={mobile ? 30 : 36} height={mobile ? 30 : 36} viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
              <rect width="28" height="28" rx="7" fill={brandHex} />
              <circle cx="10" cy="18" r="2.2" fill="white" />
              <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9" />
              <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55" />
              <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25" />
            </svg>
            <h1 style={{ fontSize: mobile ? 18 : 20, fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}>
              {page.name}
            </h1>
          </div>

          {page.description && (
            <p style={{ fontSize: mobile ? 13 : 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 22, padding: mobile ? "0 8px" : 0 }}>
              {page.description}
            </p>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{
              display: "inline-block",
              padding: mobile ? "6px 14px" : "6px 18px",
              borderRadius: 30,
              fontSize: mobile ? 13 : 14,
              fontWeight: 600,
              color: overallCfg.color,
              background: overallCfg.bg,
              border: `1px solid ${overallCfg.border}`,
            }}>
              {overallCfg.label}
            </div>
          </div>

          <div style={{
            display:        "flex",
            justifyContent: "center",
            gap:            mobile ? 18 : 28,
            flexWrap:       "wrap",
            marginBottom:   8,
          }}>
            {overallUptimePct !== null ? (
              <div>
                <p style={{ fontSize: mobile ? 21 : 26, fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
                  {overallUptimePct}%
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Uptime</p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: mobile ? 21 : 26, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
                  —
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Uptime</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: mobile ? 21 : 26, fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
                {page.active_incidents?.length || 0}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Active Incidents</p>
            </div>
            <div>
              <p style={{ fontSize: mobile ? 21 : 26, fontWeight: 700, color: "rgba(255,255,255,0.92)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}>
                {page.monitors?.length || 0}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Monitored Services</p>
            </div>
          </div>

          <p
            style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-jetbrains-mono,monospace)", marginTop: 6 }}
            suppressHydrationWarning={true}
          >
            Updated {formatTime(updated)}
          </p>
        </div>
      </div>

      {/* Global uptime */}
      {combinedBuckets.length > 0 && (
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: mobile ? "0 16px" : "0 20px" }}>
          <div style={{
            background:   "rgba(255,255,255,0.02)",
            borderRadius: 16,
            border:       "1px solid rgba(255,255,255,0.06)",
            padding:      mobile ? "14px 14px" : "16px 18px",
            overflowX:    "hidden",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Last 90 Days
            </p>
            <UptimeBars days={combinedBuckets} totalDays={90} />
          </div>
        </div>
      )}

      {/* Services */}
      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: mobile ? "28px 16px 0" : "32px 20px 0" }}>
        {hasMonitors ? (
          <>
            <h2 style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
              Services
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {page.monitors.map(monitor => (
                <ServiceCard key={monitor.id} monitor={monitor} mobile={mobile} />
              ))}
            </div>
          </>
        ) : (
          <div style={{
            textAlign: "center",
            padding: mobile ? "40px 18px" : "48px 24px",
            borderRadius: 16,
            border: "1px dashed rgba(255,255,255,0.1)",
          }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              No services configured yet.
            </p>
          </div>
        )}
      </div>

      {/* Incident history */}
      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: mobile ? "28px 16px" : "32px 20px" }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
          Recent History
        </h2>
        {hasIncidents ? (
          <div>
            {page.active_incidents.map(incident => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        ) : (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: mobile ? "14px 16px" : "16px 20px",
            borderRadius: 16,
            background: "rgba(34,197,94,0.05)",
            border: "1px solid rgba(34,197,94,0.15)",
          }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}>
              <path d="M5 10l3.5 3.5L15 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              No incidents reported in the last 90 days.
            </p>
          </div>
        )}
      </div>

      {/*
        Subscribe CTA — disabled for now per request.
        Re-enable by removing this comment block and the closing comment below
        once email/Telegram subscription flow is ready to ship.

      {page.allow_subscriptions && (
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: mobile ? "0 16px 28px" : "0 20px 32px" }}>
          <div style={{
            borderRadius: 16,
            border:       "1px solid rgba(255,255,255,0.08)",
            background:   "rgba(255,255,255,0.02)",
            padding:      mobile ? "16px 16px" : "18px 20px",
            display:      "flex",
            alignItems:   mobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap:          16,
            flexWrap:     "wrap",
            flexDirection: mobile ? "column" : "row",
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 2 }}>
                Stay informed
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Get notified when incidents are created or resolved.
              </p>
            </div>
            
              href={`/status/${slug}/subscribe`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 40,
                padding: "0 20px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 10,
                background: brandHex,
                color: "white",
                textDecoration: "none",
                boxShadow: `0 4px 14px ${brandHex}40`,
                flexShrink: 0,
                width: mobile ? "100%" : "auto",
              }}
            >
              Subscribe
            </a>
          </div>
        </div>
      )}

      */}

      {/* Footer */}
      {page.show_beacon_branding && (
        <div style={{
          marginTop: "auto",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: mobile ? "20px 16px 28px" : "24px 20px 32px",
          display: "flex",
          alignItems: mobile ? "flex-start" : "center",
          justifyContent: "space-between",
          flexDirection: mobile ? "column" : "row",
          gap: 10,
          maxWidth: 720,
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
        }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "rgba(255,255,255,0.32)",
              textDecoration: "none",
            }}
          >
            <BeaconMark size={14} />
            Powered by Beacon
          </a>
          <span
            style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-jetbrains-mono,monospace)" }}
            suppressHydrationWarning={true}
          >
            Last updated {formatTime(updated)}
          </span>
        </div>
      )}
    </div>
  )
}