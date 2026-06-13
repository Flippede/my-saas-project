"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  BriefcaseBusiness,
  Clapperboard,
  CreditCard,
  FileText,
  Gamepad2,
  LayoutDashboard,
  PackageCheck,
  Plus,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/ui/navbar"
import { getStoredToken } from "@/lib/app-config"
import { getAdminMe } from "@/lib/admin"
import { type AIGameProject, getAIGameProjects } from "@/lib/ai-game-projects"
import { type GameSubmission, getMyGameSubmissions } from "@/lib/game-submissions"

const statusLabels: Record<string, string> = {
  new: "已提交",
  reviewing: "整理概念中",
  quoted: "已报价",
  in_progress: "制作中",
  delivered: "已交付",
  cancelled: "已取消",
}

const projectStatusLabels: Record<string, string> = {
  draft: "草稿",
  generating: "生成中",
  generated: "已生成",
  failed: "生成失败",
}

const tools = [
  {
    title: "AI 分镜工作台",
    description: "保留现有分镜生成能力，可用于拆解类游戏宣传片镜头。",
    href: "/generate",
    icon: Clapperboard,
  },
  {
    title: "短视频脚本生成器",
    description: "保留现有 AI 工具入口，可用于短视频传播和私域转化脚本。",
    href: "/tools/script-generator",
    icon: Sparkles,
  },
]

