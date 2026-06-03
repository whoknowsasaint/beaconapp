"use client"

import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/LoadingSkeleton"

export default function StatCard({
  label,
  value,
  hint,
  color     = "default",
  loading   = false,
  className = "",
}) {
  const colorMap = {
    default: {
      dot:   "bg-beacon-text-faint",
      value: "text-beacon-text",
    },
    green: {
      dot:   "bg-beacon-green",
      value: "text-beacon-green",
    },
    red: {
      dot:   "bg-beacon-red",
      value: "text-beacon-red",
    },
    amber: {
      dot:   "bg-beacon-amber",
      value: "text-beacon-amber",
    },
    blue: {
      dot:   "bg-beacon-blue",
      value: "text-beacon-text",
    },
  }

  const colors = colorMap[color] ?? colorMap.default

  return (
    <div
      className={[
        "rounded-xl border border-beacon-border px-5 py-5",
        className,
      ].join(" ")}
      style={{ background: "var(--color-bg-elevated)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${colors.dot}`}
          aria-hidden="true"
        />
        <p className="text-xs text-beacon-text-muted">{label}</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      ) : (
        <>
          <motion.p
            key={String(value)}
            initial={{ opacity: 0.4, y: 4 }}
            animate={{ opacity: 1,   y: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-3xl font-semibold tracking-tight mb-1 ${colors.value}`}
          >
            {value ?? "--"}
          </motion.p>

          {hint && (
            <p className="text-xs text-beacon-text-faint">{hint}</p>
          )}
        </>
      )}
    </div>
  )
}