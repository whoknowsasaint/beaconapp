"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export default function Hero() {
  const router = useRouter()

  return (
    <section className="relative flex flex-col items-center text-center px-6 pt-32 pb-16 overflow-hidden">
      {/* Background — subtle top glow, NOT a big circular blob */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(59,130,246,0.13), transparent 70%)",
        }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-5 max-w-3xl"
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
          style={{
            background: "rgba(255,255,255,0.04)",
            border:     "1px solid rgba(255,255,255,0.08)",
            color:      "rgba(255,255,255,0.5)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
            style={{ background: "#22C55E", animation: "pulse 2s ease-in-out infinite" }}
            aria-hidden="true"
          />
          Open source · Self-hostable · Free
        </div>

        {/* Headline */}
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08]"
          style={{ color: "rgba(255,255,255,0.94)" }}
        >
          Know when something
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #93C5FD 100%)",
            }}
          >
            breaks first.
          </span>
        </h1>

        {/* Sub */}
        <p
          className="text-lg max-w-lg leading-relaxed"
          style={{ color: "rgba(255,255,255,0.48)" }}
        >
          Monitor services, manage incidents, and publish branded status pages.
          The open source alternative to Statuspage.io.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => router.push("/login")}
            className="h-10 px-5 text-sm font-medium rounded-lg transition-colors duration-150"
            style={{ background: "#3B82F6", color: "white" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2563EB")}
            onMouseLeave={e => (e.currentTarget.style.background = "#3B82F6")}
          >
            Start monitoring free
          </button>

          <a
            href="https://github.com/whoknowsasaint/beaconapp"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-5 text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors duration-150"
            style={{
              border:     "1px solid rgba(255,255,255,0.1)",
              color:      "rgba(255,255,255,0.6)",
              background: "transparent",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)"
              e.currentTarget.style.color      = "rgba(255,255,255,0.85)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color      = "rgba(255,255,255,0.6)"
            }}
          >
            <GitHubIcon />
            View on GitHub
          </a>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
          Self-host in 5 minutes · No credit card · MIT license
        </p>
      </motion.div>
    </section>
  )
}