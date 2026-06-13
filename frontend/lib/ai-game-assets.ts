import { buildApiUrl, getStoredToken, jsonHeaders } from "@/lib/app-config"

export type AIGameAssetStatus =
  | "pending"
  | "ready_for_generation"
  | "generating"
  | "generated"
  | "uploaded"
  | "failed"
  | "cancelled"

export type AIGameAssetType =
  | "protagonist"
  | "boss"
  | "scene"
  | "ui_screen"
  | "video_storyboard"
  | "sprite_sheet"
  | "pitch_material"
  | "other"

export type AIGameAsset = {
  id: number
  project_id: number
  user_id: number
  asset_type: AIGameAssetType
  title: string
  description: string
  prompt: string
  status: AIGameAssetStatus
  result_url: string
  thumbnail_url: string
  metadata: Record<string, unknown>
  admin_note: string
  created_at: string
  updated_at: string
}

export type AIGameAssetUpdatePayload = Partial<{
  title: string
  description: string
  prompt: string
  status: AIGameAssetStatus
  result_url: string
  thumbnail_url: string
}>

type ApiMessage = {
  detail?: string
  message?: string
}

type AIGameAssetsResponse = ApiMessage & {
  items?: AIGameAsset[]
  created_count?: number
}

async function readJsonResponse<T extends ApiMessage>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T
  } catch {
    return {
      message: `请求失败，HTTP ${response.status}`,
    } as T
  }
}

function resolveToken(token?: string) {
  return token ?? getStoredToken()
}

export async function planAIGameProjectAssets(projectId: number, token?: string): Promise<AIGameAssetsResponse> {
  const response = await fetch(buildApiUrl(`/api/v1/ai-game-projects/${projectId}/plan-assets`), {
    method: "POST",
    headers: jsonHeaders(resolveToken(token)),
  })
  const data = await readJsonResponse<AIGameAssetsResponse>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "生成资产任务失败。")
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    created_count: Number(data.created_count || 0),
  }
}

export async function getAIGameProjectAssets(projectId: number, token?: string): Promise<AIGameAsset[]> {
  const response = await fetch(buildApiUrl(`/api/v1/ai-game-projects/${projectId}/assets`), {
    cache: "no-store",
    headers: jsonHeaders(resolveToken(token)),
  })
  const data = await readJsonResponse<AIGameAssetsResponse>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "获取视觉资产失败。")
  }

  return Array.isArray(data.items) ? data.items : []
}

export async function updateAIGameAsset(
  assetId: number,
  payload: AIGameAssetUpdatePayload,
  token?: string,
): Promise<AIGameAsset> {
  const response = await fetch(buildApiUrl(`/api/v1/ai-game-assets/${assetId}`), {
    method: "PATCH",
    headers: jsonHeaders(resolveToken(token)),
    body: JSON.stringify(payload),
  })
  const data = await readJsonResponse<AIGameAsset & ApiMessage>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "保存视觉资产失败。")
  }

  return data
}
