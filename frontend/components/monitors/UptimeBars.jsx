"use client"

import { Skeleton } from "@/components/ui/LoadingSkeleton"

const STATUS_COLOR = {
  up:      "#22C55E",
  down:    "#EF4444",
  timeout: "#F59E0B",
  error:   "#EF4444",
  no_data: "rgba(255,255,255,0.08)",
}

function formatDate(dateStr) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  })
}

function UptimeBarsDisplay({ days, totalDays }) {
  const filled = [...days]
  while (filled.length < totalDays) {
    filled.unshift({ status: "no_data", date: null })
  }
  const sliced = filled.slice(-totalDays)

  const upCount   = sliced.filter(d => d.status === "up").length
  const dataCount = sliced.filter(d => d.status !== "no_data").length
  const uptimePct = dataCount > 0
    ? ((upCount / dataCount) * 100).toFixed(2)
    : null

  return (
    <div>
      <div
        className="flex gap-px items-end"
        role="img"
        aria-label={
          uptimePct
            ? `${uptimePct}% uptime over the last ${totalDays} days`
            : `No uptime data for the last ${totalDays} days`
        }
      >
        {sliced.map((day, idx) => (
          <div
            key={idx}
            className="flex-1 h-8 rounded-[1px] transition-opacity hover:opacity-70"
            style={{ backgroundColor: STATUS_COLOR[day.status] ?? STATUS_COLOR.no_data }}
            title={
              day.date
                ? `${formatDate(day.date)}: ${day.status}${
                    day.pct != null ? ` (${day.pct}%)` : ""
                  }`
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
          {uptimePct != null ? `${uptimePct}% uptime` : "No data"}
        </span>
        <span className="text-2xs text-beacon-text-faint">
          Today
        </span>
      </div>
    </div>
  )
}

function UptimeBarsLoading({ totalDays = 90 }) {
  return (
    <div>
      <div className="flex gap-px items-end">
        {Array.from({ length: totalDays }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-8 rounded-[1px] bg-white/[0.06] animate-pulse"
            style={{ animationDelay: `${(i % 10) * 50}ms` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-2.5 w-10" />
      </div>
    </div>
  )
}

export default function UptimeBars({
  days       = [],
  totalDays  = 90,
  monitorId  = null,
  loading    = false,
  className  = "",
}) {
  if (loading) {
    return (
      <div className={className}>
        <UptimeBarsLoading totalDays={totalDays} />
      </div>
    )
  }

  return (
    <div className={className}>
      <UptimeBarsDisplay days={days} totalDays={totalDays} />
    </div>
  )
}