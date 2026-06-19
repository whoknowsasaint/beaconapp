"use client"

import { useBreakpoint } from "@/lib/useBreakpoint"
import Sidebar from "./Sidebar"
import MobileBottomNav from "@/components/dashboard/MobileBottomNav"
import SessionGuard from "@/components/SessionGuard"

export default function DashboardShell({ children, user }) {
  const { isMobile, mounted } = useBreakpoint()

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080B10" }}>
      <SessionGuard />

      {/* Sidebar — desktop only */}
      {(!mounted || !isMobile) && <Sidebar user={user} />}

      {/* Main content */}
      <div
        style={{
          flex:           1,
          minWidth:       0,
          paddingBottom:  mounted && isMobile ? "calc(56px + env(safe-area-inset-bottom))" : 0,
          overflowX:      "hidden",
        }}
      >
        {children}
      </div>

      {/* Bottom nav — mobile only */}
      {mounted && isMobile && <MobileBottomNav />}
    </div>
  )
}