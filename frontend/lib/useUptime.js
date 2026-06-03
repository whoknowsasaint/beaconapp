"use client"

import { useState, useEffect } from "react"
import { uptime as uptimeAPI } from "@/lib/api/index.js"

export default function useUptime(monitorId, days = 90) {
  const [buckets,  setBuckets]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!monitorId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await uptimeAPI.get(monitorId, days)
        if (!cancelled) setBuckets(data.buckets ?? [])
      } catch {
        if (!cancelled) setError("Failed to load uptime data.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [monitorId, days])

  return { buckets, loading, error }
}