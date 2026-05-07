export const AUTH_TOKEN_KEY = "xcc_token"
export const USER_ID_KEY = "xcc_user_id"

const configuredApiBase = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "")

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return configuredApiBase ? `${configuredApiBase}${normalizedPath}` : normalizedPath
}

export function jsonHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export function getStoredToken() {
  if (typeof window === "undefined") {
    return ""
  }

  return localStorage.getItem(AUTH_TOKEN_KEY)?.trim() || ""
}

export function storeSession(token: string, userId?: string | number | null) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token)

  if (userId !== undefined && userId !== null && String(userId).trim()) {
    localStorage.setItem(USER_ID_KEY, String(userId))
  }
}

export function clearSession() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
}

export function formatAmount(amount?: string) {
  const value = Number(amount)

  if (!Number.isFinite(value)) {
    return amount || "--"
  }

  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
