const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1"

function getCookie(name: string) {
  return document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))?.split("=")[1]
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? "GET"
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
  return response.status === 204 ? (undefined as T) : response.json()
}
