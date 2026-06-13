import { buildApiUrl, jsonHeaders } from "@/lib/app-config"

export type GameSubmissionPayload = {
  game_name?: string
  game_type?: string
  art_style?: string
  protagonist?: string
  enemy_boss?: string
  scene_setting?: string
  core_gameplay?: string
  deliverables?: string[]
  budget_range?: string
  contact?: string
  notes?: string
}

export type GameSubmission = {
  id: number
  user_id?: number | null
  game_name: string
  game_type: string
  art_style: string
  protagonist: string
  enemy_boss: string
  scene_setting: string
  core_gameplay: string
  deliverables: string[]
  budget_range: string
  contact: string
  notes: string
  admin_note: string
  status: string
  created_at: string
  updated_at: string
}

export type CreateGameSubmissionResponse = {
  id: number
  status: string
  user_id?: number | null
  detail?: string
  message?: string
}

type MyGameSubmissionsResponse = {
  items?: GameSubmission[]
  detail?: string
  message?: string
}

type AdminGameSubmissionsResponse = {
  items?: GameSubmission[]
  total?: number
  limit?: number
  offset?: number
  detail?: string
  message?: string
}

async function readJsonResponse<T extends { detail?: string; message?: string }>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T
  } catch {
    return {
      message: `请求失败，HTTP ${response.status}`,
    } as T
  }
}

export async function createGameSubmission(
  payload: GameSubmissionPayload,
  token?: string,
): Promise<CreateGameSubmissionResponse> {
  const response = await fetch(buildApiUrl("/api/v1/game-submissions"), {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  })
  const data = await readJsonResponse<CreateGameSubmissionResponse>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "提交失败，请稍后重试。")
  }

  return data
}

export async function getMyGameSubmissions(token: string): Promise<GameSubmission[]> {
  const response = await fetch(buildApiUrl("/api/v1/my-game-submissions"), {
    cache: "no-store",
    headers: jsonHeaders(token),
  })
  const data = await readJsonResponse<MyGameSubmissionsResponse>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "获取我的需求失败。")
  }

  return Array.isArray(data.items) ? data.items : []
}

export async function getAdminGameSubmissions({
  token,
  status,
  limit = 50,
  offset = 0,
}: {
  token: string
  status?: string
  limit?: number
  offset?: number
}): Promise<AdminGameSubmissionsResponse> {
  const params = new URLSearchParams()
  if (status) {
    params.set("status", status)
  }
  params.set("limit", String(limit))
  params.set("offset", String(offset))

  const response = await fetch(buildApiUrl(`/api/v1/admin/game-submissions?${params.toString()}`), {
    cache: "no-store",
    headers: jsonHeaders(token),
  })
  const data = await readJsonResponse<AdminGameSubmissionsResponse>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "获取需求列表失败。")
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total || 0),
    limit: Number(data.limit || limit),
    offset: Number(data.offset || offset),
  }
}

export async function getAdminGameSubmission(token: string, id: number): Promise<GameSubmission> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/game-submissions/${id}`), {
    cache: "no-store",
    headers: jsonHeaders(token),
  })
  const data = await readJsonResponse<GameSubmission & { detail?: string; message?: string }>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "获取需求详情失败。")
  }

  return data
}

export async function updateAdminGameSubmission({
  token,
  id,
  status,
  admin_note,
}: {
  token: string
  id: number
  status?: string
  admin_note?: string
}): Promise<GameSubmission> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/game-submissions/${id}`), {
    method: "PATCH",
    headers: jsonHeaders(token),
    body: JSON.stringify({
      status,
      admin_note,
    }),
  })
  const data = await readJsonResponse<GameSubmission & { detail?: string; message?: string }>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "更新需求失败。")
  }

  return data
}
