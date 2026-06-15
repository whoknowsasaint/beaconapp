"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { incidents as incidentsAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import StatusBadge from "@/components/ui/StatusBadge"
import Button from "@/components/ui/Button"

function formatDate(str) {
  return new Date(str).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

function UpdateEntry({ update }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-4 py-4 border-b border-beacon-border last:border-0"
    >
      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
        <div className="h-6 w-6 rounded-full bg-white/[0.06] border border-beacon-border flex items-center justify-center">
          <span className="text-2xs font-medium text-beacon-text-muted uppercase">
            {(update.posted_by_username ?? "S")[0]}
          </span>
        </div>
        <div className="w-px flex-1 bg-beacon-border" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs font-medium text-beacon-text">
            {update.posted_by_username ?? "System"}
          </span>
          <StatusBadge status={update.status_at_update} />
          <span className="text-xs text-beacon-text-faint ml-auto">
            {formatDate(update.created_at)}
          </span>
        </div>
        <p className="text-sm text-beacon-text-muted leading-relaxed">
          {update.message}
        </p>
        {!update.is_public && (
          <span className="text-2xs text-beacon-text-faint mt-1 block">
            Internal only
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default function UpdateFeed({ incident, onIncidentChange }) {
  const [updates,  setUpdates]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [message,  setMessage]  = useState("")
  const [posting,  setPosting]  = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const textareaRef = useRef(null)

  const loadUpdates = useCallback(async () => {
    try {
      const res = await incidentsAPI.listUpdates(incident.id, { page_size: 50 })
      setUpdates(res.results ?? [])
    } catch {
      toast("Failed to load updates.", "error")
    } finally {
      setLoading(false)
    }
  }, [incident.id])

  useEffect(() => { loadUpdates() }, [loadUpdates])

  async function handlePost(e) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setPosting(true)
    try {
      const update = await incidentsAPI.postUpdate(incident.id, {
        message:   trimmed,
        is_public: isPublic,
      })
      // Prepend the new update to the list
      setUpdates(prev => [update, ...prev])
      // Clear the textarea state and DOM
      setMessage("")
      if (textareaRef.current) textareaRef.current.value = ""
      // Show success toast
      toast("Update posted.", "success")
    } catch (err) {
      toast(
        isBeaconAPIError(err) ? err.message : "Failed to post update.",
        "error",
      )
    } finally {
      setPosting(false)
    }
  }

  return (
    <div>
      {!incident.is_resolved && (
        <form onSubmit={handlePost} noValidate className="mb-6">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="What's the current status? What actions are being taken?"
            disabled={posting}
            rows={3}
            className={[
              "w-full rounded-lg px-3 py-2.5 text-sm resize-none",
              "bg-white/[0.04] border border-beacon-border",
              "text-beacon-text placeholder:text-beacon-text-faint",
              "focus:outline-none focus:border-beacon-blue focus:ring-1 focus:ring-beacon-blue",
              "transition-colors duration-150",
              "disabled:opacity-50",
            ].join(" ")}
          />

          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="rounded border-beacon-border accent-beacon-blue"
              />
              <span className="text-xs text-beacon-text-muted">
                Visible on status page
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={posting}
              disabled={!message.trim()}
            >
              Post update
            </Button>
          </div>
        </form>
      )}

      <div>
        {loading && (
          <div className="py-8 flex justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-beacon-blue border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && updates.length === 0 && (
          <p className="text-sm text-beacon-text-muted text-center py-8">
            No updates posted yet.
          </p>
        )}

        <AnimatePresence initial={false}>
          {updates.map(u => (
            <UpdateEntry key={u.id} update={u} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}