"use client"

import { useState, useEffect } from "react"
import { monitors as monitorsAPI } from "@/lib/api/index.js"
import { statusPages as statusPagesAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/ui/StatusBadge"

export default function MonitorPicker({ page, linkedMonitors, onUpdate }) {
  const [allMonitors, setAllMonitors] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [removing,    setRemoving]    = useState(null)

  const linkedIds = new Set(linkedMonitors.map(m => m.monitor.id))

  useEffect(() => {
    monitorsAPI.list({ page_size: 100 }).then(res => {
      setAllMonitors(res.results ?? [])
    }).catch(() => {})
  }, [])

  const available = allMonitors.filter(m => !linkedIds.has(m.id))

  async function handleAdd(monitor) {
    setLoading(true)
    try {
      await statusPagesAPI.addMonitor(page.slug, {
        monitor:       monitor.id,
        display_order: linkedMonitors.length,
      })
      toast(`${monitor.name} added.`, "success")
      onUpdate()
    } catch (err) {
      toast(
        isBeaconAPIError(err) ? err.message : "Failed to add monitor.",
        "error",
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(entry) {
    setRemoving(entry.id)
    try {
      await statusPagesAPI.removeMonitor(page.slug, entry.id)
      toast(`${entry.monitor.name} removed.`, "success")
      onUpdate()
    } catch (err) {
      toast(
        isBeaconAPIError(err) ? err.message : "Failed to remove monitor.",
        "error",
      )
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {linkedMonitors.length > 0 && (
        <div>
          <p className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-3">
            On this page
          </p>
          <div className="flex flex-col divide-y divide-beacon-border border border-beacon-border rounded-xl overflow-hidden">
            {linkedMonitors.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: "var(--color-bg-elevated)" }}
              >
                <StatusBadge status={entry.monitor.status} />
                <span className="text-sm text-beacon-text flex-1">
                  {entry.public_name}
                </span>
                <span className="text-xs text-beacon-text-faint">
                  {entry.monitor.monitor_type_display}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={removing === entry.id}
                  onClick={() => handleRemove(entry)}
                  className="text-beacon-red hover:text-beacon-red hover:bg-beacon-red/10"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <p className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-3">
            Add monitor
          </p>
          <div className="flex flex-col divide-y divide-beacon-border border border-beacon-border rounded-xl overflow-hidden">
            {available.map(monitor => (
              <div
                key={monitor.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: "var(--color-bg-elevated)" }}
              >
                <StatusBadge status={monitor.status} />
                <span className="text-sm text-beacon-text flex-1">
                  {monitor.name}
                </span>
                <span className="text-xs text-beacon-text-faint">
                  {monitor.monitor_type_display}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={loading}
                  onClick={() => handleAdd(monitor)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {allMonitors.length === 0 && (
        <p className="text-sm text-beacon-text-muted text-center py-6">
          No monitors available. Create a monitor first.
        </p>
      )}

      {allMonitors.length > 0 && available.length === 0 && linkedMonitors.length > 0 && (
        <p className="text-sm text-beacon-text-muted text-center py-4">
          All your monitors are on this page.
        </p>
      )}
    </div>
  )
}