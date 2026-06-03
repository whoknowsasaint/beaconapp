"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

const NAV_LINKS = [
  { label: "Features",  href: "#features"  },
  { label: "Docs",      href: "https://github.com/beacon", external: true },
  { label: "GitHub",    href: "https://github.com/beacon", external: true },
]

function BeaconLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-lg bg-beacon-blue flex items-center justify-center flex-shrink-0">
        <div className="h-2 w-2 rounded-full bg-white" />
      </div>
      <span className="text-sm font-semibold text-beacon-text tracking-tight">
        Beacon
      </span>
    </div>
  )
}

export default function Navbar() {
  const router    = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 pt-3"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <nav
        className={[
          "w-full max-w-5xl flex items-center justify-between",
          "h-12 px-4 rounded-xl border transition-all duration-300",
          scrolled
            ? "glass-panel border-beacon-border"
            : "border-transparent bg-transparent",
        ].join(" ")}
        aria-label="Main navigation"
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beacon-blue rounded-lg"
          aria-label="Beacon home"
        >
          <BeaconLogo />
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-beacon-text-muted hover:text-beacon-text transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                {link.label}
              </a>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 text-sm text-beacon-text-muted hover:text-beacon-text transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                {link.label}
              </a>
            )
          ))}
        </div>

        <button
          onClick={() => router.push("/login")}
          className={[
            "h-8 px-4 text-sm font-medium rounded-lg transition-colors duration-150",
            "bg-beacon-blue text-white",
            "hover:bg-blue-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beacon-blue",
          ].join(" ")}
        >
          Get started
        </button>
      </nav>
    </motion.header>
  )
}