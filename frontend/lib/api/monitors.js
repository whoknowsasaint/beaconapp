import { client } from "./client.js"

function buildQuery(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.append(k, v)
  })
  const str = q.toString()
  return str ? `?${str}` : ""
}

export const monitors = {
  list(params = {}) {
    return client.get(`/api/v1/monitors/${buildQuery(params)}`)
  },

  create(data) {
    return client.post("/api/v1/monitors/", data)
  },

  get(id) {
    return client.get(`/api/v1/monitors/${id}/`)
  },

  update(id, data) {
    return client.patch(`/api/v1/monitors/${id}/`, data)
  },

  delete(id) {
    return client.delete(`/api/v1/monitors/${id}/`)
  },

  checks(id, params = {}) {
    return client.get(`/api/v1/monitors/${id}/checks/${buildQuery(params)}`)
  },
}