function formatDate(value: string) {
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

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<GameSubmission[]>([])
  const [aiProjects, setAiProjects] = useState<AIGameProject[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [loadingAiProjects, setLoadingAiProjects] = useState(true)
  const [submissionsError, setSubmissionsError] = useState("")
  const [aiProjectsError, setAiProjectsError] = useState("")
  const [hasToken, setHasToken] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadSubmissions() {
      const token = getStoredToken()
      setHasToken(Boolean(token))

      void getAdminMe().then((admin) => {
        if (!cancelled) {
          setIsAdmin(admin)
        }
      })

      if (!token) {
        setLoadingSubmissions(false)
        setLoadingAiProjects(false)
        setSubmissions([])
        setAiProjects([])
        return
      }

      setLoadingSubmissions(true)
      setLoadingAiProjects(true)
      setSubmissionsError("")
      setAiProjectsError("")

      const [submissionResult, projectResult] = await Promise.allSettled([
        getMyGameSubmissions(token),
        getAIGameProjects(token),
      ])

      if (cancelled) {
        return
      }

      if (submissionResult.status === "fulfilled") {
        setSubmissions(submissionResult.value)
      } else {
        setSubmissionsError(submissionResult.reason instanceof Error ? submissionResult.reason.message : "获取我的需求失败。")
      }

      if (projectResult.status === "fulfilled") {
        setAiProjects(projectResult.value)
      } else {
        setAiProjectsError(projectResult.reason instanceof Error ? projectResult.reason.message : "获取 AI 游戏项目失败。")
      }

      setLoadingSubmissions(false)
      setLoadingAiProjects(false)
    }

    void loadSubmissions()

    return () => {
      cancelled = true
    }
  }, [])

  const statusCards = useMemo(
    () => [
      { title: "会员状态", value: "以登录信息为准", description: "右上角会显示当前账号会员状态。", icon: BadgeCheck },
      { title: "支付状态", value: "暂无待支付订单", description: "可从服务套餐或会员入口继续开通。", icon: CreditCard },
      { title: "我的 AI 项目", value: `${aiProjects.length} 个`, description: "AI 自动生成的游戏世界方案会在这里归档。", icon: Gamepad2 },
      { title: "我的需求", value: `${submissions.length} 条`, description: "提交游戏想法后会在这里整理需求。", icon: FileText },
      { title: "我的订单", value: "0 笔", description: "付费服务订单会在这里汇总。", icon: BriefcaseBusiness },
    ],
    [aiProjects.length, submissions.length],
  )

  const aiAssetSummary = useMemo(
    () =>
      aiProjects.reduce(
        (summary, project) => {
          const counts = project.asset_counts
          summary.total += counts?.total || 0
          summary.pending += counts?.pending || 0
          summary.generated += counts?.generated || 0
          summary.uploaded += counts?.uploaded || 0
          return summary
        },
        { total: 0, pending: 0, generated: 0, uploaded: 0 },
      ),
    [aiProjects],
  )

  const latestAiProject = aiProjects[0]

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <Navbar />
      <main className="relative overflow-hidden px-4 pb-20 pt-32">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:58px_58px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),transparent_38%,rgba(251,191,36,0.08))]" />

        <div className="relative mx-auto max-w-7xl">
          <section className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1 text-sm text-cyan-100">
                <LayoutDashboard className="h-4 w-4" />
                造境 AI 用户工作台
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">你的游戏原型项目中心</h1>
              <p className="mt-4 max-w-2xl text-neutral-300">
                管理需求、订单、生成项目和待交付内容。第一版已接入真实需求提交，后续可继续扩展订单和交付数据。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                <Link href="/generate-game">
                  <WandSparkles className="h-4 w-4" />
                  生成游戏世界
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/submit">
                  <Plus className="h-4 w-4" />
                  提交人工需求
                </Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {statusCards.map(({ title, value, description, icon: Icon }) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
                <Icon className="mb-5 h-6 w-6 text-cyan-200" />
                <h2 className="text-sm text-neutral-400">{title}</h2>
                <div className="mt-2 text-2xl font-semibold">{value}</div>
                <p className="mt-3 text-sm leading-6 text-neutral-400">{description}</p>
              </div>
            ))}
          </section>

          {isAdmin ? (
            <section className="mt-6 rounded-lg border border-cyan-200/25 bg-cyan-200/[0.07] p-6 shadow-[0_0_32px_rgba(34,211,238,0.1)]">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border border-cyan-200/30 bg-cyan-200/10 p-3 text-cyan-100">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">需求管理</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-300">
                      查看用户提交的游戏想法，跟进状态、报价和交付进度。
                    </p>
                  </div>
                </div>
                <Button asChild className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                  <Link href="/admin/submissions">
                    进入管理后台
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          ) : null}

          <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-7 backdrop-blur">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-semibold">我的 AI 游戏项目</h2>
                <p className="mt-2 text-sm text-neutral-400">这里展示当前登录账号自动生成过的游戏世界方案。</p>
              </div>
              <Button asChild className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                <Link href="/generate-game">
                  <WandSparkles className="h-4 w-4" />
                  新建 AI 游戏项目
                </Link>
              </Button>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-4">
              {[
                { label: "项目数量", value: aiProjects.length },
                { label: "待生成资产", value: aiAssetSummary.pending },
                { label: "已生成资产", value: aiAssetSummary.generated },
                { label: "已上传资产", value: aiAssetSummary.uploaded },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-black/25 p-4">
                  <div className="text-xs text-neutral-500">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold">{item.value}</div>
                </div>
              ))}
            </div>

            {latestAiProject ? (
              <div className="mb-6 rounded-lg border border-cyan-200/20 bg-cyan-200/[0.06] p-4 text-sm leading-7 text-cyan-50">
                最近项目：{latestAiProject.title || "未命名 AI 游戏项目"}，资产任务共 {latestAiProject.asset_counts?.total || 0} 个。
              </div>
            ) : null}

            {loadingAiProjects ? (
              <div className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-neutral-300">正在加载 AI 游戏项目...</div>
            ) : aiProjectsError ? (
              <div className="rounded-lg border border-amber-300/25 bg-amber-300/[0.08] p-5 text-sm text-amber-100">
                {aiProjectsError}
              </div>
            ) : !hasToken ? (
              <div className="rounded-lg border border-white/10 bg-black/25 p-6">
                <h3 className="text-xl font-semibold">登录后可创建和查看 AI 游戏项目。</h3>
                <p className="mt-3 text-neutral-300">AI 生成结果会自动保存到你的工作台，方便继续整理 Prompt 和 Pitch。</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                    <Link href="/login">登录 / 注册</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/generate-game">查看生成页</Link>
                  </Button>
                </div>
              </div>
            ) : aiProjects.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-black/25 p-6">
                <h3 className="text-xl font-semibold">你还没有 AI 游戏项目。</h3>
                <p className="mt-3 text-neutral-300">从一句话开始，生成第一版世界观、Boss、场景、UI 和素材 Prompt。</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {aiProjects.map((item) => (
                  <article key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold">{item.title || "未命名 AI 游戏项目"}</h3>
                          <span className="rounded border border-cyan-200/30 bg-cyan-200/10 px-2 py-1 text-xs text-cyan-100">
                            {projectStatusLabels[item.status] || item.status || "已生成"}
                          </span>
                        </div>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">{item.one_sentence_idea}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-neutral-300">
                          <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1">
                            类型：{item.game_type || "未填写"}
                          </span>
                          <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1">
                            画风：{item.art_style || "未填写"}
                          </span>
                          <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1">
                            平台：{item.target_platform || "未填写"}
                          </span>
                          <span className="rounded border border-cyan-200/20 bg-cyan-200/[0.08] px-2.5 py-1 text-cyan-100">
                            资产：{item.asset_counts?.total ?? 0}
                          </span>
                          <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1">
                            待生成：{item.asset_counts?.pending ?? 0}
                          </span>
                          <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1">
                            已生成：{item.asset_counts?.generated ?? 0}
                          </span>
                          <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1">
                            已上传：{item.asset_counts?.uploaded ?? 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-3 md:items-end">
                        <div className="text-sm text-neutral-400">创建时间：{formatDate(item.created_at)}</div>
                        <Button asChild className="rounded-md bg-white text-black hover:bg-neutral-200">
                          <Link href={`/game-projects/${item.id}`}>
                            查看详情
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-7 backdrop-blur">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-semibold">我的需求</h2>
                <p className="mt-2 text-sm text-neutral-400">这里展示当前登录账号提交过的游戏想法。</p>
              </div>
              <Button asChild className="rounded-md bg-white text-black hover:bg-neutral-200">
                <Link href="/submit">
                  创建第一个游戏原型
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {loadingSubmissions ? (
              <div className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-neutral-300">正在加载我的需求...</div>
            ) : submissionsError ? (
              <div className="rounded-lg border border-amber-300/25 bg-amber-300/[0.08] p-5 text-sm text-amber-100">
                {submissionsError}
              </div>
            ) : !hasToken ? (
              <div className="rounded-lg border border-white/10 bg-black/25 p-6">
                <h3 className="text-xl font-semibold">登录后可查看你提交过的游戏想法。</h3>
                <p className="mt-3 text-neutral-300">未登录也可以提交需求；登录后提交会自动关联到你的工作台。</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                    <Link href="/login">登录 / 注册</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/submit">继续提交想法</Link>
                  </Button>
                </div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-black/25 p-6">
                <h3 className="text-xl font-semibold">你还没有提交游戏想法。</h3>
                <p className="mt-3 text-neutral-300">点击创建第一个游戏原型，把脑子里的设定变成可展示的视觉方向。</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {submissions.map((item) => (
                  <article key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold">{item.game_name || "未命名游戏想法"}</h3>
                          <span className="rounded border border-cyan-200/30 bg-cyan-200/10 px-2 py-1 text-xs text-cyan-100">
                            {statusLabels[item.status] || item.status || "已提交"}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-neutral-300">
                          <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1">
                            类型：{item.game_type || "未填写"}
                          </span>
                          <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1">
                            画风：{item.art_style || "未填写"}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-neutral-400">创建时间：{formatDate(item.created_at)}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {[
              { title: "我的生成项目", description: "后续可展示概念方向、素材范围、交付计划和 Demo 链接。", icon: Boxes },
              { title: "待交付内容", description: "后续可展示概念图、宣传片、素材包、Pitch 页面和在线演示链接。", icon: PackageCheck },
            ].map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-lg border border-white/10 bg-black/25 p-6">
                <Icon className="mb-5 h-7 w-7 text-amber-200" />
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-400">{description}</p>
              </div>
            ))}
          </section>

          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">现有 AI 工具</h2>
                <p className="mt-2 text-sm text-neutral-400">保留原有工具入口，方便继续使用已有能力。</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {tools.map(({ title, description, href, icon: Icon }) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
                  <Icon className="mb-5 h-7 w-7 text-cyan-200" />
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-3 min-h-[56px] text-sm leading-7 text-neutral-400">{description}</p>
                  <Button asChild className="mt-5 rounded-md bg-white text-black hover:bg-neutral-200">
                    <Link href={href}>
                      进入工具
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
