"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SessionGuard() {
  const router = useRouter()

  useEffect(() => {
   
    const id = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/auth/me/`,
          { credentials: "include", cache: "no-store" }
        )
        if (res.status === 401 || res.status === 403) {
          router.push("/login")
        }
      } catch {
        
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(id)
  }, [router])

  return null  
}