import { client } from "./client.js"

function buildQuery(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.append(k, v)
  })
  const str = q.toString()
  return str ? `?${str}` : ""
}

export const uptime = {
  get(monitorId, days = 90) {
    return client.get(
      `/api/v1/monitors/${monitorId}/uptime/${buildQuery({ days })}`
    )
  },

  getPublic(monitorId, days = 90) {
    return fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}`
      + `/api/v1/monitors/${monitorId}/uptime/${buildQuery({ days })}`,
      { cache: "no-store" }
    ).then(r => r.ok ? r.json() : null)
  },
}