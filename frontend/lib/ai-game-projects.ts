import { buildApiUrl, jsonHeaders } from "@/lib/app-config"

export type AIGameProjectPayload = {
  idea: string
  game_type?: string
  art_style?: string
  target_platform?: string
}

export type AIGameProject = {
  id: number
  user_id: number
  title: string
  one_sentence_idea: string
  game_type: string
  art_style: string
  target_platform: string
  status: string
  created_at: string
  updated_at: string
}

export type GeneratedGameWorld = {
  title: string
  one_sentence_pitch: string
  worldview: string
  core_gameplay: string
  player_fantasy: string
  protagonist: {
    name: string
    identity: string
    appearance: string
    personality: string
    abilities: string[]
  }
  bosses: Array<{
    name: string
    concept: string
    visual_style: string
    mechanics: string[]
  }>
  scenes: Array<{
    name: string
    description: string
    visual_keywords: string[]
    image_prompt: string
  }>
  ui_screens: Array<{
    name: string
    purpose: string
    layout_description: string
    image_prompt: string
  }>
  asset_prompts: {
    character_concept_art: string[]
    environment_concept_art: string[]
    ui_mockups: string[]
    sprite_sheet: string[]
    video_storyboard: string[]
  }
  pitch_deck_outline: string[]
  next_steps: string[]
  source_input?: {
    idea: string
    game_type: string
    art_style: string
    target_platform: string
  }
}

export type AIGameGenerationRun = {
  id: number
  project_id: number
  user_id: number
  input_json: AIGameProjectPayload
  output_json: GeneratedGameWorld | Record<string, never>
  provider: string
  model_name: string
  status: string
  error_message: string
  created_at: string
  updated_at: string
}

type ApiMessage = {
  detail?: string
  message?: string
}

type CreateAIGameProjectResponse = ApiMessage & {
  project?: AIGameProject
  run?: AIGameGenerationRun
  result?: GeneratedGameWorld
}

type AIGameProjectsResponse = ApiMessage & {
  items?: AIGameProject[]
}

export type AIGameProjectDetail = ApiMessage & {
  project?: AIGameProject
  latest_run?: AIGameGenerationRun | null
  generation_result?: GeneratedGameWorld | null
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

function ensureProject(data: CreateAIGameProjectResponse): { project: AIGameProject; run?: AIGameGenerationRun; result: GeneratedGameWorld } {
  if (!data.project || !data.result) {
    throw new Error("生成结果结构不完整，请稍后重试。")
  }
  return {
    project: data.project,
    run: data.run,
    result: data.result,
  }
}

export async function createAIGameProject(payload: AIGameProjectPayload, token: string) {
  const response = await fetch(buildApiUrl("/api/v1/ai-game-projects"), {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  })
  const data = await readJsonResponse<CreateAIGameProjectResponse>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "生成 AI 游戏项目失败。")
  }

  return ensureProject(data)
}

export async function getAIGameProjects(token: string): Promise<AIGameProject[]> {
  const response = await fetch(buildApiUrl("/api/v1/ai-game-projects"), {
    cache: "no-store",
    headers: jsonHeaders(token),
  })
  const data = await readJsonResponse<AIGameProjectsResponse>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "获取 AI 游戏项目失败。")
  }

  return Array.isArray(data.items) ? data.items : []
}

export async function getAIGameProject(token: string, id: number): Promise<Required<Pick<AIGameProjectDetail, "project">> & AIGameProjectDetail> {
  const response = await fetch(buildApiUrl(`/api/v1/ai-game-projects/${id}`), {
    cache: "no-store",
    headers: jsonHeaders(token),
  })
  const data = await readJsonResponse<AIGameProjectDetail>(response)

  if (!response.ok) {
    throw new Error(data.detail || data.message || "获取 AI 游戏项目详情失败。")
  }
  if (!data.project) {
    throw new Error("项目详情结构不完整。")
  }

  return {
    ...data,
    project: data.project,
  }
}
