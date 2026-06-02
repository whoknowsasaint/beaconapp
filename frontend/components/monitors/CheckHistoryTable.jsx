"use client"

import { useState, useEffect, useCallback } from "react"
import { monitors as monitorsAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import DataTable from "@/components/ui/DataTable"
import StatusBadge from "@/components/ui/StatusBadge"
import Button from "@/components/ui/Button"

function formatMs(ms) {
  if (ms == null) return "--"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatDate(str) {
  if (!str) return "--"
  return new Date(str).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const COLUMNS = [
  {
    key:   "status",
    label: "Result",
    width: "100px",
    render: val => <StatusBadge status={val} />,
  },
  {
    key:   "response_time_ms",
    label: "Response time",
    width: "140px",
    render: val => (
      <span className="font-mono text-xs">{formatMs(val)}</span>
    ),
  },
  {
    key:   "http_status_code",
    label: "HTTP status",
    width: "110px",
    render: val => (
      <span className="font-mono text-xs">{val ?? "--"}</span>
    ),
  },
  {
    key:   "region",
    label: "Region",
    width: "90px",
  },
  {
    key:   "checked_at",
    label: "Checked at",
    render: val => (
      <span className="text-xs text-beacon-text-faint">{formatDate(val)}</span>
    ),
  },
  {
    key:   "error",
    label: "Error",
    render: val => val
      ? <span className="text-xs text-beacon-red truncate max-w-xs block">{val}</span>
      : <span className="text-xs text-beacon-text-faint">--</span>,
  },
]

export default function CheckHistoryTable({ monitorId }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [error,   setError]   = useState(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await monitorsAPI.checks(monitorId, {
        page,
        page_size: 20,
      })
      setData(res)
    } catch (err) {
      setError(isBeaconAPIError(err) ? err.message : "Failed to load checks.")
    } finally {
      setLoading(false)
    }
  }, [monitorId, page])

  useEffect(() => { load(page) }, [load, page])

  if (error) {
    return (
      <p className="text-sm text-beacon-red px-4 py-8 text-center">{error}</p>
    )
  }

  return (
    <div>
      <DataTable
        columns={COLUMNS}
        rows={data?.results ?? []}
        loading={loading}
        keyField="id"
        emptyTitle="No checks yet"
        emptyDescription="Checks appear here once the monitor worker runs."
      />

      {data && (data.next || data.previous) && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-beacon-text-faint">
            {data.count} total checks
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!data.previous || loading}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!data.next || loading}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}