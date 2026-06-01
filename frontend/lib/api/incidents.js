import { client } from "./client.js"

function buildQuery(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.append(k, v)
  })
  const str = q.toString()
  return str ? `?${str}` : ""
}

export const incidents = {
  list(params = {}) {
    return client.get(`/api/v1/incidents/${buildQuery(params)}`)
  },

  create(data) {
    return client.post("/api/v1/incidents/", data)
  },

  get(id) {
    return client.get(`/api/v1/incidents/${id}/`)
  },

  update(id, data) {
    return client.patch(`/api/v1/incidents/${id}/`, data)
  },

  delete(id) {
    return client.delete(`/api/v1/incidents/${id}/`)
  },

  listUpdates(id, params = {}) {
    return client.get(`/api/v1/incidents/${id}/updates/${buildQuery(params)}`)
  },

  postUpdate(id, data) {
    return client.post(`/api/v1/incidents/${id}/updates/`, data)
  },
}