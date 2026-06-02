"use client"

import { useState } from "react"
import { monitors as monitorsAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

const TYPE_OPTIONS = [
  { value: "http",  label: "HTTP / HTTPS" },
  { value: "tcp",   label: "TCP Port"     },
  { value: "ping",  label: "ICMP Ping"    },
]

const INTERVAL_OPTIONS = [
  { value: 30,    label: "Every 30 seconds" },
  { value: 60,    label: "Every minute"     },
  { value: 300,   label: "Every 5 minutes"  },
  { value: 600,   label: "Every 10 minutes" },
  { value: 1800,  label: "Every 30 minutes" },
  { value: 3600,  label: "Every hour"       },
]

const DEFAULTS = {
  name:                   "",
  monitor_type:           "http",
  url:                    "",
  host:                   "",
  port:                   "",
  interval:               60,
  timeout:                30,
  expected_status_codes:  "200",
}

export default function MonitorForm({ existing, onSuccess, onCancel }) {
  const isEdit = Boolean(existing)

  const [form,    setForm]    = useState(existing ? {
    name:                  existing.name,
    monitor_type:          existing.monitor_type,
    url:                   existing.url          ?? "",
    host:                  existing.host         ?? "",
    port:                  existing.port         ?? "",
    interval:              existing.interval,
    timeout:               existing.timeout,
    expected_status_codes: existing.expected_status_codes,
  } : DEFAULTS)

  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const payload = {
      name:         form.name.trim(),
      monitor_type: form.monitor_type,
      interval:     Number(form.interval),
      timeout:      Number(form.timeout),
    }

    if (form.monitor_type === "http") {
      payload.url                   = form.url.trim()
      payload.expected_status_codes = form.expected_status_codes.trim()
    }
    if (form.monitor_type === "tcp") {
      payload.host = form.host.trim()
      payload.port = Number(form.port)
    }
    if (form.monitor_type === "ping") {
      payload.host = form.host.trim()
    }

    try {
      const result = isEdit
        ? await monitorsAPI.update(existing.id, payload)
        : await monitorsAPI.create(payload)

      toast(
        isEdit ? "Monitor updated." : "Monitor created.",
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
        label="Name"
        value={form.name}
        onChange={e => set("name", e.target.value)}
        error={errors.name}
        placeholder="API Gateway"
        disabled={loading}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-beacon-text">
          Monitor type
        </label>
        <div className="flex gap-2">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("monitor_type", opt.value)}
              disabled={loading}
              className={[
                "flex-1 h-9 rounded-lg text-sm border transition-colors duration-150",
                form.monitor_type === opt.value
                  ? "bg-beacon-blue/10 border-beacon-blue/40 text-beacon-blue"
                  : "border-beacon-border text-beacon-text-muted hover:border-white/20 hover:text-beacon-text bg-white/[0.03]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {form.monitor_type === "http" && (
        <>
          <Input
            label="URL"
            value={form.url}
            onChange={e => set("url", e.target.value)}
            error={errors.url}
            placeholder="https://api.example.com/health"
            type="url"
            disabled={loading}
          />
          <Input
            label="Expected status codes"
            value={form.expected_status_codes}
            onChange={e => set("expected_status_codes", e.target.value)}
            error={errors.expected_status_codes}
            placeholder="200,201,204"
            hint="Comma-separated HTTP status codes considered healthy."
            disabled={loading}
          />
        </>
      )}

      {(form.monitor_type === "tcp" || form.monitor_type === "ping") && (
        <Input
          label="Host"
          value={form.host}
          onChange={e => set("host", e.target.value)}
          error={errors.host}
          placeholder="db.example.com"
          disabled={loading}
        />
      )}

      {form.monitor_type === "tcp" && (
        <Input
          label="Port"
          value={form.port}
          onChange={e => set("port", e.target.value)}
          error={errors.port}
          placeholder="5432"
          type="number"
          disabled={loading}
        />
      )}

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-beacon-text">
            Check interval
          </label>
          <select
            value={form.interval}
            onChange={e => set("interval", Number(e.target.value))}
            disabled={loading}
            className="h-9 w-full rounded-lg px-3 text-sm bg-white/[0.04] border border-beacon-border text-beacon-text focus:outline-none focus:border-beacon-blue focus:ring-1 focus:ring-beacon-blue transition-colors"
          >
            {INTERVAL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-beacon-text">
            Timeout (seconds)
          </label>
          <select
            value={form.timeout}
            onChange={e => set("timeout", Number(e.target.value))}
            disabled={loading}
            className="h-9 w-full rounded-lg px-3 text-sm bg-white/[0.04] border border-beacon-border text-beacon-text focus:outline-none focus:border-beacon-blue focus:ring-1 focus:ring-beacon-blue transition-colors"
          >
            {[5, 10, 15, 20, 30, 45, 60].map(s => (
              <option key={s} value={s}>{s}s</option>
            ))}
          </select>
        </div>
      </div>

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
          {isEdit ? "Save changes" : "Create monitor"}
        </Button>
      </div>
    </form>
  )
}