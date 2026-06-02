"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { monitors as monitorsAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/ui/StatusBadge"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import MonitorForm from "@/components/monitors/MonitorForm"
import UptimeBars from "@/components/monitors/UptimeBars"
import CheckHistoryTable from "@/components/monitors/CheckHistoryTable"
import { CardSkeleton } from "@/components/ui/LoadingSkeleton"

function MetaRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-beacon-border last:border-0">
      <span className="text-sm text-beacon-text-muted">{label}</span>
      <span className="text-sm text-beacon-text font-mono text-right max-w-xs truncate">
        {value ?? "--"}
      </span>
    </div>
  )
}

export default function MonitorDetailPage() {
  const router        = useRouter()
  const { id }        = useParams()

  const [monitor,      setMonitor]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [editOpen,     setEditOpen]     = useState(false)
  const [deleteOpen,   setDeleteOpen]   = useState(false)
  const [notFound,     setNotFound]     = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await monitorsAPI.get(id)
        setMonitor(data)
      } catch (err) {
        if (isBeaconAPIError(err) && err.isNotFound) {
          setNotFound(true)
        } else {
          toast("Failed to load monitor.", "error")
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleDelete() {
    await monitorsAPI.delete(id)
    toast("Monitor deleted.", "success")
    router.push("/dashboard/monitors")
  }

  async function handleToggleActive() {
    try {
      const updated = await monitorsAPI.update(id, {
        is_active: !monitor.is_active,
      })
      setMonitor(updated)
      toast(
        updated.is_active ? "Monitor resumed." : "Monitor paused.",
        "success",
      )
    } catch {
      toast("Failed to update monitor.", "error")
    }
  }

  if (loading) {
    return (
      <div className="flex-1 px-8 py-8">
        <div className="h-8 w-48 rounded-lg bg-white/[0.06] animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton className="lg:col-span-1" />
          <CardSkeleton className="lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex-1 px-8 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-beacon-text-muted text-sm mb-4">
            Monitor not found.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/dashboard/monitors")}
          >
            Back to monitors
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title={monitor.name}
        description={
          <span className="flex items-center gap-2">
            <StatusBadge status={monitor.status} />
            <span className="text-beacon-text-faint text-xs">
              {monitor.monitor_type_display}
            </span>
          </span>
        }
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleActive}
            >
              {monitor.is_active ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          className="rounded-xl border border-beacon-border p-5 lg:col-span-1"
          style={{ background: "var(--color-bg-elevated)" }}
        >
          <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-4">
            Configuration
          </h2>
          <MetaRow label="Type"     value={monitor.monitor_type_display} />
          {monitor.url  && <MetaRow label="URL"      value={monitor.url} />}
          {monitor.host && <MetaRow label="Host"     value={monitor.host} />}
          {monitor.port && <MetaRow label="Port"     value={monitor.port} />}
          <MetaRow label="Interval" value={`${monitor.interval}s`} />
          <MetaRow label="Timeout"  value={`${monitor.timeout}s`} />
          {monitor.monitor_type === "http" && (
            <MetaRow
              label="Expected codes"
              value={monitor.expected_status_codes}
            />
          )}
          <MetaRow label="Active" value={monitor.is_active ? "Yes" : "No"} />
          <MetaRow
            label="Last checked"
            value={
              monitor.last_checked_at
                ? new Date(monitor.last_checked_at).toLocaleString()
                : "Never"
            }
          />
        </div>

        <div
          className="rounded-xl border border-beacon-border p-5 lg:col-span-2"
          style={{ background: "var(--color-bg-elevated)" }}
        >
          <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-4">
            90-day uptime
          </h2>
          <UptimeBars days={[]} totalDays={90} />
        </div>
      </div>

      <div
        className="rounded-xl border border-beacon-border p-5"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-4">
          Check history
        </h2>
        <CheckHistoryTable monitorId={id} />
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit monitor"
        size="md"
      >
        <MonitorForm
          existing={monitor}
          onSuccess={updated => {
            setMonitor(updated)
            setEditOpen(false)
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete monitor"
        description={`Delete "${monitor.name}"? All check history will be permanently removed.`}
        confirmLabel="Delete monitor"
        variant="danger"
      />
    </div>
  )
}