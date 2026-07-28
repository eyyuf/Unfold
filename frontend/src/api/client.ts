const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1"
let csrfReady: Promise<unknown> | null = null

function getCookie(name: string) {
  return document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))?.split("=")[1]
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? "GET"
  if (method !== "GET" && !getCookie("csrftoken") && path !== "/auth/csrf/") {
    csrfReady ??= apiRequest("/auth/csrf/")
    await csrfReady
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(method !== "GET" ? { "X-CSRFToken": decodeURIComponent(getCookie("csrftoken") ?? "") } : {}),
      ...init.headers,
    },
  })
  if (!response.ok) {
    throw new Error((await response.json().catch(() => null))?.detail ?? "Request failed")
  }
  if (response.status === 204) return undefined as T
  const body = await response.text()
  return body ? JSON.parse(body) as T : undefined as T
}
