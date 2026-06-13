"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Clipboard, ExternalLink, ImageIcon, Loader2, PackagePlus, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  getAIGameProjectAssets,
  planAIGameProjectAssets,
  updateAIGameAsset,
  type AIGameAsset,
  type AIGameAssetStatus,
} from "@/lib/ai-game-assets"

const typeLabels: Record<string, string> = {
  protagonist: "主角",
  boss: "Boss",
  scene: "场景",
  ui_screen: "UI 页面",
  video_storyboard: "视频分镜",
  sprite_sheet: "Sprite Sheet",
  pitch_material: "Pitch 材料",
  other: "其他",
}

const statusLabels: Record<AIGameAssetStatus, string> = {
  pending: "待整理",
  ready_for_generation: "待生成",
  generating: "生成中",
  generated: "已生成",
  uploaded: "已上传",
  failed: "失败",
  cancelled: "已取消",
}

const editableStatuses: AIGameAssetStatus[] = [
  "pending",
  "ready_for_generation",
  "generating",
  "generated",
  "uploaded",
  "failed",
  "cancelled",
]

type Draft = {
  title: string
  description: string
  prompt: string
  status: AIGameAssetStatus
  result_url: string
  thumbnail_url: string
}

function createDraft(asset: AIGameAsset): Draft {
  return {
    title: asset.title,
    description: asset.description,
    prompt: asset.prompt,
    status: asset.status,
    result_url: asset.result_url,
    thumbnail_url: asset.thumbnail_url,
  }
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!value) {
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
    >
      {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
      {copied ? "已复制" : "复制 Prompt"}
    </Button>
  )
}

function summarizeAssets(items: AIGameAsset[]) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1
      if (item.status === "generated") {
        summary.generated += 1
      }
      if (item.status === "uploaded") {
        summary.uploaded += 1
      }
      if (item.status === "pending" || item.status === "ready_for_generation") {
        summary.pending += 1
      }
      return summary
    },
    { total: 0, pending: 0, generated: 0, uploaded: 0 },
  )
}

