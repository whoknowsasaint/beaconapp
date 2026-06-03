"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { monitors as monitorsAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import DataTable from "@/components/ui/DataTable"
import StatusBadge from "@/components/ui/StatusBadge"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import MonitorForm from "@/components/monitors/MonitorForm"
import { toast } from "@/lib/useToast.js"
import usePolling from "@/lib/usePolling.js"

function formatDate(str) {
  if (!str) return "Never"
  return new Date(str).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

function formatInterval(seconds) {
  if (seconds < 60)   return `${seconds}s`
  if (seconds < 3600) return `${seconds / 60}m`
  return `${seconds / 3600}h`
}

export default function MonitorsPage() {
  const router = useRouter()

  const [data,          setData]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [createOpen,    setCreateOpen]    = useState(false)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [search,        setSearch]        = useState("")
  const [statusFilter,  setStatusFilter]  = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await monitorsAPI.list(params)
      setData(res)
    } catch (err) {
      toast(
        isBeaconAPIError(err) ? err.message : "Failed to load monitors.",
        "error",
      )
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  usePolling(load, 30000)

  async function handleDelete() {
    if (!deleteTarget) return
    await monitorsAPI.delete(deleteTarget.id)
    toast("Monitor deleted.", "success")
    setDeleteTarget(null)
    load()
  }

  const COLUMNS = [
    {
      key:   "name",
      label: "Name",
      render: (val, row) => (
        <button
          onClick={() => router.push(`/dashboard/monitors/${row.id}`)}
          className="font-medium text-beacon-text hover:text-beacon-blue transition-colors text-left"
        >
          {val}
        </button>
      ),
    },
    {
      key:   "status",
      label: "Status",
      width: "130px",
      render: val => <StatusBadge status={val} />,
    },
    {
      key:   "monitor_type_display",
      label: "Type",
      width: "110px",
      render: val => (
        <span className="text-xs text-beacon-text-muted">{val}</span>
      ),
    },
    {
      key:   "interval",
      label: "Interval",
      width: "90px",
      render: val => (
        <span className="text-xs font-mono text-beacon-text-muted">
          {formatInterval(val)}
        </span>
      ),
    },
    {
      key:   "last_checked_at",
      label: "Last check",
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
            onClick={() => router.push(`/dashboard/monitors/${row.id}`)}
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
        title="Monitors"
        description={
          data
            ? `${data.count} monitor${data.count !== 1 ? "s" : ""}`
            : "Loading..."
        }
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            Add monitor
          </Button>
        }
      />

      <div className="flex gap-3 mb-5">
        <input
          type="search"
          placeholder="Search monitors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 rounded-lg px-3 text-sm bg-white/[0.04] border border-beacon-border text-beacon-text placeholder:text-beacon-text-faint focus:outline-none focus:border-beacon-blue focus:ring-1 focus:ring-beacon-blue transition-colors w-64"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg px-3 text-sm bg-white/[0.04] border border-beacon-border text-beacon-text focus:outline-none focus:border-beacon-blue transition-colors"
        >
          <option value="">All statuses</option>
          <option value="operational">Operational</option>
          <option value="degraded">Degraded</option>
          <option value="outage">Outage</option>
          <option value="paused">Paused</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={data?.results ?? []}
        loading={loading}
        keyField="id"
        emptyTitle="No monitors yet"
        emptyDescription="Add your first monitor to start tracking uptime."
        emptyAction={{
          label:   "Add monitor",
          onClick: () => setCreateOpen(true),
        }}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add monitor"
        size="md"
      >
        <MonitorForm
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
        title="Delete monitor"
        description={`Delete "${deleteTarget?.name}"? This will permanently remove all check history.`}
        confirmLabel="Delete monitor"
        variant="danger"
      />
    </div>
  )
}