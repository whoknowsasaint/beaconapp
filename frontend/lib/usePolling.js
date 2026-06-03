"use client"

import { useEffect, useRef, useCallback } from "react"

/**
 * Calls fn() immediately on mount, then again every intervalMs.
 * Pauses automatically when the tab is hidden.
 * Resumes when the tab becomes visible again.
 * Cleans up the interval and visibility listener on unmount.
 *
 * Usage:
 *   usePolling(async () => { const data = await fetch(...); setData(data) }, 30000)
 */
export default function usePolling(fn, intervalMs = 30000) {
  const fnRef       = useRef(fn)
  const timerRef    = useRef(null)
  const runningRef  = useRef(false)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const schedule = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(async () => {
      if (runningRef.current) return
      if (document.visibilityState === "hidden") return
      runningRef.current = true
      try {
        await fnRef.current()
      } finally {
        runningRef.current = false
      }
    }, intervalMs)
  }, [intervalMs])

  useEffect(() => {
    fnRef.current()

    schedule()

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        fnRef.current()
        schedule()
      } else {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [schedule])
}