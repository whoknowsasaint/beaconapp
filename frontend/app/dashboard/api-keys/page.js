"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiKeys as apiKeysAPI } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import { toast } from "@/lib/useToast.js"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import APIKeyCard from "@/components/api-keys/APIKeyCard"
import { Skeleton } from "@/components/ui/LoadingSkeleton"

function NewKeyReveal({ rawKey, onDismiss }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-beacon-terminal/30 bg-beacon-terminal/5 p-5 mb-6"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium text-beacon-terminal mb-0.5">
            API key created
          </p>
          <p className="text-xs text-beacon-text-muted">
            Copy this key now. It will not be shown again.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs font-mono text-beacon-terminal bg-black/30 rounded-lg px-3 py-2.5 border border-beacon-terminal/20 break-all">
          {rawKey}
        </code>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="flex-shrink-0"
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </motion.div>
  )
}

function CreateKeyForm({ onCreated, onCancel }) {
  const [name,    setName]    = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const result = await apiKeysAPI.create({ name: name.trim() })
      onCreated(result)
    } catch (err) {
      if (isBeaconAPIError(err)) {
        setError(err.fieldError("name") ?? err.message)
      } else {
        setError("Something went wrong.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Key name"
        value={name}
        onChange={e => setName(e.target.value)}
        error={error}
        placeholder="CI Pipeline"
        hint="A name to identify where this key is used."
        autoFocus
        disabled={loading}
      />

      <div className="rounded-lg border border-beacon-border px-4 py-3 bg-white/[0.02]">
        <p className="text-xs text-beacon-text-muted">
          The full API key is shown once after creation. Store it securely -- it cannot be recovered.
        </p>
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-beacon-border mt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={loading}
          disabled={!name.trim()}
        >
          Create key
        </Button>
      </div>
    </form>
  )
}

function LoadingCards() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="terminal-panel rounded-xl p-5"
        >
          <div className="flex justify-between mb-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex gap-4 pt-4 border-t border-white/[0.06]">
            {[1, 2, 3, 4].map(j => (
              <Skeleton key={j} className="h-8 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function APIKeysPage() {
  const [keys,       setKeys]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newRawKey,  setNewRawKey]  = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiKeysAPI.list()
      setKeys(Array.isArray(res) ? res : [])
    } catch (err) {
      toast(
        isBeaconAPIError(err) ? err.message : "Failed to load API keys.",
        "error",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleCreated(result) {
    setCreateOpen(false)
    setNewRawKey(result.raw_key)
    load()
  }

  const activeKeys  = keys.filter(k => k.is_active && !k.is_expired)
  const inactiveKeys = keys.filter(k => !k.is_active || k.is_expired)

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="API Keys"
        description="Authenticate external integrations with Beacon's API."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            Create key
          </Button>
        }
      />

      <AnimatePresence>
        {newRawKey && (
          <NewKeyReveal
            rawKey={newRawKey}
            onDismiss={() => setNewRawKey(null)}
          />
        )}
      </AnimatePresence>

      <div
        className="rounded-xl border border-beacon-border px-5 py-4 mb-6"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <h2 className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-3">
          Usage
        </h2>
        <div className="terminal-panel rounded-lg px-4 py-3">
          <code className="text-xs font-mono text-beacon-terminal">
            curl https://your-beacon-instance.com/api/v1/monitors/ \
          </code>
          <br />
          <code className="text-xs font-mono text-beacon-text-muted pl-4">
/* eslint-disable-next-line react/no-unescaped-entities */
            -H "Authorization: Bearer bk_live_..."
          </code>
        </div>
      </div>

      {loading ? (
        <LoadingCards />
      ) : keys.length === 0 ? (
        <div
          className="rounded-xl border border-beacon-border px-6 py-16 flex flex-col items-center text-center"
          style={{ background: "var(--color-bg-elevated)" }}
        >
          <div className="h-10 w-10 rounded-xl terminal-panel border border-beacon-terminal/20 flex items-center justify-center mb-4">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-beacon-terminal">
              <circle cx="5.5" cy="7.5" r="3.5" />
              <path d="M8.5 7.5H15M12.5 7.5V10" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-beacon-text mb-1">
            No API keys
          </h3>
          <p className="text-sm text-beacon-text-muted mb-6 max-w-xs">
            Create a key to authenticate API requests from your integrations and scripts.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            Create your first key
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {activeKeys.length > 0 && (
            <div>
              <p className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-3">
                Active keys
              </p>
              <AnimatePresence mode="popLayout">
                <div className="flex flex-col gap-3">
                  {activeKeys.map(key => (
                    <APIKeyCard
                      key={key.id}
                      apiKey={key}
                      onRevoked={load}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          )}

          {inactiveKeys.length > 0 && (
            <div>
              <p className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-3">
                Revoked / expired
              </p>
              <div className="flex flex-col gap-3">
                {inactiveKeys.map(key => (
                  <APIKeyCard
                    key={key.id}
                    apiKey={key}
                    onRevoked={load}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create API key"
        description="Give your key a name so you can identify it later."
        size="sm"
      >
        <CreateKeyForm
          onCreated={handleCreated}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  )
}
