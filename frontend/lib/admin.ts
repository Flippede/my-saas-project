import { buildApiUrl, getStoredToken, jsonHeaders } from "@/lib/app-config"

type AdminMeResponse = {
  is_admin?: boolean
}

export async function getAdminMe(): Promise<boolean> {
  const token = getStoredToken()
  if (!token) {
    return false
  }

  try {
    const response = await fetch(buildApiUrl("/api/v1/admin/me"), {
      cache: "no-store",
      headers: jsonHeaders(token),
    })

    if (!response.ok) {
      return false
    }

    const data = (await response.json()) as AdminMeResponse
    return data.is_admin === true
  } catch {
    return false
  }
}
