"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { incidents as incidentsAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import StatusBadge from "@/components/ui/StatusBadge"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import IncidentForm from "@/components/incidents/IncidentForm"
import StatusStepper from "@/components/incidents/StatusStepper"
import UpdateFeed from "@/components/incidents/UpdateFeed"
import { CardSkeleton } from "@/components/ui/LoadingSkeleton"

function formatDate(str) {
  if (!str) return "--"
  return new Date(str).toLocaleString("en-US", {
    month:  "long",
    day:    "numeric",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(seconds) {
  if (seconds == null) return "--"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

const SEVERITY_COLORS = {
  critical: "text-beacon-red bg-beacon-red/10 border-beacon-red/20",
  major:    "text-beacon-amber bg-beacon-amber/10 border-beacon-amber/20",
  minor:    "text-beacon-blue bg-beacon-blue/10 border-beacon-blue/20",
  notice:   "text-beacon-text-muted bg-white/[0.04] border-beacon-border",
}

export default function IncidentDetailPage() {
  const router      = useRouter()
  const { id }      = useParams()

  const [incident,   setIncident]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [notFound,   setNotFound]   = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await incidentsAPI.get(id)
        setIncident(data)
      } catch (err) {
        if (isBeaconAPIError(err) && err.isNotFound) {
          setNotFound(true)
        } else {
          toast("Failed to load incident.", "error")
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleDelete() {
    await incidentsAPI.delete(id)
    toast("Incident deleted.", "success")
    router.push("/dashboard/incidents")
  }

  if (loading) {
    return (
      <div className="flex-1 px-8 py-8">
        <div className="h-8 w-64 rounded-lg bg-white/[0.06] animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton className="lg:col-span-2" />
          <CardSkeleton className="lg:col-span-1" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex-1 px-8 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-beacon-text-muted text-sm mb-4">Incident not found.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/dashboard/incidents")}
          >
            Back to incidents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title={incident.title}
        description={
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span
              className={[
                "text-xs font-medium capitalize px-2 py-0.5 rounded border",
                SEVERITY_COLORS[incident.severity] ?? "",
              ].join(" ")}
            >
              {incident.severity}
            </span>
            {incident.auto_created && (
              <span className="text-xs text-beacon-text-faint">
                Auto-detected
              </span>
            )}
          </div>
        }
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
              disabled={incident.is_resolved}
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

      <div
        className="rounded-xl border border-beacon-border p-5 mb-6"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-5">
          Status
        </h2>
        <StatusStepper
          incident={incident}
          onUpdate={setIncident}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {incident.summary && (
            <div
              className="rounded-xl border border-beacon-border p-5"
              style={{ background: "var(--color-bg-elevated)" }}
            >
              <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-3">
                Summary
              </h2>
              <p className="text-sm text-beacon-text-muted leading-relaxed">
                {incident.summary}
              </p>
            </div>
          )}

          <div
            className="rounded-xl border border-beacon-border p-5"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-5">
              Updates
            </h2>
            <UpdateFeed
              incident={incident}
              onIncidentChange={setIncident}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl border border-beacon-border p-5"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-4">
              Timeline
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-2xs text-beacon-text-faint uppercase tracking-wider">Started</p>
                <p className="text-xs text-beacon-text mt-0.5">{formatDate(incident.started_at)}</p>
              </div>
              {incident.resolved_at && (
                <div>
                  <p className="text-2xs text-beacon-text-faint uppercase tracking-wider">Resolved</p>
                  <p className="text-xs text-beacon-text mt-0.5">{formatDate(incident.resolved_at)}</p>
                </div>
              )}
              <div>
                <p className="text-2xs text-beacon-text-faint uppercase tracking-wider">Duration</p>
                <p className="text-xs text-beacon-text mt-0.5 font-mono">{formatDuration(incident.duration_seconds)}</p>
              </div>
            </div>
          </div>

          {incident.affected_monitors?.length > 0 && (
            <div
              className="rounded-xl border border-beacon-border p-5"
              style={{ background: "var(--color-bg-elevated)" }}
            >
              <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-4">
                Affected monitors
              </h2>
              <div className="flex flex-col gap-2">
                {incident.affected_monitors.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <span className="text-sm text-beacon-text">
                      {entry.monitor_name}
                    </span>
                    <StatusBadge status={entry.monitor_status_snapshot} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="rounded-xl border border-beacon-border p-5"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-4">
              Details
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-beacon-text-muted">Visibility</span>
                <span className="text-xs text-beacon-text">
                  {incident.is_public ? "Public" : "Internal"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-beacon-text-muted">Source</span>
                <span className="text-xs text-beacon-text">
                  {incident.auto_created ? "Automated" : "Manual"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit incident"
        size="md"
      >
        <IncidentForm
          existing={incident}
          onSuccess={updated => {
            setIncident(updated)
            setEditOpen(false)
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete incident"
        description={`Delete "${incident.title}"? All updates and history will be permanently removed.`}
        confirmLabel="Delete incident"
        variant="danger"
      />
    </div>
  )
}