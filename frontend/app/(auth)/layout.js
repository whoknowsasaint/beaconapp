import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Login",
}

export default async function AuthLayout({ children }) {
  const cookieStore = await cookies()
  const session     = cookieStore.get("sessionid")

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {children}
    </div>
  )
}