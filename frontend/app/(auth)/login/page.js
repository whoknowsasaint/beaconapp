"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { auth } from "@/lib/api/index.js"
import { isBeaconAPIError } from "@/lib/api/index.js"
import GlassPanel from "@/components/scenes/shared/GlassPanel"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { panelVariants } from "@/lib/motion"

export default function LoginPage() {
  const router = useRouter()

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
      </GlassPanel>
    </motion.div>
  )
}

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