"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiKeys as apiKeysAPI } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import Button from "@/components/ui/Button"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

function formatDate(str) {
  if (!str) return "Never"
  return new Date(str).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

function MetaItem({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xs text-beacon-text-faint uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-mono text-beacon-text-muted">
        {value}
      </span>
    </div>
  )
}

export default function APIKeyCard({ apiKey, onRevoked }) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleRevoke() {
    await apiKeysAPI.revoke(apiKey.id)
    toast("API key revoked.", "success")
    onRevoked()
  }

  const isExpired = apiKey.is_expired
  const isRevoked = !apiKey.is_active

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{    opacity: 0, y: 8 }}
      transition={{ duration: 0.18 }}
      className={[
        "terminal-panel rounded-xl p-5",
        isRevoked || isExpired ? "opacity-50" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-beacon-text">
              {apiKey.name}
            </span>
            {isRevoked && (
              <span className="text-2xs px-1.5 py-0.5 rounded border border-beacon-red/30 text-beacon-red bg-beacon-red/10">
                Revoked
              </span>
            )}
            {isExpired && !isRevoked && (
              <span className="text-2xs px-1.5 py-0.5 rounded border border-beacon-amber/30 text-beacon-amber bg-beacon-amber/10">
                Expired
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-beacon-terminal">
              {apiKey.prefix}
            </span>
            <span className="text-xs font-mono text-beacon-text-faint">
              {"•".repeat(20)}
            </span>
          </div>
        </div>

        {!isRevoked && !isExpired && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="text-beacon-red hover:text-beacon-red hover:bg-beacon-red/10 flex-shrink-0"
          >
            Revoke
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-beacon-terminal/20">
        <MetaItem label="Created"    value={formatDate(apiKey.created_at)} />
        <MetaItem label="Last used"  value={formatDate(apiKey.last_used_at)} />
        <MetaItem label="Expires"    value={apiKey.expires_at ? formatDate(apiKey.expires_at) : "Never"} />
        <MetaItem label="Status"     value={isRevoked ? "Revoked" : isExpired ? "Expired" : "Active"} />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRevoke}
        title="Revoke API key"
        description={`Revoke "${apiKey.name}"? Any integrations using this key will stop working immediately.`}
        confirmLabel="Revoke key"
        variant="danger"
      />
    </motion.div>
  )
}