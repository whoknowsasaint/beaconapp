"use client"

import { useState, useEffect, useCallback } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const WARMUP_ENDPOINT = `${API_URL}/api/v1/auth/csrf/`

const POLL_INTERVAL_MS = 2500
const MAX_WAIT_MS      = 75000

export function useBackendWarmup() {
  const [status,   setStatus]   = useState("checking")
  const [elapsed,  setElapsed]  = useState(0)

  const ping = useCallback(async () => {
    try {
      const res = await fetch(WARMUP_ENDPOINT, {
        method:      "GET",
        credentials: "include",
        cache:       "no-store",
      })
      return res.ok || res.status === 403 || res.status === 401

    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let pollTimer = null
    let tickTimer = null
    const startedAt = Date.now()

    async function attempt() {
      const ok = await ping()
      if (cancelled) return

      const now = Date.now() - startedAt
      setElapsed(now)

      if (ok) {
        setStatus("warm")
        return
      }

      if (now >= MAX_WAIT_MS) {
        setStatus("failed")
        return
      }

      setStatus("slow")
      pollTimer = setTimeout(attempt, POLL_INTERVAL_MS)
    }

    tickTimer = setInterval(() => {
      if (!cancelled) setElapsed(Date.now() - startedAt)
    }, 1000)

    attempt()

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
      if (tickTimer) clearInterval(tickTimer)
    }
  }, [ping])

  const retry = useCallback(() => {
    setStatus("checking")
    setElapsed(0)
  }, [])

  return { status, elapsed, retry }
}