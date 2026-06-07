"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function Navbar() {
  const router     = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 pt-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1,  y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <nav
        style={{
          maxWidth:     960,
          width:        "100%",
          height:       46,
          borderRadius: 12,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "space-between",
          padding:      "0 14px",
          transition:   "all 0.3s",
          border:       scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
          background:   scrolled ? "rgba(8,11,16,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
        }}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Beacon</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {[
            { label: "Features", href: "#features" },
            { label: "Docs",     href: "https://github.com/beacon", external: true },
            { label: "GitHub",   href: "https://github.com/beacon", external: true },
          ].map(link =>
            link.external ? (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                style={{ padding: "5px 10px", fontSize: 13, color: "rgba(255,255,255,0.5)", borderRadius: 7, transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >
                {link.label}
              </a>
            ) : (
              <a key={link.label} href={link.href}
                style={{ padding: "5px 10px", fontSize: 13, color: "rgba(255,255,255,0.5)", borderRadius: 7, transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >
                {link.label}
              </a>
            )
          )}
        </div>

        <button
          onClick={() => router.push("/login")}
          style={{
            height:       32,
            padding:      "0 14px",
            fontSize:     12,
            fontWeight:   500,
            borderRadius: 8,
            background:   "#3B82F6",
            color:        "white",
            transition:   "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#2563EB"}
          onMouseLeave={e => e.currentTarget.style.background = "#3B82F6"}
        >
          Get started
        </button>
      </nav>
    </motion.header>
  )
}