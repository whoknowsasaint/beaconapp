"use client"

const STATUS_CLASS = {
  up:      "uptime-bar-healthy",
  down:    "uptime-bar-outage",
  timeout: "uptime-bar-degraded",
  error:   "uptime-bar-outage",
  no_data: "uptime-bar-unknown",
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  })
}

export default function UptimeBars({ days = [], totalDays = 90, className = "" }) {
  const filled = [...days]
  while (filled.length < totalDays) {
    filled.unshift({ status: "no_data", date: null })
  }

  const sliced = filled.slice(-totalDays)

  const upCount    = sliced.filter(d => d.status === "up").length
  const uptimePct  = totalDays > 0
    ? ((upCount / totalDays) * 100).toFixed(2)
    : "100.00"

  return (
    <div className={className}>
      <div
        className="flex gap-px items-end"
        role="img"
        aria-label={`${uptimePct}% uptime over the last ${totalDays} days`}
      >
        {sliced.map((day, idx) => (
          <div
            key={idx}
            className={[
              "flex-1 h-8 rounded-[1px] transition-opacity hover:opacity-70",
              STATUS_CLASS[day.status] ?? "uptime-bar-unknown",
            ].join(" ")}
            title={
              day.date
                ? `${formatDate(day.date)}: ${day.status}`
                : "No data"
            }
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-2xs text-beacon-text-faint">
          {totalDays} days ago
        </span>
        <span className="text-2xs font-mono text-beacon-text-muted">
          {uptimePct}% uptime
        </span>
        <span className="text-2xs text-beacon-text-faint">
          Today
        </span>
      </div>
    </div>
  )
}