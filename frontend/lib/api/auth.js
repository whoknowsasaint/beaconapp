import { client } from "./client.js"

export const auth = {
  async csrf() {
    return client.get("/api/v1/auth/csrf/")
  },

  async login(username, password) {
    return client.post("/api/v1/auth/login/", { username, password })
  },

  async logout() {
    return client.post("/api/v1/auth/logout/", {})
  },

  async me() {
    return client.get("/api/v1/auth/me/")
  },
}