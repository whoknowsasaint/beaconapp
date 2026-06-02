"use client"

import { useState, useEffect } from "react"
import { incidents as incidentsAPI } from "@/lib/api/index.js"
import { monitors as monitorsAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical", color: "text-beacon-red"   },
  { value: "major",    label: "Major",    color: "text-beacon-amber"  },
  { value: "minor",    label: "Minor",    color: "text-beacon-blue"   },
  { value: "notice",   label: "Notice",   color: "text-beacon-text-muted" },
]

const DEFAULTS = {
  title:    "",
  severity: "minor",
  summary:  "",
  is_public: true,
}

export default function IncidentForm({ existing, onSuccess, onCancel }) {
  const isEdit = Boolean(existing)

  const [form,    setForm]    = useState(existing ? {
    title:     existing.title,
    severity:  existing.severity,
    summary:   existing.summary ?? "",
    is_public: existing.is_public,
  } : DEFAULTS)

  const [selectedMonitors, setSelectedMonitors] = useState(
    existing?.affected_monitors?.map(m => m.monitor_id) ?? []
  )
  const [allMonitors, setAllMonitors] = useState([])
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)

  useEffect(() => {
    monitorsAPI.list({ page_size: 100 }).then(res => {
      setAllMonitors(res.results ?? [])
    }).catch(() => {})
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  function toggleMonitor(id) {
    setSelectedMonitors(prev =>
      prev.includes(id)
        ? prev.filter(m => m !== id)
        : [...prev, id]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const payload = {
      title:     form.title.trim(),
      severity:  form.severity,
      summary:   form.summary.trim(),
      is_public: form.is_public,
      started_at: existing?.started_at ?? new Date().toISOString(),
    }

    if (!isEdit) {
      payload.affected_monitor_ids = selectedMonitors
    }

    try {
      const result = isEdit
        ? await incidentsAPI.update(existing.id, payload)
        : await incidentsAPI.create(payload)

      toast(
        isEdit ? "Incident updated." : "Incident created.",
        "success",
      )
      onSuccess(result)
    } catch (err) {
      if (isBeaconAPIError(err) && err.isValidation) {
        setErrors(err.fields ?? {})
        toast(err.message, "error")
      } else {
        toast("Something went wrong. Please try again.", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Title"
        value={form.title}
        onChange={e => set("title", e.target.value)}
        error={errors.title}
        placeholder="API Gateway -- Elevated Error Rate"
        disabled={loading}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-beacon-text">
          Severity
        </label>
        <div className="flex gap-2">
          {SEVERITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("severity", opt.value)}
              disabled={loading}
              className={[
                "flex-1 h-9 rounded-lg text-sm border transition-colors duration-150",
                form.severity === opt.value
                  ? `bg-white/[0.08] border-white/20 ${opt.color} font-medium`
                  : "border-beacon-border text-beacon-text-muted hover:border-white/20 bg-white/[0.03]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {errors.severity && (
          <p className="text-xs text-beacon-red">{errors.severity}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-beacon-text">
          Summary
          <span className="text-beacon-text-faint font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={form.summary}
          onChange={e => set("summary", e.target.value)}
          disabled={loading}
          rows={3}
          placeholder="Brief public description of the incident..."
          className={[
            "w-full rounded-lg px-3 py-2.5 text-sm resize-none",
            "bg-white/[0.04] border border-beacon-border",
            "text-beacon-text placeholder:text-beacon-text-faint",
            "focus:outline-none focus:border-beacon-blue focus:ring-1 focus:ring-beacon-blue",
            "transition-colors duration-150 disabled:opacity-50",
          ].join(" ")}
        />
      </div>

      {!isEdit && allMonitors.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-beacon-text">
            Affected monitors
            <span className="text-beacon-text-faint font-normal ml-1">(optional)</span>
          </label>
          <div className="border border-beacon-border rounded-lg divide-y divide-beacon-border max-h-40 overflow-y-auto">
            {allMonitors.map(m => (
              <label
                key={m.id}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedMonitors.includes(m.id)}
                  onChange={() => toggleMonitor(m.id)}
                  disabled={loading}
                  className="rounded border-beacon-border accent-beacon-blue"
                />
                <span className="text-sm text-beacon-text flex-1">{m.name}</span>
                <span className="text-xs text-beacon-text-faint">
                  {m.monitor_type_display}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.is_public}
          onChange={e => set("is_public", e.target.checked)}
          disabled={loading}
          className="rounded border-beacon-border accent-beacon-blue"
        />
        <span className="text-sm text-beacon-text-muted">
          Visible on public status pages
        </span>
      </label>

      <div className="flex gap-2 justify-end pt-2 border-t border-beacon-border mt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={loading}
        >
          {isEdit ? "Save changes" : "Create incident"}
        </Button>
      </div>
    </form>
  )
}