import { client } from "./client.js"

function buildQuery(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.append(k, v)
  })
  const str = q.toString()
  return str ? `?${str}` : ""
}

export const statusPages = {
  list(params = {}) {
    return client.get(`/api/v1/status-pages/${buildQuery(params)}`)
  },

  create(data) {
    return client.post("/api/v1/status-pages/", data)
  },

  get(slug) {
    return client.get(`/api/v1/status-pages/${slug}/`)
  },

  update(slug, data) {
    return client.patch(`/api/v1/status-pages/${slug}/`, data)
  },

  delete(slug) {
    return client.delete(`/api/v1/status-pages/${slug}/`)
  },

  addMonitor(slug, data) {
    return client.post(`/api/v1/status-pages/${slug}/monitors/`, data)
  },

  removeMonitor(slug, entryId) {
    return client.delete(`/api/v1/status-pages/${slug}/monitors/${entryId}/`)
  },

  getPublic(slug) {
    return client.get(`/api/v1/status-pages/${slug}/public/`)
  },

  subscribe(slug, data) {
    return client.post(`/api/v1/status-pages/${slug}/subscribe/`, data)
  },

  unsubscribe(slug, token) {
    return client.post(
      `/api/v1/status-pages/${slug}/unsubscribe/${token}/`,
      {},
    )
  },
}