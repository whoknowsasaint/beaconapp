"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBreakpoint } from "@/lib/useBreakpoint"
import Sidebar from "./Sidebar"
import MobileBottomNav from "@/components/dashboard/MobileBottomNav"
import SessionGuard from "@/components/SessionGuard"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default function DashboardShell({ children }) {
  const { isMobile, mounted } = useBreakpoint()
  const router = useRouter()

  const [user,    setUser]    = useState(null)
  const [authState, setAuthState] = useState("checking") 

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/me/`, {
          credentials: "include",
          cache:       "no-store",
        })

        if (cancelled) return

        if (!res.ok) {
          setAuthState("denied")
          router.replace("/login")
          return
        }

        const data = await res.json()
        setUser(data)
        setAuthState("authed")
      } catch {
        if (cancelled) return
        setAuthState("denied")
        router.replace("/login")
      }
    }

    checkAuth()
    return () => { cancelled = true }
  }, [router])

  if (authState === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080B10" }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "2px solid rgba(59,130,246,0.15)",
            borderTopColor: "#3B82F6",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (authState === "denied") {
   
    return null
  }

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