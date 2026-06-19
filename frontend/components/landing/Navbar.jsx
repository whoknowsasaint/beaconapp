"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useBreakpoint } from "@/lib/useBreakpoint"
import MobileNav from "@/components/ui/MobileNav"

function BeaconLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="#1D4ED8"/>
        <circle cx="10" cy="18" r="2.2" fill="white"/>
        <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
        <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
        <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25"/>
      </svg>
      <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>
        Beacon
      </span>
    </div>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const router                   = useRouter()
  const { isMobile, mounted }    = useBreakpoint()



  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const NAV_LINKS = [
    { label: "Features", href: "/#features" },
    { label: "Docs",     href: "/docs"       },
    { label: "GitHub",   href: "https://github.com/whoknowsasaint/beaconapp", external: true },
  ]

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position:       "fixed",
        top:            16,
        left:           "0",
        right: 0,
        margin: "0 auto",
        width: "fit-content",
        transform:      "translateX(-50%)",
        zIndex:         50,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            32,
        padding:        mounted && isMobile ? "10px 16px" : "10px 18px",
        borderRadius:   "9999px",
        border:         scrolled ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.07)",
        background:     scrolled ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.35)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition:     "all 0.3s",
        width:          mounted && isMobile ? "calc(100% - 32px)" : "auto",
        maxWidth:       mounted && isMobile ? 480 : "none",
        boxSizing:      "border-box",
      }}
    >
      <button
        onClick={() => router.push("/")}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <BeaconLogo />
      </button>

      {/* Desktop nav links */}
      {(!mounted || !isMobile) && (
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.9)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Desktop CTA */}
      {(!mounted || !isMobile) && (
        <button
          onClick={() => router.push("/login")}
          style={{
            height:       34,
            padding:      "0 16px",
            borderRadius: "9999px",
            background:   "#2563EB",
            color:        "white",
            fontSize:     13,
            fontWeight:   600,
            border:       "none",
            cursor:       "pointer",
            letterSpacing:"-0.01em",
            transition:   "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#1D4ED8"}
          onMouseLeave={e => e.currentTarget.style.background = "#2563EB"}
        >
          Get started
        </button>
      )}

      {/* Mobile hamburger */}
      {mounted && isMobile && <MobileNav />}
    </motion.header>
  )
}