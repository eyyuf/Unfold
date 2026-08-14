const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
let csrfReady: Promise<unknown> | null = null

function getCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? 'GET'
  if (method !== 'GET' && !getCookie('csrftoken') && path !== '/auth/csrf/') {
    csrfReady ??= apiRequest('/auth/csrf/')
    await csrfReady
  }
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(method !== 'GET'
          ? { 'X-CSRFToken': decodeURIComponent(getCookie('csrftoken') ?? '') }
          : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new Error(
      navigator.onLine
        ? 'The service could not be reached. Please try again.'
        : 'You appear to be offline. Your progress is still on this device.',
    )
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const firstError =
      payload && typeof payload === 'object'
        ? Object.values(payload)
            .flat()
            .find((value) => typeof value === 'string')
        : null
    throw new Error(
      payload?.detail ?? firstError ?? 'The request could not be completed. Please try again.',
    )
  }
  if (response.status === 204) return undefined as T
  const body = await response.text()
  return body ? (JSON.parse(body) as T) : (undefined as T)
}
