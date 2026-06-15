"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import usePolling from "@/lib/usePolling"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getCsrf() {
  const m = document.cookie.match(/csrftoken=([^;]+)/)
  return m ? m[1] : ""
}

async function apiFetch(path, options = {}) {
  return fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrf(), ...options.headers },
    ...options,
  })
}

const STEPS = [
  { key: "investigating", label: "Investigating", color: "#EF4444" },
  { key: "identified",    label: "Identified",    color: "#F59E0B" },
  { key: "monitoring",    label: "Monitoring",    color: "#3B82F6" },
  { key: "resolved",      label: "Resolved",      color: "#22C55E" },
]

const SEVERITY_CONFIG = {
  critical: { label: "Critical", color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  major:    { label: "Major",    color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  minor:    { label: "Minor",    color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  notice:   { label: "Notice",   color: "#6B7280", bg: "rgba(107,114,128,0.12)",border: "rgba(107,114,128,0.3)" },
}

function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{    opacity: 0, y: 8,  scale: 0.96 }}
      transition={{ duration: 0.22 }}
      style={{
        position:     "fixed",
        bottom:       24,
        right:        24,
        zIndex:       100,
        padding:      "10px 16px",
        borderRadius: 10,
        background:   type === "error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
        border:       `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
        color:        type === "error" ? "#EF4444" : "#22C55E",
        fontSize:     13,
        fontWeight:   500,
        boxShadow:    "0 8px 32px rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
      }}
    >
      {message}
    </motion.div>
  )
}

function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatRelative(str) {
  if (!str) return ""
  const diff  = Date.now() - new Date(str).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days  > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins  > 0) return `${mins}m ago`
  return "just now"
}

function formatDuration(startStr) {
  if (!startStr) return "—"
  const diff  = Date.now() - new Date(startStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days  > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${mins % 60}m`
  return `${mins}m`
}

export default function IncidentDetailPage() {
  const router          = useRouter()
  const params          = useParams()
  const id              = params?.id

  const [incident,      setIncident]      = useState(null)
  const [updates,       setUpdates]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [updateText,    setUpdateText]    = useState("")
  const [visibleOnPage, setVisibleOnPage] = useState(true)
  const [postingUpdate, setPostingUpdate] = useState(false)
  const [advancingStep, setAdvancingStep] = useState(false)
  const [toast,         setToast]         = useState(null)
  const [showDelete,    setShowDelete]    = useState(false)

  function showToast(message, type = "success") {
    setToast({ message, type, key: Date.now() })
  }

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [iRes, uRes] = await Promise.all([
        apiFetch(`/api/v1/incidents/${id}/`),
        apiFetch(`/api/v1/incidents/${id}/updates/`),
      ])
      if (iRes.status === 401) { router.push("/login"); return }
      if (iRes.ok) setIncident(await iRes.json())
      if (uRes.ok) {
        const uData = await uRes.json()
        setUpdates(uData.results ?? uData)
      }
    } catch {
      showToast("Failed to load incident", "error")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])
  usePolling(load, 30000)

  async function advanceStatus(newStatus) {
    if (advancingStep) return
    setAdvancingStep(true)
    try {
      const res = await apiFetch(`/api/v1/incidents/${id}/`, {
        method: "PATCH",
        body:   JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setIncident(await res.json())
        showToast(`Status updated to ${newStatus}`)
      } else {
        showToast("Failed to update status", "error")
      }
    } catch {
      showToast("Network error", "error")
    } finally {
      setAdvancingStep(false)
    }
  }

  async function postUpdate(e) {
    e.preventDefault()
    if (!updateText.trim() || postingUpdate) return
    setPostingUpdate(true)
    try {
      const res = await apiFetch(`/api/v1/incidents/${id}/updates/`, {
        method: "POST",
        body:   JSON.stringify({
          message:            updateText.trim(),
          is_visible_on_page: visibleOnPage,
        }),
      })
      if (res.ok) {
        const newUpdate = await res.json()
        setUpdates(prev => [newUpdate, ...prev])
        setUpdateText("")
        showToast("Update posted")
      } else {
        const err = await res.json().catch(() => ({}))
        showToast(err.message ?? "Failed to post update", "error")
      }
    } catch {
      showToast("Network error", "error")
    } finally {
      setPostingUpdate(false)
    }
  }

  async function deleteIncident() {
    try {
      const res = await apiFetch(`/api/v1/incidents/${id}/`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        router.push("/dashboard/incidents")
      } else {
        showToast("Failed to delete incident", "error")
      }
    } catch {
      showToast("Network error", "error")
    }
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
        Loading incident...
      </div>
    )
  }

  if (!incident) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Incident not found.</p>
        <button onClick={() => router.push("/dashboard/incidents")} style={{ fontSize: 13, color: "#3B82F6", background: "none", border: "none", cursor: "pointer" }}>
          ← Back to incidents
        </button>
      </div>
    )
  }

  const currentStepIdx = STEPS.findIndex(s => s.key === incident.status)
  const sevCfg         = SEVERITY_CONFIG[incident.severity] ?? SEVERITY_CONFIG.notice

  return (
    <div style={{ flex: 1, padding: "32px 40px", maxWidth: 860, width: "100%" }}>

      <button
        onClick={() => router.push("/dashboard/incidents")}
        style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 4 }}
        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
      >
        ← Incidents
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", marginBottom: 8 }}>
            {incident.title}
          </h1>
          <span style={{
            display:      "inline-flex",
            alignItems:   "center",
            gap:          5,
            padding:      "3px 10px",
            borderRadius: "9999px",
            fontSize:     11,
            fontWeight:   600,
            textTransform:"uppercase",
            letterSpacing:"0.05em",
            background:   sevCfg.bg,
            color:        sevCfg.color,
            border:       `1px solid ${sevCfg.border}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: sevCfg.color, display: "inline-block" }} />
            {sevCfg.label}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowDelete(true)}
            style={{ height: 34, padding: "0 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Status stepper */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
            Status
          </p>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {STEPS.map((step, i) => {
              const isActive = i === currentStepIdx
              const isDone   = i < currentStepIdx
              const isNext   = i === currentStepIdx + 1

              return (
                <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <motion.button
                      onClick={() => isNext && !advancingStep && advanceStatus(step.key)}
                      disabled={!isNext || advancingStep}
                      style={{
                        width:          32,
                        height:         32,
                        borderRadius:   "50%",
                        border:         `2px solid ${isActive ? step.color : isDone ? step.color : "rgba(255,255,255,0.15)"}`,
                        background:     isDone ? step.color : isActive ? `${step.color}22` : "transparent",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        cursor:         isNext ? "pointer" : "default",
                        position:       "relative",
                      }}
                      whileHover={isNext ? { scale: 1.1 } : {}}
                      whileTap={isNext  ? { scale: 0.95 } : {}}
                      title={isNext ? `Advance to ${step.label}` : step.label}
                    >
                      {isDone ? (
                        <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" style={{ width: 10, height: 10 }}>
                          <path d="M1.5 6l3 3 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <motion.span
                          style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? step.color : "rgba(255,255,255,0.2)", display: "inline-block" }}
                          animate={isActive ? { opacity: [1, 0.4, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                      {isNext && (
                        <div style={{ position: "absolute", top: -4, right: -4, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }} />
                      )}
                    </motion.button>
                    <span style={{ fontSize: 11, color: isActive ? "rgba(255,255,255,0.85)" : isDone ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)", whiteSpace: "nowrap", fontWeight: isActive ? 600 : 400 }}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, margin: "0 8px", marginBottom: 28, background: isDone ? step.color : "rgba(255,255,255,0.08)", borderRadius: 1, transition: "background 0.4s" }} />
                  )}
                </div>
              )
            })}
          </div>
          {currentStepIdx < STEPS.length - 1 && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 12 }}>
              Click the next step to advance — <span style={{ color: STEPS[currentStepIdx + 1]?.color }}>{STEPS[currentStepIdx + 1]?.label}</span>
            </p>
          )}
        </div>

        {/* Post update */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            Updates
          </p>

          <form onSubmit={postUpdate} style={{ marginBottom: 20 }}>
            <textarea
              value={updateText}
              onChange={e => setUpdateText(e.target.value)}
              placeholder="What's the current status? What actions are being taken?"
              rows={3}
              style={{
                width:        "100%",
                borderRadius: 8,
                background:   "rgba(255,255,255,0.04)",
                border:       "1px solid rgba(255,255,255,0.1)",
                color:        "rgba(255,255,255,0.85)",
                fontSize:     13,
                padding:      "12px 14px",
                outline:      "none",
                resize:       "vertical",
                boxSizing:    "border-box",
                fontFamily:   "inherit",
                lineHeight:   1.5,
              }}
              onFocus={e  => e.target.style.border = "1px solid rgba(255,255,255,0.25)"}
              onBlur={e   => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={visibleOnPage}
                  onChange={e => setVisibleOnPage(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: "#3B82F6" }}
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Visible on status page</span>
              </label>

              <button
                type="submit"
                disabled={!updateText.trim() || postingUpdate}
                style={{
                  height:     34,
                  padding:    "0 16px",
                  borderRadius: 8,
                  background: !updateText.trim() || postingUpdate ? "rgba(59,130,246,0.35)" : "#2563EB",
                  color:      "white",
                  fontSize:   13,
                  fontWeight: 500,
                  border:     "none",
                  cursor:     !updateText.trim() || postingUpdate ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {postingUpdate ? "Posting..." : "Post update"}
              </button>
            </div>
          </form>

          {updates.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", textAlign: "center", padding: "16px 0" }}>
              No updates posted yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {updates.map((u, i) => (
                <motion.div
                  key={u.id ?? i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  style={{ display: "flex", gap: 12, paddingBottom: i < updates.length - 1 ? 16 : 0 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                        {(u.author ?? "?")[0].toUpperCase()}
                      </span>
                    </div>
                    {i < updates.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.07)", marginTop: 6 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < updates.length - 1 ? 4 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                        {u.author ?? "System"}
                      </span>
                      {u.status && (
                        <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", textTransform: "capitalize" }}>
                          {u.status}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginLeft: "auto" }}>
                        {formatRelative(u.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, margin: 0 }}>
                      {u.message}
                    </p>
                    {u.is_visible_on_page === false && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4, display: "inline-block" }}>
                        Hidden from status page
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline + details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Timeline</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Started</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{formatDate(incident.started_at)}</p>
              </div>
              {incident.resolved_at && (
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Resolved</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{formatDate(incident.resolved_at)}</p>
                </div>
              )}
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Duration</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{formatDuration(incident.started_at)}</p>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Visibility</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{incident.is_public ? "Public" : "Private"}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Source</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500, textTransform: "capitalize" }}>{incident.source ?? "Manual"}</p>
              </div>
              {incident.affected_monitors?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Affected monitors</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {incident.affected_monitors.map(m => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.status === "operational" ? "#22C55E" : "#EF4444", display: "inline-block" }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{m.name}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "capitalize", marginLeft: "auto" }}>{m.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setShowDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#111316", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "28px 28px", maxWidth: 380, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 8 }}>Delete incident?</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 24, lineHeight: 1.5 }}>
                This will permanently delete "{incident.title}" and all its updates. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowDelete(false)}
                  style={{ flex: 1, height: 38, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteIncident}
                  style={{ flex: 1, height: 38, borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}