import { client } from "./client.js"

export const apiKeys = {
  list() {
    return client.get("/api/v1/api-keys/")
  },

  create(data) {
    return client.post("/api/v1/api-keys/", data)
  },

  get(id) {
    return client.get(`/api/v1/api-keys/${id}/`)
  },

  revoke(id) {
    return client.delete(`/api/v1/api-keys/${id}/`)
  },
}