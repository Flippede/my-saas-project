"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clapperboard, Copy, Loader2 } from "lucide-react"

import { buildApiUrl, getStoredToken, jsonHeaders } from "@/lib/app-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type StoryboardScene = {
  scene: number
  plot: string
  image_prompt: string
  omni_reference: string
}

type ToolsApiResponse = {
  success?: boolean
  result?: unknown
  message?: string
  error?: string
}

async function copyField(text: string, label: string) {
  const value = String(text ?? "").trim()
  if (!value) {
    alert(`${label} 为空，无法复制。`)
    return
  }

  try {
    await navigator.clipboard.writeText(value)
    alert(`已复制：${label}`)
  } catch {
    alert("复制失败，请手动复制。")
  }
}

export default function GeneratePage() {
  const router = useRouter()
  const [characterProfile, setCharacterProfile] = useState("")
  const [storyText, setStoryText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [scenes, setScenes] = useState<StoryboardScene[]>([])

  const handleGenerate = async () => {
    const token = getStoredToken()
    if (!token) {
      alert("登录状态已失效，请先登录。")
      router.push("/login")
      return
    }

    if (!characterProfile.trim() || !storyText.trim()) {
      setError("请填写全局角色特征和故事文本后再生成。")
      return
    }

    setLoading(true)
    setError("")
    setScenes([])

    try {
      const response = await fetch(buildApiUrl("/api/v1/tools"), {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify({
          tool_id: "video_storyboard",
          payload: {
            characterProfile: characterProfile.trim(),
            storyText: storyText.trim(),
          },
        }),
      })

      const payload = (await response.json()) as ToolsApiResponse

      if (!response.ok) {
        const detail = payload.message || `请求失败（HTTP ${response.status}）`
        throw new Error(detail)
      }

      if (payload.success === false) {
        throw new Error(payload.error || payload.message || "分镜生成失败")
      }

      if (!Array.isArray(payload.result)) {
        throw new Error("返回结果格式异常，缺少可用的分镜数据。")
      }

      const normalizedScenes = payload.result.map((item, index) => {
        const row = item as Record<string, unknown>
        return {
          scene: typeof row.scene === "number" ? row.scene : index + 1,
          plot: String(row.plot ?? ""),
          image_prompt: String(row.image_prompt ?? ""),
          omni_reference: String(row.omni_reference ?? ""),
        }
      })

      setScenes(normalizedScenes)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "请求失败，请稍后重试。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4">
          <Clapperboard className="h-6 w-6 text-blue-400" />
          <h1 className="text-xl font-semibold tracking-tight">AI Storyboard X 工作台</h1>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section>
          <Card className="border-white/10 bg-neutral-900 shadow-xl">
            <CardHeader>
              <CardTitle>输入区</CardTitle>
              <CardDescription className="text-neutral-400">
                先描述角色特征，再粘贴故事文本，系统会自动拆分成连贯分镜。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="character-profile">全局角色特征</Label>
                <Input
                  id="character-profile"
                  value={characterProfile}
                  onChange={(event) => setCharacterProfile(event.target.value)}
                  placeholder="例如：25 岁女性、短发、西装、冷静干练"
                  className="border-white/15 bg-black/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="story-text">故事文本</Label>
                <Textarea
                  id="story-text"
                  value={storyText}
                  onChange={(event) => setStoryText(event.target.value)}
                  placeholder="粘贴完整故事、对话草稿或分镜灵感..."
                  rows={12}
                  className="min-h-[240px] resize-y border-white/15 bg-black/30"
                />
              </div>

              <Button onClick={handleGenerate} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  "开始生成分镜"
                )}
              </Button>

              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="min-h-[420px] border-white/10 bg-neutral-900 shadow-xl">
            <CardHeader>
              <CardTitle>结果区</CardTitle>
              <CardDescription className="text-neutral-400">
                {scenes.length > 0 ? `已生成 ${scenes.length} 个场景，可直接复制提示词。` : "生成后将在这里展示结构化分镜。"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scenes.length === 0 && !loading ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-sm text-neutral-500">
                  暂无结果，填写内容后点击“开始生成分镜”。
                </div>
              ) : null}

              {scenes.map((scene) => (
                <Card key={scene.scene} className="border-white/10 bg-black/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">场景 {scene.scene}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <div className="mb-1 font-medium text-neutral-300">剧情</div>
                      <p className="whitespace-pre-wrap rounded-md bg-neutral-950/70 p-3 text-neutral-200">
                        {scene.plot || "暂无内容"}
                      </p>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-medium text-neutral-300">生图提示词</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void copyField(scene.image_prompt, "生图提示词")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          复制
                        </Button>
                      </div>
                      <Textarea readOnly value={scene.image_prompt} rows={4} className="border-white/15 bg-neutral-950/70 text-xs" />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-medium text-neutral-300">全能参考提示词</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void copyField(scene.omni_reference, "全能参考提示词")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          复制
                        </Button>
                      </div>
                      <Textarea
                        readOnly
                        value={scene.omni_reference}
                        rows={3}
                        className="border-white/15 bg-neutral-950/70 text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
