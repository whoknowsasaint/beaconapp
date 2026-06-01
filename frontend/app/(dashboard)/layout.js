import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardSidebar from "./Sidebar"

export const metadata = {
  title: {
    default: "Dashboard",
    template: "%s -- Beacon",
  },
}

async function getCurrentUser() {
  const cookieStore = await cookies()
  const session     = cookieStore.get("sessionid")

  if (!session) return null

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/me/`, {
      headers: {
        Cookie: cookieStore.toString(),
      },
      cache: "no-store",
    })

    if (!response.ok) return null

    return await response.json()
  } catch {
    return null
  }
}

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}