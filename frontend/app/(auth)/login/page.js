"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { auth } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import GlassPanel from "@/components/scenes/shared/GlassPanel"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { panelVariants } from "@/lib/motion"
import { useBackendWarmup } from "@/lib/useBackendWarmup"

function BeaconMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect width="28" height="28" rx="7" fill="#1D4ED8"/>
      <circle cx="10" cy="18" r="2.2" fill="white"/>
      <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
      <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25"/>
    </svg>
  )
}

function WarmupNotice({ status, elapsed, retry, router }) {
  const seconds = Math.floor(elapsed / 1000)

  return (
    <motion.div
      key="warmup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center text-center py-4"
    >
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 mb-7 hover:opacity-80 transition-opacity cursor-pointer bg-none border-none"
      >
        <BeaconMark />
        <span className="text-sm font-semibold text-beacon-text tracking-tight">
          Beacon
        </span>
      </button>

      {status === "failed" ? (
        <>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
              <path d="M10 6v5M10 14h.01" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="7.5"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-beacon-text mb-1">
            Couldn&apos;t reach the server
          </p>
          <p className="text-xs text-beacon-text-muted mb-5 max-w-[260px]">
            The backend may still be starting up, or is temporarily unreachable. This can happen on the free hosting tier after a period of inactivity.
          </p>
          <Button variant="secondary" size="sm" onClick={retry}>
            Try again
          </Button>
        </>
      ) : (
        <>
          <div className="relative w-10 h-10 mb-4">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid rgba(59,130,246,0.15)" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid transparent", borderTopColor: "#3B82F6" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-sm font-medium text-beacon-text mb-1">
            {status === "checking" ? "Connecting..." : "Waking up the server..."}
          </p>
          <p className="text-xs text-beacon-text-muted max-w-[260px]">
            {status === "checking"
              ? "Checking the connection to your Beacon instance."
              : "This instance runs on a free tier that sleeps when idle. It usually takes under a minute to come back online."}
          </p>
          {seconds > 5 && (
            <p className="text-2xs text-beacon-text-faint mt-3 font-mono">
              {seconds}s elapsed
            </p>
          )}
        </>
      )}
    </motion.div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { status: backendStatus, elapsed, retry } = useBackendWarmup()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [fields,   setFields]   = useState({})

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFields({})

    try {
      await auth.login(username, password)
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      if (isBeaconAPIError(err)) {
        setError(err.message)
        setFields(err.fields ?? {})
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const backendReady = backendStatus === "warm"

  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-sm"
    >
      <GlassPanel
        glow="#3B82F6"
        glowOpacity={0.10}
        glowSize={400}
        className="p-8"
      >
        <AnimatePresence mode="wait">
          {!backendReady ? (
            <WarmupNotice
              status={backendStatus}
              elapsed={elapsed}
              retry={retry}
              router={router}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity cursor-pointer bg-none border-none"
                >
                  <BeaconMark />
                  <span className="text-sm font-semibold text-beacon-text tracking-tight">
                    Beacon
                  </span>
                </button>

                <h1 className="text-lg font-semibold text-beacon-text mb-1">
                  Sign in
                </h1>
                <p className="text-sm text-beacon-text-muted">
                  Enter your credentials to access the dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <Input
                  label="Username"
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  error={fields.username}
                  disabled={loading}
                />

                <Input
                  label="Password"
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  error={fields.password}
                  disabled={loading}
                />

                {error && !fields.username && !fields.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-beacon-red bg-beacon-red/10 border border-beacon-red/20 rounded-lg px-3 py-2"
                    role="alert"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  disabled={!username || !password}
                  className="w-full mt-1"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-beacon-text-faint">
                Self-hosted Beacon instance.{" "}
                <a
                  href="https://github.com/whoknowsasaint/beaconapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-beacon-text-muted hover:text-beacon-text transition-colors"
                >
                  Learn more
                </a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassPanel>
    </motion.div>
  )
}