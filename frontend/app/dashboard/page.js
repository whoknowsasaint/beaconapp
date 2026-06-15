"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { monitors as monitorsAPI } from "@/lib/api/index.js"
import { incidents as incidentsAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import usePolling from "@/lib/usePolling.js"
import { toast } from "@/lib/useToast.js"
import StatCard from "@/components/dashboard/StatCard"
import RecentIncidents from "@/components/dashboard/RecentIncidents"
import MonitorStatusGrid from "@/components/dashboard/MonitorStatusGrid"
import Button from "@/components/ui/Button"

function deriveStats(allMonitors, allIncidents) {
  const total       = allMonitors.length
  const operational = allMonitors.filter(m => m.status === "operational").length
  const outage      = allMonitors.filter(m => m.status === "outage").length
  const degraded    = allMonitors.filter(m => m.status === "degraded").length

  const activeIncidents = allIncidents.filter(i => i.status !== "resolved").length

  const dataMonitors = allMonitors.filter(
    m => m.status !== "pending" && m.status !== "paused"
  )
  const uptimePct = dataMonitors.length > 0
    ? ((dataMonitors.filter(m => m.status === "operational").length / dataMonitors.length) * 100).toFixed(1)
    : null

  return { total, operational, outage, degraded, activeIncidents, uptimePct }
}

export default function DashboardPage() {
  const router = useRouter()

  const [allMonitors,  setAllMonitors]  = useState([])
  const [allIncidents, setAllIncidents] = useState([])
  const [loading,      setLoading]      = useState(true)

  const load = useCallback(async () => {
    try {
      const [monData, incData] = await Promise.all([
        monitorsAPI.list({ page_size: 100 }),
        incidentsAPI.list({ page_size: 10, ordering: "-started_at" }),
      ])
      setAllMonitors(monData.results  ?? [])
      setAllIncidents(incData.results ?? [])
    } catch (err) {
      if (isBeaconAPIError(err) && !err.isAuth) {
        toast("Failed to load dashboard data.", "error")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  usePolling(load, 30000)

  const stats = deriveStats(allMonitors, allIncidents)

  const overallColor =
    stats.outage   > 0 ? "red"   :
    stats.degraded > 0 ? "amber" :
    stats.total    > 0 ? "green" :
    "default"

  return (
    <div className="flex-1 px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-beacon-text tracking-tight mb-1">
            Overview
          </h1>
          <p className="text-sm text-beacon-text-muted">
            {loading
              ? "Loading..."
              : `${stats.total} monitor${stats.total !== 1 ? "s" : ""} · updates every 30s`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/dashboard/monitors")}
          >
            Monitors
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/dashboard/incidents")}
          >
            {stats.activeIncidents > 0
              ? `${stats.activeIncidents} active incident${stats.activeIncidents !== 1 ? "s" : ""}`
              : "Incidents"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total monitors"
          value={loading ? null : stats.total}
          hint={loading ? null : `${stats.operational} operational`}
          color="default"
          loading={loading}
        />
        <StatCard
          label="Current uptime"
          value={loading || stats.uptimePct == null ? null : `${stats.uptimePct}%`}
          hint="Across active monitors"
          color={overallColor}
          loading={loading}
        />
        <StatCard
          label="Active incidents"
          value={loading ? null : stats.activeIncidents}
          hint={stats.activeIncidents > 0 ? "Requires attention" : "All clear"}
          color={stats.activeIncidents > 0 ? "red" : "green"}
          loading={loading}
        />
        <StatCard
          label="Degraded / outage"
          value={loading ? null : stats.outage + stats.degraded}
          hint={
            stats.outage > 0
              ? `${stats.outage} down, ${stats.degraded} degraded`
              : stats.degraded > 0
              ? `${stats.degraded} degraded`
              : "All systems healthy"
          }
          color={stats.outage > 0 ? "red" : stats.degraded > 0 ? "amber" : "green"}
          loading={loading}
        />
      </div>

      {stats.outage > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1,  y:  0 }}
          className="rounded-xl border border-beacon-red/30 bg-beacon-red/5 px-5 py-4 mb-6 flex items-center gap-3"
        >
          <span
            className="h-2 w-2 rounded-full bg-beacon-red animate-pulse-soft flex-shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm text-beacon-red font-medium">
            {stats.outage} monitor{stats.outage !== 1 ? "s" : ""} currently down
          </p>
          <button
            onClick={() => router.push("/dashboard/monitors?status=outage")}
            className="ml-auto text-xs text-beacon-red hover:underline"
          >
            View affected monitors
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div
            className="rounded-xl border border-beacon-border p-5"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider">
                Monitor status
              </h2>
              <button
                onClick={() => router.push("/dashboard/monitors")}
                className="text-xs text-beacon-text-muted hover:text-beacon-text transition-colors"
              >
                Manage
              </button>
            </div>
            <MonitorStatusGrid
              monitors={allMonitors}
              loading={loading}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <RecentIncidents
            incidents={allIncidents}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}