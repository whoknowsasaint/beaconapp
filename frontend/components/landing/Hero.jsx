"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

const BADGE_TEXT = "Open source · Self-hostable · Free"

const STATS = [
  { value: "90 days",  label: "Uptime history"  },
  { value: "30s",      label: "Check interval"  },
  { value: "Telegram", label: "Notifications"   },
  { value: "∞",        label: "Status pages"    },
]

export default function Hero() {
  const router = useRouter()

  return (
    <section className="relative flex flex-col items-center text-center px-6 pt-40 pb-24 overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.18), transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-6 max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-beacon-border bg-white/[0.04] text-xs text-beacon-text-muted">
          <span
            className="h-1.5 w-1.5 rounded-full bg-beacon-green animate-pulse-soft"
            aria-hidden="true"
          />
          {BADGE_TEXT}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-beacon-text tracking-tight leading-tight">
          Status pages that{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)",
            }}
          >
            build trust
          </span>
        </h1>

        <p className="text-lg text-beacon-text-muted max-w-xl leading-relaxed">
          Monitor your services, manage incidents, and keep your users informed.
          Free, open source, and fully self-hostable.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => router.push("/login")}
            className={[
              "h-11 px-6 text-sm font-medium rounded-xl",
              "bg-beacon-blue text-white",
              "hover:bg-blue-500 transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beacon-blue",
            ].join(" ")}
          >
            Get started free
          </button>

          <a
            href="https://github.com/beacon"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              "h-11 px-6 text-sm font-medium rounded-xl inline-flex items-center gap-2",
              "border border-beacon-border text-beacon-text-muted",
              "hover:bg-white/[0.06] hover:text-beacon-text transition-colors duration-150",
            ].join(" ")}
          >
            <GitHubIcon />
            View on GitHub
          </a>
        </div>

        <div className="flex items-center gap-8 mt-4">
          {STATS.map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <span className="text-base font-semibold text-beacon-text">
                {stat.value}
              </span>
              <span className="text-xs text-beacon-text-faint">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}