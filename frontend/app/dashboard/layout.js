import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardShell from "./DashboardShell"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function getUser(sessionId, csrfToken) {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/me/`, {
      headers: { Cookie: `sessionid=${sessionId}; csrftoken=${csrfToken ?? ""}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies()
  const sessionId   = cookieStore.get("sessionid")?.value
  const csrfToken   = cookieStore.get("csrftoken")?.value

  if (!sessionId) redirect("/login")

  const user = await getUser(sessionId, csrfToken)
  if (!user) redirect("/login")

  return <DashboardShell user={user}>{children}</DashboardShell>
}