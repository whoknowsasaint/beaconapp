"use client"

import { useState } from "react"
import { statusPages as statusPagesAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

const BRAND_PRESETS = [
  { label: "Blue",   value: "3B82F6" },
  { label: "Green",  value: "22C55E" },
  { label: "Purple", value: "A855F7" },
  { label: "Orange", value: "F97316" },
  { label: "Pink",   value: "EC4899" },
]

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

const DEFAULTS = {
  name:               "",
  slug:               "",
  description:        "",
  brand_color:        "3B82F6",
  is_public:          true,
  allow_subscriptions: true,
  show_beacon_branding: true,
}

export default function StatusPageForm({ existing, onSuccess, onCancel }) {
  const isEdit = Boolean(existing)

  const [form,    setForm]    = useState(existing ? {
    name:                 existing.name,
    slug:                 existing.slug,
    description:          existing.description ?? "",
    brand_color:          existing.brand_color,
    is_public:            existing.is_public,
    allow_subscriptions:  existing.allow_subscriptions,
    show_beacon_branding: existing.show_beacon_branding,
  } : DEFAULTS)

  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  function handleNameChange(e) {
    const name = e.target.value
    set("name", name)
    if (!isEdit) {
      set("slug", slugify(name))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const payload = {
      name:                 form.name.trim(),
      description:          form.description.trim(),
      brand_color:          form.brand_color.replace("#", "").toUpperCase(),
      is_public:            form.is_public,
      allow_subscriptions:  form.allow_subscriptions,
      show_beacon_branding: form.show_beacon_branding,
    }

    if (!isEdit) {
      payload.slug = form.slug.trim()
    }

    try {
      const result = isEdit
        ? await statusPagesAPI.update(existing.slug, payload)
        : await statusPagesAPI.create(payload)

      toast(
        isEdit ? "Status page updated." : "Status page created.",
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
        label="Page name"
        value={form.name}
        onChange={handleNameChange}
        error={errors.name}
        placeholder="Acme Corp Status"
        disabled={loading}
      />

      <Input
        label="Slug"
        value={form.slug}
        onChange={e => set("slug", e.target.value)}
        error={errors.slug}
        placeholder="acme-corp"
        hint={
          isEdit
            ? "Slug cannot be changed after creation."
            : `Public URL: /status/${form.slug || "your-slug"}`
        }
        disabled={loading || isEdit}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-beacon-text">
          Description
          <span className="text-beacon-text-faint font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={form.description}
          onChange={e => set("description", e.target.value)}
          disabled={loading}
          rows={2}
          placeholder="Current status of Acme Corp services."
          className={[
            "w-full rounded-lg px-3 py-2.5 text-sm resize-none",
            "bg-white/[0.04] border border-beacon-border",
            "text-beacon-text placeholder:text-beacon-text-faint",
            "focus:outline-none focus:border-beacon-blue focus:ring-1 focus:ring-beacon-blue",
            "transition-colors duration-150 disabled:opacity-50",
          ].join(" ")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-beacon-text">
          Brand color
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {BRAND_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => set("brand_color", p.value)}
              disabled={loading}
              className={[
                "h-7 w-7 rounded-full border-2 transition-all",
                form.brand_color.toUpperCase() === p.value
                  ? "border-white scale-110"
                  : "border-transparent hover:border-white/40",
              ].join(" ")}
              style={{ background: `#${p.value}` }}
              aria-label={p.label}
              title={p.label}
            />
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-beacon-text-faint">#</span>
            <input
              type="text"
              value={form.brand_color}
              onChange={e => set("brand_color", e.target.value.replace("#", "").slice(0, 6))}
              disabled={loading}
              maxLength={6}
              className="h-7 w-20 rounded-md px-2 text-xs font-mono bg-white/[0.04] border border-beacon-border text-beacon-text focus:outline-none focus:border-beacon-blue transition-colors uppercase"
            />
          </div>
        </div>
        {errors.brand_color && (
          <p className="text-xs text-beacon-red">{errors.brand_color}</p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        {[
          { field: "is_public",            label: "Publicly accessible" },
          { field: "allow_subscriptions",  label: "Allow visitor subscriptions" },
          { field: "show_beacon_branding", label: "Show Powered by Beacon badge" },
        ].map(opt => (
          <label key={opt.field} className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form[opt.field]}
              onChange={e => set(opt.field, e.target.checked)}
              disabled={loading}
              className="rounded border-beacon-border accent-beacon-blue"
            />
            <span className="text-sm text-beacon-text-muted">{opt.label}</span>
          </label>
        ))}
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
          {isEdit ? "Save changes" : "Create status page"}
        </Button>
      </div>
    </form>
  )
}