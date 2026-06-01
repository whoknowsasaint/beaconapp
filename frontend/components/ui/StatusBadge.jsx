const CONFIG = {
  operational: {
    label: "Operational",
    dot:   "bg-beacon-green",
    class: "status-badge--operational",
  },
  degraded: {
    label: "Degraded",
    dot:   "bg-beacon-amber",
    class: "status-badge--degraded",
  },
  outage: {
    label: "Outage",
    dot:   "bg-beacon-red animate-pulse-soft",
    class: "status-badge--outage",
  },
  maintenance: {
    label: "Maintenance",
    dot:   "bg-beacon-blue",
    class: "status-badge--maintenance",
  },
  paused: {
    label: "Paused",
    dot:   "bg-beacon-text-faint",
    class: "status-badge",
    extra: "text-beacon-text-faint border-beacon-border",
  },
  pending: {
    label: "Pending",
    dot:   "bg-beacon-text-faint",
    class: "status-badge",
    extra: "text-beacon-text-faint border-beacon-border",
  },
  resolved: {
    label: "Resolved",
    dot:   "bg-beacon-green",
    class: "status-badge--operational",
  },
  investigating: {
    label: "Investigating",
    dot:   "bg-beacon-red animate-pulse-soft",
    class: "status-badge--outage",
  },
  identified: {
    label: "Identified",
    dot:   "bg-beacon-amber",
    class: "status-badge--degraded",
  },
  monitoring: {
    label: "Monitoring",
    dot:   "bg-beacon-blue",
    class: "status-badge--maintenance",
  },
}

export default function StatusBadge({ status, className = "" }) {
  const cfg = CONFIG[status] ?? {
    label: status ?? "Unknown",
    dot:   "bg-beacon-text-faint",
    class: "status-badge",
    extra: "text-beacon-text-faint border-beacon-border",
  }

  return (
    <span
      className={[
        "status-badge",
        cfg.class,
        cfg.extra ?? "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.dot}`}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  )
}