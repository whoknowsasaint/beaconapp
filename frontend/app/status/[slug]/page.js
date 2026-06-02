import { notFound } from "next/navigation"
import PublicStatusPage from "@/components/status-pages/PublicStatusPage"

export const revalidate = 30

async function getPage(slug) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const res = await fetch(
    `${apiUrl}/api/v1/status-pages/${slug}/public/`,
    {
      next: { revalidate: 30 },
    }
  )

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch status page: ${res.status}`)

  return res.json()
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const page     = await getPage(slug)

  if (!page) {
    return { title: "Status Page Not Found" }
  }

  return {
    title:       `${page.name} -- Status`,
    description: page.description || `Current status of ${page.name} services.`,
  }
}

export default async function PublicStatusPageRoute({ params }) {
  const { slug } = await params
  const page     = await getPage(slug)

  if (!page) notFound()

  return <PublicStatusPage page={page} />
}