"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { auth } from "@/lib/api/index.js"

const NAV_ITEMS = [
  {
    label: "Overview",
    href:  "/dashboard",
    icon:  IconGrid,
    exact: true,
  },
  {
    label: "Monitors",
    href:  "/dashboard/monitors",
    icon:  IconPulse,
  },
  {
    label: "Incidents",
    href:  "/dashboard/incidents",
    icon:  IconAlert,
  },
  {
    label: "Status Pages",
    href:  "/dashboard/status-pages",
    icon:  IconGlobe,
  },
  {
    label: "API Keys",
    href:  "/dashboard/api-keys",
    icon:  IconKey,
  },
]

export default function DashboardSidebar({ user }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await auth.logout()
    } finally {
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col border-r border-beacon-border"
      style={{ background: "var(--color-bg-elevated)" }}
    >
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-beacon-border">
        <BeaconMark />
        <span className="text-sm font-semibold text-beacon-text tracking-tight">
          Beacon
        </span>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5" aria-label="Dashboard navigation">
        {NAV_ITEMS.map(item => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <NavItem
              key={item.href}
              item={item}
              active={active}
              onClick={() => router.push(item.href)}
            />
          )
        })}
      </nav>

      <div className="px-2 py-3 border-t border-beacon-border">
        <div className="px-2 py-1.5 mb-1">
          <p className="text-xs font-medium text-beacon-text truncate">
            {user.username}
          </p>
          {user.email && (
            <p className="text-xs text-beacon-text-faint truncate">
              {user.email}
            </p>
          )}
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={[
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md",
            "text-xs text-beacon-text-muted",
            "hover:bg-white/[0.06] hover:text-beacon-text",
            "transition-colors duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          <IconLogout className="h-3.5 w-3.5 flex-shrink-0" />
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  )
}

function NavItem({ item, active, onClick }) {
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      className={[
        "relative w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md",
        "text-sm transition-colors duration-150 text-left",
        active
          ? "text-beacon-text bg-white/[0.08]"
          : "text-beacon-text-muted hover:text-beacon-text hover:bg-white/[0.04]",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <motion.span
          layoutId="nav-indicator"
          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-beacon-blue"
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          aria-hidden="true"
        />
      )}
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      {item.label}
    </button>
  )
}

function BeaconMark() {
  return (
    <div className="h-6 w-6 rounded-md bg-beacon-blue flex items-center justify-center flex-shrink-0">
      <div className="h-2 w-2 rounded-full bg-white" />
    </div>
  )
}

function IconGrid({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  )
}

function IconPulse({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="1,8 4,8 5.5,3 7.5,13 9.5,6 11,8 15,8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconAlert({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" strokeLinejoin="round" />
      <line x1="8" y1="6" x2="8" y2="9.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" strokeWidth="0" />
    </svg>
  )
}

function IconGlobe({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8s-2.5 6.5-2.5 6.5" strokeLinecap="round" />
      <line x1="1.5" y1="8" x2="14.5" y2="8" strokeLinecap="round" />
      <line x1="2.5" y1="5" x2="13.5" y2="5" strokeLinecap="round" />
      <line x1="2.5" y1="11" x2="13.5" y2="11" strokeLinecap="round" />
    </svg>
  )
}

function IconKey({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="5.5" cy="7.5" r="3.5" />
      <path d="M8.5 7.5H15M12.5 7.5V10" strokeLinecap="round" />
    </svg>
  )
}

function IconLogout({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2H2.5A1 1 0 001.5 3v10a1 1 0 001 1H6" strokeLinecap="round" />
      <path d="M10.5 11L14 8l-3.5-3M14 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}