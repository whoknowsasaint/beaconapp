"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import StatusBadge from "@/components/ui/StatusBadge"
import { Skeleton } from "@/components/ui/LoadingSkeleton"

function formatRelative(str) {
  if (!str) return ""
  const diff = Date.now() - new Date(str).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days  > 0)  return `${days}d ago`
  if (hours > 0)  return `${hours}h ago`
  if (mins  > 0)  return `${mins}m ago`
  return "Just now"
}

const SEVERITY_DOT = {
  critical: "bg-beacon-red",
  major:    "bg-beacon-amber",
  minor:    "bg-beacon-blue",
  notice:   "bg-beacon-text-faint",
}

function IncidentRow({ incident, onClick }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1,  x:  0 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3 border-b border-beacon-border last:border-0 hover:bg-white/[0.02] transition-colors text-left"
    >
      <span
        className={[
          "h-2 w-2 rounded-full flex-shrink-0 mt-1.5",
          SEVERITY_DOT[incident.severity] ?? "bg-beacon-text-faint",
        ].join(" ")}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-beacon-text truncate mb-0.5">
          {incident.title}
        </p>
        <div className="flex items-center gap-2">
          <StatusBadge status={incident.status} />
          <span className="text-xs text-beacon-text-faint">
            {formatRelative(incident.started_at)}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

function LoadingRows({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-4 py-3 border-b border-beacon-border last:border-0"
        >
          <Skeleton className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </>
  )
}

export default function RecentIncidents({ incidents, loading }) {
  const router = useRouter()

  return (
    <div
      className="rounded-xl border border-beacon-border overflow-hidden"
      style={{ background: "var(--color-bg-elevated)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-beacon-border">
        <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider">
          Recent incidents
        </h2>
        <button
          onClick={() => router.push("/dashboard/incidents")}
          className="text-xs text-beacon-text-muted hover:text-beacon-text transition-colors"
        >
          View all
        </button>
      </div>

      {loading ? (
        <LoadingRows count={4} />
      ) : incidents.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-beacon-text-muted">
            No incidents yet.
          </p>
          <p className="text-xs text-beacon-text-faint mt-1">
            Incidents appear here when created or auto-detected.
          </p>
        </div>
      ) : (
        incidents.map(incident => (
          <IncidentRow
            key={incident.id}
            incident={incident}
            onClick={() => router.push(`/dashboard/incidents/${incident.id}`)}
          />
        ))
      )}
    </div>
  )
}