export function AIGameAssetPipeline({ projectId }: { projectId: number }) {
  const [assets, setAssets] = useState<AIGameAsset[]>([])
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [loading, setLoading] = useState(true)
  const [planning, setPlanning] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const summary = useMemo(() => summarizeAssets(assets), [assets])

  useEffect(() => {
    let cancelled = false

    async function loadAssets() {
      setLoading(true)
      setError("")
      try {
        const items = await getAIGameProjectAssets(projectId)
        if (!cancelled) {
          setAssets(items)
          setDrafts(Object.fromEntries(items.map((item) => [item.id, createDraft(item)])))
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "获取视觉资产失败。")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadAssets()

    return () => {
      cancelled = true
    }
  }, [projectId])

  async function handlePlanAssets() {
    setPlanning(true)
    setError("")
    setMessage("")
    try {
      const data = await planAIGameProjectAssets(projectId)
      const items = data.items || []
      setAssets(items)
      setDrafts(Object.fromEntries(items.map((item) => [item.id, createDraft(item)])))
      setMessage(data.created_count ? `已新增 ${data.created_count} 个资产任务。` : "当前方案已拆解过资产任务，没有新增重复项。")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "生成资产任务失败。")
    } finally {
      setPlanning(false)
    }
  }

  function updateDraft<K extends keyof Draft>(assetId: number, field: K, value: Draft[K]) {
    setDrafts((current) => ({
      ...current,
      [assetId]: {
        ...current[assetId],
        [field]: value,
      },
    }))
  }

  async function handleSave(asset: AIGameAsset) {
    const draft = drafts[asset.id]
    if (!draft) {
      return
    }

    setSavingId(asset.id)
    setError("")
    setMessage("")
    try {
      const updated = await updateAIGameAsset(asset.id, draft)
      setAssets((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setDrafts((current) => ({
        ...current,
        [updated.id]: createDraft(updated),
      }))
      setMessage("资产已保存。")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "保存视觉资产失败。")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-cyan-200/20 bg-cyan-200/[0.055] p-5 shadow-[0_0_42px_rgba(34,211,238,0.08)] backdrop-blur md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-100">Visual Asset Pipeline</p>
          <h2 className="mt-2 text-2xl font-semibold">视觉资产生产</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-300">
            当前阶段先生成资产任务与 Prompt；图片、视频、3D、Demo 可通过定制制作或后续生成能力完成。
          </p>
        </div>
        <Button
          type="button"
          onClick={handlePlanAssets}
          disabled={planning}
          className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {planning ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
          {assets.length ? "重新拆解缺失资产" : "从当前方案生成资产任务"}
        </Button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {[
          { label: "资产总数", value: summary.total },
          { label: "待生成", value: summary.pending },
          { label: "已生成", value: summary.generated },
          { label: "已上传", value: summary.uploaded },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="text-xs text-neutral-500">{item.label}</div>
            <div className="mt-2 text-2xl font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      {error ? <div className="mb-5 rounded-lg border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-100">{error}</div> : null}
      {message ? <div className="mb-5 rounded-lg border border-emerald-300/25 bg-emerald-300/[0.08] p-4 text-sm text-emerald-100">{message}</div> : null}

      {loading ? (
        <div className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-neutral-300">正在加载视觉资产...</div>
      ) : assets.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/25 p-6">
          <h3 className="text-xl font-semibold">还没有视觉资产任务。</h3>
          <p className="mt-3 text-sm leading-7 text-neutral-300">点击上方按钮，把当前游戏世界方案拆成角色、Boss、场景、UI、视频分镜和素材 Prompt 任务。</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assets.map((asset) => {
            const draft = drafts[asset.id] || createDraft(asset)
            return (
              <article key={asset.id} className="rounded-lg border border-white/10 bg-black/25 p-4 md:p-5">
                <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
                  <div>
                    {draft.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={draft.thumbnail_url}
                        alt={draft.title}
                        className="aspect-video w-full rounded-md border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-neutral-500">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded border border-cyan-200/30 bg-cyan-200/10 px-2 py-1 text-cyan-100">
                        {typeLabels[asset.asset_type] || asset.asset_type}
                      </span>
                      <span className="rounded border border-white/10 bg-white/[0.05] px-2 py-1 text-neutral-300">
                        {statusLabels[draft.status] || draft.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                      <label className="block">
                        <span className="text-sm font-medium text-neutral-200">资产标题</span>
                        <input
                          value={draft.title}
                          onChange={(event) => updateDraft(asset.id, "title", event.target.value)}
                          className="mt-2 h-10 w-full rounded-md border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-cyan-200/55"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-neutral-200">状态</span>
                        <select
                          value={draft.status}
                          onChange={(event) => updateDraft(asset.id, "status", event.target.value as AIGameAssetStatus)}
                          className="mt-2 h-10 w-full rounded-md border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-cyan-200/55"
                        >
                          {editableStatuses.map((status) => (
                            <option key={status} value={status} className="bg-[#050608] text-white">
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm font-medium text-neutral-200">描述</span>
                      <textarea
                        value={draft.description}
                        onChange={(event) => updateDraft(asset.id, "description", event.target.value)}
                        rows={2}
                        className="mt-2 min-h-[72px] w-full resize-y rounded-md border border-white/12 bg-black/30 px-3 py-2 text-sm leading-6 text-white outline-none transition focus:border-cyan-200/55"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-neutral-200">Prompt</span>
                      <textarea
                        value={draft.prompt}
                        onChange={(event) => updateDraft(asset.id, "prompt", event.target.value)}
                        rows={4}
                        className="mt-2 min-h-[120px] w-full resize-y rounded-md border border-white/12 bg-black/30 px-3 py-2 text-sm leading-6 text-white outline-none transition focus:border-cyan-200/55"
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-neutral-200">结果链接</span>
                        <input
                          value={draft.result_url}
                          onChange={(event) => updateDraft(asset.id, "result_url", event.target.value)}
                          placeholder="图片、视频、网盘或素材包链接"
                          className="mt-2 h-10 w-full rounded-md border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-200/55"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-neutral-200">缩略图链接</span>
                        <input
                          value={draft.thumbnail_url}
                          onChange={(event) => updateDraft(asset.id, "thumbnail_url", event.target.value)}
                          placeholder="可选，图片 URL"
                          className="mt-2 h-10 w-full rounded-md border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-200/55"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <CopyButton value={draft.prompt} />
                      {draft.result_url ? (
                        <Button asChild variant="outline" className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
                          <a href={draft.result_url} target="_blank" rel="noreferrer">
                            查看结果
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        onClick={() => handleSave(asset)}
                        disabled={savingId === asset.id}
                        className="rounded-md bg-white text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === asset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        保存
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
