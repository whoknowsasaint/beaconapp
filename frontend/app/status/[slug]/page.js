import { notFound } from "next/navigation"
import LiveStatusPage from "@/components/status-pages/LiveStatusPage"

export const revalidate = 30

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function getPage(slug) {
  const res = await fetch(
    `${API_URL}/api/v1/status-pages/${slug}/public/`,
    { next: { revalidate: 30 } }
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch status page: ${res.status}`)
  return res.json()
}

async function getPublicUptime(slug) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/status-pages/${slug}/uptime/?days=90`,
      { next: { revalidate: 30 } }
    )
    if (!res.ok) return {}
    const data = await res.json()
    const map  = {}
    for (const mon of data.monitors ?? []) {
      map[mon.id] = mon.buckets ?? []
    }
    return map
  } catch {
    return {}
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const page     = await getPage(slug)
  if (!page) return { title: "Status Page Not Found" }
  return {
    title:       `${page.name} — Status`,
    description: page.description || `Current status of ${page.name} services.`,
  }
}

export default async function PublicStatusPageRoute({ params }) {
  const { slug } = await params
  const page     = await getPage(slug)
  if (!page) notFound()

  const uptimeMap          = await getPublicUptime(slug)
  const monitorsWithUptime = (page.monitors ?? []).map(monitor => ({
    ...monitor,
    uptime_buckets: monitor.show_uptime_history ? (uptimeMap[monitor.id] ?? []) : [],
  }))

  return <LiveStatusPage initialPage={{ ...page, monitors: monitorsWithUptime }} slug={slug} />
}