"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { statusPages as statusPagesAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import StatusPageForm from "@/components/status-pages/StatusPageForm"
import MonitorPicker from "@/components/status-pages/MonitorPicker"
import StatusBadge from "@/components/ui/StatusBadge"
import { CardSkeleton } from "@/components/ui/LoadingSkeleton"

export default function StatusPageBuilderPage() {
  const router     = useRouter()
  const { slug }   = useParams()

  const [page,       setPage]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [notFound,   setNotFound]   = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await statusPagesAPI.get(slug)
      setPage(data)
    } catch (err) {
      if (isBeaconAPIError(err) && err.isNotFound) {
        setNotFound(true)
      } else {
        toast("Failed to load status page.", "error")
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    await statusPagesAPI.delete(slug)
    toast("Status page deleted.", "success")
    router.push("/dashboard/status-pages")
  }

  function copyPublicUrl() {
    const url = `${window.location.origin}/status/${slug}`
    navigator.clipboard.writeText(url)
    toast("Public URL copied.", "success")
  }

  if (loading) {
    return (
      <div className="flex-1 px-8 py-8">
        <div className="h-8 w-48 rounded-lg bg-white/[0.06] animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton className="lg:col-span-2" />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex-1 px-8 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-beacon-text-muted text-sm mb-4">
            Status page not found.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/dashboard/status-pages")}
          >
            Back to status pages
          </Button>
        </div>
      </div>
    )
  }

  const publicUrl = `/status/${page.slug}`

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title={page.name}
        description={
          <span className="flex items-center gap-2">
            <StatusBadge status={page.overall_status} />
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-beacon-text-faint hover:text-beacon-text transition-colors font-mono"
            >
              /status/{page.slug}
            </a>
          </span>
        }
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={copyPublicUrl}
            >
              Copy URL
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              Settings
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            className="rounded-xl border border-beacon-border p-5"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-5">
              Monitors on this page
            </h2>
            <MonitorPicker
              page={page}
              linkedMonitors={page.monitors ?? []}
              onUpdate={load}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl border border-beacon-border p-5"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-4">
              Page details
            </h2>
            <div className="space-y-2.5">
              {[
                { label: "Slug",         value: `/${page.slug}` },
                { label: "Visibility",   value: page.is_public ? "Public" : "Private" },
                { label: "Subscribers",  value: page.subscriber_count },
                { label: "Subscriptions", value: page.allow_subscriptions ? "Enabled" : "Disabled" },
                { label: "Branding",     value: page.show_beacon_branding ? "Shown" : "Hidden" },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-beacon-text-muted">{row.label}</span>
                  <span className="text-xs text-beacon-text font-mono">{row.value}</span>
                </div>
              ))}

              <div className="flex justify-between items-center">
                <span className="text-xs text-beacon-text-muted">Brand color</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-3.5 w-3.5 rounded-full border border-white/10"
                    style={{ background: `#${page.brand_color}` }}
                  />
                  <span className="text-xs text-beacon-text font-mono">
                    #{page.brand_color}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border border-beacon-border p-5"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-3">
              Public link
            </h2>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs font-mono text-beacon-blue hover:underline break-all"
            >
              {typeof window !== "undefined"
                ? `${window.location.origin}${publicUrl}`
                : publicUrl}
            </a>
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Page settings"
        size="md"
      >
        <StatusPageForm
          existing={page}
          onSuccess={updated => {
            setPage(updated)
            setEditOpen(false)
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete status page"
        description={`Delete "${page.name}"? Subscribers will no longer receive notifications.`}
        confirmLabel="Delete status page"
        variant="danger"
      />
    </div>
  )
}