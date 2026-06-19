"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"

const SPRING_PANEL = { type: "spring", stiffness: 360, damping: 34, mass: 0.85 }
const SPRING_ITEM   = { type: "spring", stiffness: 420, damping: 34 }

const LINKS = [
  {
    label: "Features",
    href:  "/#features",
    desc:  "What Beacon can do",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="#60A5FA" strokeWidth="1.6" style={{ width: 17, height: 17 }}>
        <path d="M10 2l2.5 5.5L18 9l-5 4 1.2 6.5L10 16l-4.2 3.5L7 13 2 9l5.5-1.5L10 2z" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    ),
    tint: "rgba(59,130,246,0.16)",
  },
  {
    label: "Docs",
    href:  "/docs",
    desc:  "Guides & API reference",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="#34D399" strokeWidth="1.6" style={{ width: 17, height: 17 }}>
        <path d="M4 3.5C4 2.67 4.67 2 5.5 2H13l3 3v11.5c0 .83-.67 1.5-1.5 1.5h-9C4.67 18 4 17.33 4 16.5v-13z" strokeLinejoin="round"/>
        <path d="M13 2v3h3M7 9h6M7 12h6M7 15h3" strokeLinecap="round"/>
      </svg>
    ),
    tint: "rgba(52,211,153,0.16)",
  },
  {
    label: "GitHub",
    href:  "https://github.com/whoknowsasaint/beaconapp",
    desc:  "Star the repository",
    external: true,
    icon: (
      <svg viewBox="0 0 16 16" fill="#E5E7EB" style={{ width: 16, height: 16 }}>
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
      </svg>
    ),
    tint: "rgba(229,231,235,0.1)",
  },
]

export default function MobileNav() {
  const [open, setOpen]   = useState(false)
  const router            = useRouter()
  const pathname           = usePathname()

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  function navigate(href, external) {
    setOpen(false)
    setTimeout(() => {
      if (external) window.open(href, "_blank", "noreferrer")
      else router.push(href)
    }, 240)
  }

  return (
    <>
      {/* Hamburger — morphs into X (hidden when open) */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        style={{
          width: 44, height: 44,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0,
          flexShrink: 0, position: "relative", zIndex: 70,
          opacity: open ? 0 : 1,
          pointerEvents: open ? "none" : "auto",
          transition: "opacity 0.15s",
        }}
      >
        <span style={{ display: "block", width: 20, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.88)" }} />
        <span style={{ display: "block", width: 20, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.88)" }} />
        <span style={{ display: "block", width: 20, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.88)" }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — darkens and blurs everything behind */}
            <motion.div
              key="recede"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 50,
                background: "rgba(2,3,6,0.72)",
                backdropFilter: "blur(44px) saturate(120%)",
                WebkitBackdropFilter: "blur(44px) saturate(120%)",
              }}
            />

            {/* The panel — fixed background, uniform opacity */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -16, scale: 0.93 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{    opacity: 0, y: -12, scale: 0.94 }}
              transition={SPRING_PANEL}
              style={{
                position: "fixed", top: 16, left: 12, right: 12, zIndex: 60,
                borderRadius: 28,
                overflow: "hidden",
                // Flat, uniform base – no gradient opacity falloff
                background: "rgba(14,15,20,0.94)",
                backdropFilter:       "blur(56px) saturate(200%)",
                WebkitBackdropFilter: "blur(56px) saturate(200%)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: [
                  "0 36px 90px rgba(0,0,0,0.6)",
                  "0 8px 24px rgba(0,0,0,0.4)",
                  "inset 0 1.5px 0 rgba(255,255,255,0.2)",
                  "inset 0 0 0 1px rgba(255,255,255,0.03)",
                ].join(", "),
              }}
            >
              {/* Decorative diagonal tint – sits on top of opaque base, never weakens coverage */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
                background: "linear-gradient(155deg, rgba(80,84,100,0.35) 0%, transparent 50%)",
              }} />

              {/* Sheen – light catching the top-left of the glass */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
                background: "radial-gradient(110% 55% at 12% -8%, rgba(255,255,255,0.13) 0%, transparent 55%)",
              }} />

              {/* Top bar — context label + close control */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 16px 12px", position: "relative", zIndex: 1,
              }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Menu
                </span>
                <motion.button
                  onClick={() => setOpen(false)}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: 30, height: 30, borderRadius: 9,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" style={{ width: 11, height: 11 }}>
                    <path d="M1 1l12 12M13 1L1 13" strokeLinecap="round"/>
                  </svg>
                </motion.button>
              </div>

              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)", margin: "0 16px" }} />

              {/* Nav rows */}
              <nav style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 1, position: "relative", zIndex: 1 }}>
                {LINKS.map((link, i) => (
                  <motion.button
                    key={link.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{    opacity: 0, x: -6 }}
                    transition={{ duration: 0.24, delay: open ? 0.12 + i * 0.05 : 0, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => navigate(link.href, link.external)}
                    whileTap={{ scale: 0.975 }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 13,
                      padding: "12px 12px", borderRadius: 16,
                      background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: link.tint,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      {link.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14.5, fontWeight: 600, color: "rgba(255,255,255,0.94)", margin: 0, letterSpacing: "-0.005em" }}>
                        {link.label}
                      </p>
                      <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", margin: 0, marginTop: 1 }}>
                        {link.desc}
                      </p>
                    </div>
                    {link.external ? (
                      <svg viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1.6" style={{ width: 11, height: 11, flexShrink: 0 }}>
                        <path d="M2 10L10 2M5 2h5v5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="1.6" style={{ width: 9, height: 9, flexShrink: 0 }}>
                        <path d="M3 1l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </motion.button>
                ))}
              </nav>

              {/* CTA – its own elevated card */}
              <div style={{ padding: "10px 14px calc(16px + env(safe-area-inset-bottom))", position: "relative", zIndex: 1 }}>
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.12 + LINKS.length * 0.05 + 0.04 }}
                  onClick={() => navigate("/login", false)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%", height: 48, borderRadius: 15,
                    background: "linear-gradient(135deg, #4A8DFF 0%, #2563EB 100%)",
                    color: "white", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer",
                    letterSpacing: "-0.01em",
                    boxShadow: "0 10px 28px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.28)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}
                >
                  Get started
                  <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" style={{ width: 11, height: 11 }}>
                    <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
                <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 11, letterSpacing: "0.01em" }}>
                  Free · Open source · Self‑hostable
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}