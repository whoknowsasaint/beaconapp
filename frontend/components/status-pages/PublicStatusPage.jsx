import StatusBadge from "@/components/ui/StatusBadge"
import UptimeBars from "@/components/monitors/UptimeBars"

const OVERALL_CONFIG = {
  operational: {
    label: "All systems operational",
    dot:   "bg-beacon-green animate-pulse-soft",
    color: "text-beacon-green",
  },
  degraded: {
    label: "Partial degradation",
    dot:   "bg-beacon-amber animate-pulse-soft",
    color: "text-beacon-amber",
  },
  outage: {
    label: "Service disruption",
    dot:   "bg-beacon-red animate-pulse-soft",
    color: "text-beacon-red",
  },
}

function formatDate(str) {
  if (!str) return ""
  return new Date(str).toLocaleString("en-US", {
    month:  "long",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function IncidentCard({ incident }) {
  return (
    <div className="border border-beacon-border rounded-xl p-5 mb-4"
      style={{ background: "var(--color-bg-elevated)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-beacon-text mb-0.5">
            {incident.title}
          </h3>
          <p className="text-xs text-beacon-text-faint">
            Started {formatDate(incident.started_at)}
          </p>
        </div>
        <StatusBadge status={incident.status} />
      </div>

      {incident.summary && (
        <p className="text-sm text-beacon-text-muted mb-3 leading-relaxed">
          {incident.summary}
        </p>
      )}

      {incident.updates?.length > 0 && (
        <div className="border-t border-beacon-border pt-3 mt-3 flex flex-col gap-3">
          {incident.updates.slice(0, 3).map(u => (
            <div key={u.id}>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={u.status_at_update} />
                <span className="text-xs text-beacon-text-faint">
                  {formatDate(u.created_at)}
                </span>
              </div>
              <p className="text-xs text-beacon-text-muted leading-relaxed">
                {u.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ServiceRow({ monitor }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-beacon-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-beacon-text mb-1">
          {monitor.name}
        </p>
        {monitor.show_uptime_history && (
          <UptimeBars days={[]} totalDays={90} className="max-w-md" />
        )}
      </div>
      <div className="flex-shrink-0 ml-4">
        <StatusBadge status={monitor.status} />
      </div>
    </div>
  )
}

export default function PublicStatusPage({ page }) {
  const overall = OVERALL_CONFIG[page.overall_status] ?? OVERALL_CONFIG.operational
  const brandHex = `#${page.brand_color ?? "3B82F6"}`

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="border-b border-beacon-border"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: brandHex }}
            >
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <h1 className="text-base font-semibold text-beacon-text">
              {page.name}
            </h1>
          </div>

          {page.description && (
            <p className="text-sm text-beacon-text-muted mb-5">
              {page.description}
            </p>
          )}

          <div className="flex items-center gap-2.5">
            <span
              className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${overall.dot}`}
              aria-hidden="true"
            />
            <span className={`text-lg font-semibold ${overall.color}`}>
              {overall.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-8">
        {page.active_incidents?.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-4">
              Active incidents
            </h2>
            {page.active_incidents.map(incident => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </section>
        )}

        {page.monitors?.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-2">
              Services
            </h2>
            <div
              className="rounded-xl border border-beacon-border px-5"
              style={{ background: "var(--color-bg-elevated)" }}
            >
              {page.monitors.map(monitor => (
                <ServiceRow key={monitor.id} monitor={monitor} />
              ))}
            </div>
          </section>
        )}

        {page.monitors?.length === 0 && page.active_incidents?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-beacon-text-muted">
              No services configured yet.
            </p>
          </div>
        )}

        {page.allow_subscriptions && (
          <section>
            <div
              className="rounded-xl border border-beacon-border px-5 py-4 flex items-center justify-between"
              style={{ background: "var(--color-bg-elevated)" }}
            >
              <div>
                <p className="text-sm font-medium text-beacon-text mb-0.5">
                  Stay informed
                </p>
                <p className="text-xs text-beacon-text-muted">
                  Get notified when incidents are created or resolved.
                </p>
              </div>
              <a
                href={`/status/${page.slug}/subscribe`}
                className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-lg border border-beacon-border text-beacon-text hover:bg-white/[0.06] transition-colors"
              >
                Subscribe
              </a>
            </div>
          </section>
        )}

        {page.show_beacon_branding && (
          <div className="text-center">
            <p className="text-xs text-beacon-text-faint">
              Powered by{" "}
              <a
                href="https://github.com/beacon"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-beacon-text-muted transition-colors"
              >
                Beacon
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}