"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, RefreshCw, Send } from "lucide-react"

import { AIGameAssetPipeline } from "@/components/ai-game-asset-pipeline"
import { AIGameWorldResult } from "@/components/ai-game-world-result"
import { Button } from "@/components/ui/button"
import { getStoredToken } from "@/lib/app-config"
import {
  getAIGameProject,
  regenerateAIGameProjectSection,
  type AIGameProject,
  type AIGameProjectSection,
  type GeneratedGameWorld,
} from "@/lib/ai-game-projects"

function formatDate(value?: string) {
  if (!value) {
    return "--"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function GameProjectDetailClient({ params }: { params: { id: string } }) {
  const projectId = useMemo(() => Number(params.id), [params.id])
  const [project, setProject] = useState<AIGameProject | null>(null)
  const [result, setResult] = useState<GeneratedGameWorld | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function handleRegenerateSection(section: AIGameProjectSection, instruction: string) {
    const token = getStoredToken()
    if (!token) {
      throw new Error("请先登录后再重新生成模块。")
    }
    if (!Number.isFinite(projectId) || projectId <= 0) {
      throw new Error("项目编号无效。")
    }

    const data = await regenerateAIGameProjectSection(projectId, section, instruction, token)
    setProject(data.project)
    setResult(data.generation_result || null)
  }

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      const token = getStoredToken()
      if (!token) {
        setLoading(false)
        setError("请先登录后查看 AI 游戏项目。")
        return
      }
      if (!Number.isFinite(projectId) || projectId <= 0) {
        setLoading(false)
        setError("项目编号无效。")
        return
      }

      setLoading(true)
      setError("")

      try {
        const data = await getAIGameProject(token, projectId)
        if (!cancelled) {
          setProject(data.project)
          setResult(data.generation_result || null)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "获取项目详情失败。")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProject()

    return () => {
      cancelled = true
    }
  }, [projectId])

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <main className="relative overflow-hidden px-4 pb-20 pt-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),transparent_40%,rgba(251,191,36,0.08))]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="rounded-md border-white/15 bg-white/[0.04] text-neutral-200 hover:bg-white/10 hover:text-white"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                返回 Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/generate-game">
                <RefreshCw className="h-4 w-4" />
                新建 AI 项目
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6 text-neutral-200">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
                <span>正在加载 AI 游戏项目...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-amber-300/25 bg-amber-300/[0.08] p-6 text-amber-100">
              <h1 className="text-2xl font-semibold">无法打开项目</h1>
              <p className="mt-3 text-sm leading-7">{error}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                  <Link href="/login">登录 / 注册</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/dashboard">返回 Dashboard</Link>
                </Button>
              </div>
            </div>
          ) : project && result ? (
            <>
              <section className="mb-6 rounded-lg border border-white/10 bg-black/25 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-cyan-200">Game World Workbench</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-5xl">{project.title || "未命名 AI 游戏项目"}</h1>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-300">{project.one_sentence_idea}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-neutral-300 sm:min-w-60">
                    <span className="rounded border border-white/10 bg-white/[0.05] px-3 py-2">状态：{project.status}</span>
                    <span className="rounded border border-white/10 bg-white/[0.05] px-3 py-2">类型：{project.game_type || "未填写"}</span>
                    <span className="rounded border border-white/10 bg-white/[0.05] px-3 py-2">画风：{project.art_style || "未填写"}</span>
                    <span className="rounded border border-white/10 bg-white/[0.05] px-3 py-2">创建：{formatDate(project.created_at)}</span>
                  </div>
                </div>
              </section>
              <section className="mb-6 rounded-lg border border-cyan-200/20 bg-cyan-200/[0.07] p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">需要把这个方案做成宣传片、素材包或可交互 Demo？</h2>
                    <p className="mt-2 text-sm leading-7 text-neutral-300">
                      可以先继续完善世界观和视觉资产任务，再提交定制制作需求进入范围评估。
                    </p>
                  </div>
                  <Button asChild className="shrink-0 rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                    <Link href={`/submit?projectId=${project.id}`}>
                      <Send className="h-4 w-4" />
                      提交定制制作需求
                    </Link>
                  </Button>
                </div>
              </section>
              <AIGameAssetPipeline projectId={project.id} />
              <AIGameWorldResult result={result} enableRegeneration onRegenerateSection={handleRegenerateSection} />
            </>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6 text-neutral-300">项目暂无生成结果。</div>
          )}
        </div>
      </main>
    </div>
  )
}
