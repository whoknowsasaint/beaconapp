import { parseAPIError } from "./errors.js"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getCookie(name) {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  )
  return match ? decodeURIComponent(match[1]) : null
}

async function ensureCSRF() {
  if (getCookie("csrftoken")) return
  await fetch(`${BASE_URL}/api/v1/auth/csrf/`, {
    method:      "GET",
    credentials: "include",
  })
}

async function request(method, path, body, options = {}) {
  const isMutating = ["POST", "PATCH", "PUT", "DELETE"].includes(method)

  if (isMutating) {
    await ensureCSRF()
  }

  const headers = {
    "Content-Type": "application/json",
    "Accept":       "application/json",
    ...(options.headers ?? {}),
  }

  if (isMutating) {
    const csrf = getCookie("csrftoken")
    if (csrf) headers["X-CSRFToken"] = csrf
  }

  const init = {
    method,
    headers,
    credentials: "include",
  }

  if (body !== undefined && body !== null) {
    init.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, init)

  if (response.status === 204) {
    return null
  }

  let data
  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw parseAPIError(null, response.status)
    }
    return null
  }

  if (!response.ok) {
    throw parseAPIError(data, response.status)
  }

  return data
}

export const client = {
  get:    (path, options)       => request("GET",    path, null, options),
  post:   (path, body, options) => request("POST",   path, body, options),
  patch:  (path, body, options) => request("PATCH",  path, body, options),
  delete: (path, options)       => request("DELETE", path, null, options),
}