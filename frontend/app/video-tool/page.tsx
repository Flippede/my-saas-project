"use client"

import { useCallback, useRef, useState } from "react"
import { Loader2, Copy, Clapperboard } from "lucide-react"

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

const DEBOUNCE_MS = 450

async function copyField(text: string, label: string) {
  const value = String(text ?? "").trim()
  if (!value) {
    alert(`${label} 为空，无法复制`)
    return
  }
  try {
    await navigator.clipboard.writeText(value)
    alert(`已复制：${label}`)
  } catch {
    alert("复制失败，请手动选中复制或检查浏览器权限")
  }
}

export default function VideoToolPage() {
  const [characterProfile, setCharacterProfile] = useState("")
  const [storyText, setStoryText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [scenes, setScenes] = useState<StoryboardScene[]>([])

  /** 防止短时间重复提交（防抖/节流） */
  const lastSubmitAtRef = useRef(0)

  const runGenerate = useCallback(async () => {
    setError("")
    setScenes([])

    if (!characterProfile.trim() || !storyText.trim()) {
      setError("请填写全局角色特征与原始故事文案。")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/v1/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool_id: "video_storyboard",
          payload: {
            characterProfile: characterProfile.trim(),
            storyText: storyText.trim(),
          },
        }),
      })

      const data = (await response.json()) as ToolsApiResponse

      if (!response.ok) {
        const msg =
          typeof data?.message === "string"
            ? data.message
            : typeof (data as { detail?: string }).detail === "string"
              ? (data as { detail: string }).detail
              : `请求失败（HTTP ${response.status}）`
        throw new Error(msg)
      }

      if (data.success === false) {
        throw new Error(data.error || data.message || "分镜生成失败")
      }

      const raw = data.result
      if (!Array.isArray(raw)) {
        throw new Error("返回数据格式异常：result 不是数组")
      }

      const normalized: StoryboardScene[] = raw.map((item, index) => {
        const row = item as Record<string, unknown>
        return {
          scene: typeof row.scene === "number" ? row.scene : index + 1,
          plot: String(row.plot ?? ""),
          image_prompt: String(row.image_prompt ?? ""),
          omni_reference: String(row.omni_reference ?? ""),
        }
      })

      setScenes(normalized)
    } catch (e) {
      const message = e instanceof Error ? e.message : "网络或服务器异常，请稍后重试。"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [characterProfile, storyText])

  const scheduleGenerate = () => {
    if (loading) return
    const now = Date.now()
    if (now - lastSubmitAtRef.current < DEBOUNCE_MS) return
    lastSubmitAtRef.current = now
    void runGenerate()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <Clapperboard className="h-8 w-8 text-primary" aria-hidden />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">即梦 AI 视频分镜</h1>
            <p className="text-sm text-muted-foreground">将故事文案拆分为连贯分镜，并生成英文生图与参考提示词</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          <section className="col-span-12 space-y-5 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>输入</CardTitle>
                <CardDescription>填写故事素材后点击生成分镜</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="character-profile">全局角色特征</Label>
                  <Input
                    id="character-profile"
                    placeholder="例如：年龄、发型、服装、气质等"
                    value={characterProfile}
                    onChange={(e) => setCharacterProfile(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story-text">原始故事文案</Label>
                  <Textarea
                    id="story-text"
                    placeholder="粘贴完整故事或情节大纲…"
                    rows={10}
                    className="min-h-[200px] resize-y"
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                  />
                </div>
                <Button type="button" className="w-full" disabled={loading} onClick={scheduleGenerate}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      生成中…
                    </>
                  ) : (
                    "生成分镜"
                  )}
                </Button>
                {error ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <section className="col-span-12 lg:col-span-8">
            <Card className="min-h-[320px]">
              <CardHeader>
                <CardTitle>分镜结果</CardTitle>
                <CardDescription>
                  {scenes.length > 0 ? `共 ${scenes.length} 个场景` : "生成后将在此展示分镜卡片"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scenes.length === 0 && !loading ? (
                  <p className="text-sm text-muted-foreground">暂无数据，请先在左侧填写并生成。</p>
                ) : null}
                {scenes.map((row, idx) => (
                  <Card key={`scene-${row.scene}-${idx}`} className="border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">场景 {row.scene}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div>
                        <div className="mb-1 font-medium text-muted-foreground">情节</div>
                        <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3">{row.plot || "—"}</p>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-medium text-muted-foreground">生图提示词</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => void copyField(row.image_prompt, "生图提示词")}
                          >
                            <Copy className="size-3.5" />
                            复制
                          </Button>
                        </div>
                        <Textarea readOnly rows={4} className="font-mono text-xs" value={row.image_prompt} />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-medium text-muted-foreground">全能参考提示词</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => void copyField(row.omni_reference, "全能参考提示词")}
                          >
                            <Copy className="size-3.5" />
                            复制
                          </Button>
                        </div>
                        <Textarea readOnly rows={3} className="font-mono text-xs" value={row.omni_reference} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
