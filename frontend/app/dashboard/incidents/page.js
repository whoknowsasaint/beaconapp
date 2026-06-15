"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { incidents as incidentsAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import DataTable from "@/components/ui/DataTable"
import StatusBadge from "@/components/ui/StatusBadge"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import IncidentForm from "@/components/incidents/IncidentForm"

function formatDate(str) {
  if (!str) return "--"
  return new Date(str).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(seconds) {
  if (seconds == null) return "--"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const SEVERITY_COLORS = {
  critical: "text-beacon-red",
  major:    "text-beacon-amber",
  minor:    "text-beacon-blue",
  notice:   "text-beacon-text-muted",
}

export default function IncidentsPage() {
  const router = useRouter()

  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [createOpen,   setCreateOpen]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [sevFilter,    setSevFilter]    = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status   = statusFilter
      if (sevFilter)    params.severity = sevFilter
      const res = await incidentsAPI.list(params)
      setData(res)
    } catch (err) {
      toast(
        isBeaconAPIError(err) ? err.message : "Failed to load incidents.",
        "error",
      )
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sevFilter])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteTarget) return
    await incidentsAPI.delete(deleteTarget.id)
    toast("Incident deleted.", "success")
    setDeleteTarget(null)
    load()
  }

  const COLUMNS = [
    {
      key:   "title",
      label: "Title",
      render: (val, row) => (
        <button
          onClick={() => router.push(`/dashboard/incidents/${row.id}`)}
          className="font-medium text-beacon-text hover:text-beacon-blue transition-colors text-left"
        >
          {val}
        </button>
      ),
    },
    {
      key:   "severity",
      label: "Severity",
      width: "100px",
      render: val => (
        <span className={`text-xs font-medium capitalize ${SEVERITY_COLORS[val] ?? ""}`}>
          {val}
        </span>
      ),
    },
    {
      key:   "status",
      label: "Status",
      width: "140px",
      render: val => <StatusBadge status={val} />,
    },
    {
      key:   "duration_seconds",
      label: "Duration",
      width: "90px",
      render: val => (
        <span className="text-xs font-mono text-beacon-text-muted">
          {formatDuration(val)}
        </span>
      ),
    },
    {
      key:   "started_at",
      label: "Started",
      width: "150px",
      render: val => (
        <span className="text-xs text-beacon-text-faint">{formatDate(val)}</span>
      ),
    },
    {
      key:   "id",
      label: "",
      width: "80px",
      render: (_, row) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/incidents/${row.id}`)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => { e.stopPropagation(); setDeleteTarget(row) }}
            className="text-beacon-red hover:text-beacon-red hover:bg-beacon-red/10"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="Incidents"
        description={
          data
            ? `${data.count} incident${data.count !== 1 ? "s" : ""}`
            : "Loading..."
        }
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            Create incident
          </Button>
        }
      />

      <div className="flex gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg px-3 text-sm bg-white/[0.04] border border-beacon-border text-beacon-text focus:outline-none focus:border-beacon-blue transition-colors"
        >
          <option value="">All statuses</option>
          <option value="investigating">Investigating</option>
          <option value="identified">Identified</option>
          <option value="monitoring">Monitoring</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={sevFilter}
          onChange={e => setSevFilter(e.target.value)}
          className="h-9 rounded-lg px-3 text-sm bg-white/[0.04] border border-beacon-border text-beacon-text focus:outline-none focus:border-beacon-blue transition-colors"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
          <option value="notice">Notice</option>
        </select>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={data?.results ?? []}
        loading={loading}
        keyField="id"
        emptyTitle="No incidents"
        emptyDescription="Incidents appear here when created manually or triggered by monitor failures."
        emptyAction={{
          label:   "Create incident",
          onClick: () => setCreateOpen(true),
        }}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create incident"
        size="md"
      >
        <IncidentForm
          onSuccess={() => {
            setCreateOpen(false)
            load()
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete incident"
        description={`Delete "${deleteTarget?.title}"? All updates and history will be permanently removed.`}
        confirmLabel="Delete incident"
        variant="danger"
      />
    </div>
  )
}

