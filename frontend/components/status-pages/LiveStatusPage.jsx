"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import usePolling from "@/lib/usePolling.js"
import PublicStatusPage from "./PublicStatusPage.jsx"

const API_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : "http://localhost:8000"

async function fetchPageData(slug) {
  const res = await fetch(`${API_URL}/api/v1/status-pages/${slug}/public/`, {
    cache: "no-store",
  })
  if (!res.ok) return null
  const page = await res.json()

  const monitorsWithUptime = await Promise.all(
    (page.monitors ?? []).map(async monitor => {
      if (!monitor.show_uptime_history) {
        return { ...monitor, uptime_buckets: [] }
      }
      try {
        const uptimeRes = await fetch(
          `${API_URL}/api/v1/monitors/${monitor.id}/uptime/?days=90`,
          { cache: "no-store" }
        )
        if (!uptimeRes.ok) return { ...monitor, uptime_buckets: [] }
        const uptimeData = await uptimeRes.json()
        return { ...monitor, uptime_buckets: uptimeData.buckets ?? [] }
      } catch {
        return { ...monitor, uptime_buckets: [] }
      }
    })
  )

  return { ...page, monitors: monitorsWithUptime }
}

function LastUpdated({ lastUpdated }) {
  if (!lastUpdated) return null

  const time = new Date(lastUpdated).toLocaleTimeString("en-US", {
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="fixed bottom-4 right-4 z-10">
      <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full bg-beacon-green animate-pulse-soft"
          aria-hidden="true"
        />
        <span className="text-2xs text-beacon-text-faint font-mono">
          Updated {time}
        </span>
      </div>
    </div>
  )
}

export default function LiveStatusPage({ initialPage, slug }) {
  const [page,        setPage]        = useState(initialPage)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [hasError,    setHasError]    = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPageData(slug)
      if (data) {
        setPage(data)
        setLastUpdated(new Date().toISOString())
        setHasError(false)
      }
    } catch {
      setHasError(true)
    }
  }, [slug])

  usePolling(refresh, 30000)

  if (!page) return null

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={page.overall_status}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PublicStatusPage page={page} />
        </motion.div>
      </AnimatePresence>

      <LastUpdated lastUpdated={lastUpdated} />

      {hasError && (
        <div className="fixed top-4 right-4 z-10">
          <div className="glass-panel rounded-lg px-3 py-1.5">
            <span className="text-2xs text-beacon-amber">
              Connection issue -- retrying...
            </span>
          </div>
        </div>
      )}
    </>
  )
}