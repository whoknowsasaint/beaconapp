"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { statusPages as statusPagesAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import DataTable from "@/components/ui/DataTable"
import StatusBadge from "@/components/ui/StatusBadge"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import StatusPageForm from "@/components/status-pages/StatusPageForm"

export default function StatusPagesPage() {
  const router = useRouter()

  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [createOpen,   setCreateOpen]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await statusPagesAPI.list()
      setData(res)
    } catch (err) {
      toast(
        isBeaconAPIError(err) ? err.message : "Failed to load status pages.",
        "error",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteTarget) return
    await statusPagesAPI.delete(deleteTarget.slug)
    toast("Status page deleted.", "success")
    setDeleteTarget(null)
    load()
  }

  function copyPublicUrl(slug) {
    const url = `${window.location.origin}/status/${slug}`
    navigator.clipboard.writeText(url)
    toast("Public URL copied.", "success")
  }

  const COLUMNS = [
    {
      key:   "name",
      label: "Name",
      render: (val, row) => (
        <button
          onClick={() => router.push(`/dashboard/status-pages/${row.slug}`)}
          className="font-medium text-beacon-text hover:text-beacon-blue transition-colors text-left"
        >
          {val}
        </button>
      ),
    },
    {
      key:   "slug",
      label: "Slug",
      width: "150px",
      render: val => (
        <span className="text-xs font-mono text-beacon-text-muted">/{val}</span>
      ),
    },
    {
      key:   "overall_status",
      label: "Status",
      width: "140px",
      render: val => <StatusBadge status={val} />,
    },
    {
      key:   "subscriber_count",
      label: "Subscribers",
      width: "110px",
      render: val => (
        <span className="text-xs text-beacon-text-muted">{val}</span>
      ),
    },
    {
      key:   "is_public",
      label: "Visibility",
      width: "100px",
      render: val => (
        <span className={`text-xs ${val ? "text-beacon-green" : "text-beacon-text-faint"}`}>
          {val ? "Public" : "Private"}
        </span>
      ),
    },
    {
      key:   "slug",
      label: "",
      width: "130px",
      render: (slug, row) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyPublicUrl(slug)}
          >
            Copy URL
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
        title="Status Pages"
        description={
          data
            ? `${data.count} page${data.count !== 1 ? "s" : ""}`
            : "Loading..."
        }
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            New status page
          </Button>
        }
      />

      <DataTable
        columns={COLUMNS}
        rows={data?.results ?? []}
        loading={loading}
        keyField="id"
        emptyTitle="No status pages"
        emptyDescription="Create a status page to share your service health with users."
        emptyAction={{
          label:   "New status page",
          onClick: () => setCreateOpen(true),
        }}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New status page"
        size="md"
      >
        <StatusPageForm
          onSuccess={result => {
            setCreateOpen(false)
            router.push(`/dashboard/status-pages/${result.slug}`)
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete status page"
        description={`Delete "${deleteTarget?.name}"? Subscribers will no longer receive notifications.`}
        confirmLabel="Delete status page"
        variant="danger"
      />
    </div>
  )
}