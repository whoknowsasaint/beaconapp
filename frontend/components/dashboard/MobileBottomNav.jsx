"use client"

import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"

const TABS = [
  {
    id:    "overview",
    label: "Overview",
    href:  "/dashboard",
    icon:  (active) => (
      <svg viewBox="0 0 20 20" fill={active ? "#3B82F6" : "rgba(255,255,255,0.4)"} style={{ width: 20, height: 20 }}>
        <path d="M2 4a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm9 0a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V4zM2 13a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3zm9 0a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3z"/>
      </svg>
    ),
  },
  {
    id:    "monitors",
    label: "Monitors",
    href:  "/dashboard/monitors",
    icon:  (active) => (
      <svg viewBox="0 0 20 20" fill="none" style={{ width: 20, height: 20 }}>
        <path d="M2 10h2l2-6 3 12 2-9 1.5 3H18" stroke={active ? "#3B82F6" : "rgba(255,255,255,0.4)"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id:    "incidents",
    label: "Incidents",
    href:  "/dashboard/incidents",
    icon:  (active) => (
      <svg viewBox="0 0 20 20" fill={active ? "#3B82F6" : "rgba(255,255,255,0.4)"} style={{ width: 20, height: 20 }}>
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-3a1 1 0 00-1 1v-2a1 1 0 102 0V11a1 1 0 00-1-1z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    id:    "status-pages",
    label: "Status",
    href:  "/dashboard/status-pages",
    icon:  (active) => (
      <svg viewBox="0 0 20 20" fill={active ? "#3B82F6" : "rgba(255,255,255,0.4)"} style={{ width: 20, height: 20 }}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    id:    "api-keys",
    label: "API",
    href:  "/dashboard/api-keys",
    icon:  (active) => (
      <svg viewBox="0 0 20 20" fill={active ? "#3B82F6" : "rgba(255,255,255,0.4)"} style={{ width: 20, height: 20 }}>
        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
      </svg>
    ),
  },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  function getActiveId() {
    if (pathname === "/dashboard")                      return "overview"
    if (pathname.startsWith("/dashboard/monitors"))     return "monitors"
    if (pathname.startsWith("/dashboard/incidents"))    return "incidents"
    if (pathname.startsWith("/dashboard/status-pages")) return "status-pages"
    if (pathname.startsWith("/dashboard/api-keys"))     return "api-keys"
    return "overview"
  }

  const activeId = getActiveId()

  return (
    <nav
      style={{
        position:        "fixed",
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          40,
        height:          56,
        paddingBottom:   "env(safe-area-inset-bottom)",
        background:      "rgba(8,11,16,0.96)",
        backdropFilter:  "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop:       "1px solid rgba(255,255,255,0.08)",
        display:         "flex",
        alignItems:      "stretch",
        boxShadow:       "0 -8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {TABS.map(tab => {
        const isActive = tab.id === activeId
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.href)}
            style={{
              flex:           1,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              gap:            3,
              background:     "none",
              border:         "none",
              cursor:         "pointer",
              padding:        "6px 0",
              position:       "relative",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {/* Active indicator dot that slides */}
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                style={{
                  position:     "absolute",
                  top:          0,
                  left:         "50%",
                  transform:    "translateX(-50%)",
                  width:        24,
                  height:       2,
                  borderRadius: "0 0 2px 2px",
                  background:   "#3B82F6",
                }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}

            {/* Icon */}
            <motion.div
              animate={isActive
                ? { scale: 1, y: 0 }
                : { scale: 0.9, y: 0 }
              }
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              {tab.icon(isActive)}
            </motion.div>

            {/* Label */}
            <span style={{
              fontSize:   9.5,
              fontWeight: isActive ? 600 : 400,
              color:      isActive ? "#3B82F6" : "rgba(255,255,255,0.35)",
              letterSpacing: "0.02em",
              lineHeight: 1,
              transition: "color 0.15s",
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}