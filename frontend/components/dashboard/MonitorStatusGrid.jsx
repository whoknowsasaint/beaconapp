"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import StatusBadge from "@/components/ui/StatusBadge"
import { Skeleton } from "@/components/ui/LoadingSkeleton"

const STATUS_ORDER = [
  "outage",
  "degraded",
  "pending",
  "operational",
  "paused",
]

function sortMonitors(monitors) {
  return [...monitors].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status)
    const bi = STATUS_ORDER.indexOf(b.status)
    const av = ai === -1 ? 99 : ai
    const bv = bi === -1 ? 99 : bi
    if (av !== bv) return av - bv
    return a.name.localeCompare(b.name)
  })
}

function MonitorCell({ monitor, onClick }) {
  const isHealthy  = monitor.status === "operational"
  const isUnhealthy = monitor.status === "outage"

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={[
        "flex flex-col gap-1.5 p-3 rounded-lg border text-left transition-colors",
        isUnhealthy
          ? "border-beacon-red/30 bg-beacon-red/5 hover:bg-beacon-red/10"
          : "border-beacon-border hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-medium text-beacon-text truncate flex-1">
          {monitor.name}
        </p>
        <span
          className={[
            "h-1.5 w-1.5 rounded-full flex-shrink-0 mt-0.5",
            isUnhealthy ? "bg-beacon-red animate-pulse-soft" :
            monitor.status === "degraded" ? "bg-beacon-amber animate-pulse-soft" :
            isHealthy ? "bg-beacon-green" :
            "bg-beacon-text-faint",
          ].join(" ")}
          aria-hidden="true"
        />
      </div>
      <StatusBadge status={monitor.status} />
    </motion.button>
  )
}

function LoadingGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-beacon-border p-3 flex flex-col gap-1.5"
          style={{ background: "var(--color-bg-elevated)" }}
        >
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

export default function MonitorStatusGrid({ monitors, loading }) {
  const router = useRouter()

  if (loading) return <LoadingGrid />

  if (monitors.length === 0) {
    return (
      <div
        className="rounded-xl border border-beacon-border px-4 py-10 text-center"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <p className="text-sm text-beacon-text-muted">No monitors yet.</p>
        <button
          onClick={() => router.push("/dashboard/monitors")}
          className="text-xs text-beacon-blue hover:underline mt-1 block mx-auto"
        >
          Add your first monitor
        </button>
      </div>
    )
  }

  const sorted = sortMonitors(monitors)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {sorted.map(monitor => (
        <MonitorCell
          key={monitor.id}
          monitor={monitor}
          onClick={() => router.push(`/dashboard/monitors/${monitor.id}`)}
        />
      ))}
    </div>
  )
}