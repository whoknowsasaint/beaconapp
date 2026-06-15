"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { incidents as incidentsAPI } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"

const STEPS = [
  { value: "investigating", label: "Investigating" },
  { value: "identified",    label: "Identified"    },
  { value: "monitoring",    label: "Monitoring"    },
  { value: "resolved",      label: "Resolved"      },
]

const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.value, i]))

const COLORS = {
  investigating: { full: "#EF4444", faint: "rgba(239,68,68,0.125)" },
  identified:    { full: "#F59E0B", faint: "rgba(245,158,11,0.125)" },
  monitoring:    { full: "#3B82F6", faint: "rgba(59,130,246,0.125)" },
  resolved:      { full: "#22C55E", faint: "rgba(34,197,94,0.125)" },
}

export default function StatusStepper({ incident, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const currentIdx = STEP_INDEX[incident.status] ?? 0

  async function advance(step) {
    // Prevent clicking on current or past steps
    if (step.value === incident.status) return
    if (STEP_INDEX[step.value] <= currentIdx) return

    setLoading(true)
    try {
      const updated = await incidentsAPI.update(incident.id, {
        status: step.value,
      })
      toast(`Status updated to ${step.label}.`, "success")
      onUpdate(updated)
    } catch {
      toast("Failed to update status.", "error")
    } finally {
      setLoading(false)
    }
  }

  const activeColor = COLORS[incident.status] ?? COLORS.investigating

  return (
    <div className="flex items-center gap-0" aria-label="Incident status progress">
      {STEPS.map((step, idx) => {
        const isDone    = idx < currentIdx
        const isActive  = idx === currentIdx
        const isFuture  = idx > currentIdx
        const isNext    = idx === currentIdx + 1   // the only clickable step
        const isLast    = idx === STEPS.length - 1
        const stepColor = COLORS[step.value]

        // Only the immediate next step is clickable and not disabled
        const isClickable = isNext && !incident.is_resolved
        const disabled = loading || !isClickable || incident.is_resolved

        return (
          <div key={step.value} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => isClickable && advance(step)}
              disabled={disabled}
              className={[
                "flex flex-col items-center gap-1.5 group",
                (idx > currentIdx + 1) ? "opacity-40" : "",
                isClickable ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
              aria-current={isActive ? "step" : undefined}
              title={isClickable ? `Mark as ${step.label}` : step.label}
            >
              <motion.div
                className="h-7 w-7 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                animate={{
                  borderColor: isActive || isDone ? stepColor.full : "rgba(255,255,255,0.12)",
                  backgroundColor: isDone
                    ? stepColor.full
                    : isActive
                    ? stepColor.faint
                    : "transparent",
                }}
                transition={{ duration: 0.2 }}
              >
                {isDone ? (
                  <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" className="h-3 w-3">
                    <polyline points="2,6 5,9 10,3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <motion.div
                    className="h-2 w-2 rounded-full"
                    animate={{
                      backgroundColor: isActive ? stepColor.full : "rgba(255,255,255,0.2)",
                    }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.div>

              <span
                className={[
                  "text-2xs font-medium whitespace-nowrap",
                  isActive  ? "text-beacon-text"       : "",
                  isDone    ? "text-beacon-text-muted"  : "",
                  isFuture  ? "text-beacon-text-faint"  : "",
                ].join(" ")}
              >
                {step.label}
              </span>
            </button>

            {!isLast && (
              <motion.div
                className="h-px flex-1 mx-2 mb-5"
                animate={{
                  backgroundColor: isDone ? stepColor.full : "rgba(255,255,255,0.08)",
                }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}