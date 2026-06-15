"use client"

import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Clapperboard, Loader2, WandSparkles } from "lucide-react"

import { AIGameWorldResult } from "@/components/ai-game-world-result"
import { Button } from "@/components/ui/button"
import { getStoredToken } from "@/lib/app-config"
import { createAIGameProject, type AIGameProject, type GeneratedGameWorld } from "@/lib/ai-game-projects"
import { getDemoCasePrefill, type DemoCase } from "@/lib/demo-cases"

const gameTypes = ["动作角色扮演", "开放世界冒险", "像素 RPG", "策略经营", "叙事解谜"]
const artStyles = ["国风暗黑", "赛博朋克", "像素复古", "低多边形幻想", "电影感写实"]
const platforms = ["PC / WebGL", "移动端", "PC / Steam", "微信小游戏", "主机概念验证"]

const defaultFormValues = {
  idea: "",
  gameType: gameTypes[0],
  artStyle: artStyles[0],
  targetPlatform: platforms[0],
}

export default function GenerateGamePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [project, setProject] = useState<AIGameProject | null>(null)
  const [result, setResult] = useState<GeneratedGameWorld | null>(null)
  const [selectedDemoCase, setSelectedDemoCase] = useState<DemoCase | null>(null)
  const [formValues, setFormValues] = useState(defaultFormValues)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const caseSlug = searchParams.get("case") || ""
    const demoPrefill = getDemoCasePrefill(caseSlug)
    if (!demoPrefill) {
      return
    }

    setSelectedDemoCase(demoPrefill.demo)
    setFormValues(demoPrefill.prefill)
  }, [])

  function updateFormValue(field: keyof typeof formValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleClearCasePrefill() {
    setSelectedDemoCase(null)
    setFormValues(defaultFormValues)
    window.history.replaceState(null, "", "/generate-game")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setProject(null)
    setResult(null)

    const token = getStoredToken()
    if (!token) {
      setLoading(false)
      setError("请先登录后再生成 AI 游戏项目。")
      return
    }

    const formData = new FormData(event.currentTarget)

    try {
      const data = await createAIGameProject(
        {
          idea: formValues.idea || String(formData.get("idea") || ""),
          game_type: formValues.gameType || String(formData.get("gameType") || ""),
          art_style: formValues.artStyle || String(formData.get("artStyle") || ""),
          target_platform: formValues.targetPlatform || String(formData.get("targetPlatform") || ""),
        },
        token,
      )
      setProject(data.project)
      setResult(data.result)
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "生成失败，请稍后重试。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <main className="relative overflow-hidden px-4 pb-20 pt-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),transparent_36%,rgba(244,114,182,0.1)_62%,rgba(251,191,36,0.08))]" />

        <div className="relative mx-auto max-w-7xl">
          <Button
            asChild
            variant="outline"
            className="mb-8 rounded-md border-white/15 bg-white/[0.04] text-neutral-200 hover:bg-white/10 hover:text-white"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              返回 Dashboard
            </Link>
          </Button>

          <section className="mb-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1 text-sm text-cyan-100">
                <WandSparkles className="h-4 w-4" />
                造境 AI 核心生成引擎 v2
              </p>
              <h1 className="mt-5 text-4xl font-semibold tracking-normal md:text-6xl">生成游戏世界方案</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-300">
                输入一个核心想法，生成世界观、玩法、角色、Boss、场景、UI 页面、视频分镜、素材 Prompt 和 Pitch 初稿。
              </p>

              {selectedDemoCase ? (
                <div className="mt-6 rounded-lg border border-cyan-200/20 bg-cyan-200/[0.07] p-4 text-sm leading-7 text-cyan-50">
                  <p>
                    已基于「{selectedDemoCase.title}」官方案例填入示例参数，你可以直接修改后生成自己的版本。
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleClearCasePrefill}
                    className="mt-3 rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    清空案例参数
                  </Button>
                </div>
              ) : null}

              {project ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                    <Link href={`/game-projects/${project.id}`}>
                      进入项目工作台
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/dashboard">回到 Dashboard</Link>
                  </Button>
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur md:p-6">
              <label className="block">
                <span className="text-sm font-medium text-neutral-200">游戏想法</span>
                <textarea
                  name="idea"
                  required
                  rows={5}
                  value={formValues.idea}
                  onChange={(event) => updateFormValue("idea", event.target.value)}
                  placeholder="例如：一个国风暗黑动作游戏，主角是被流放的斩妖人"
                  className="mt-2 min-h-[140px] w-full resize-y rounded-md border border-white/12 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-200/55"
                />
              </label>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <SelectField
                  label="游戏类型"
                  name="gameType"
                  options={gameTypes}
                  value={formValues.gameType}
                  onChange={(value) => updateFormValue("gameType", value)}
                />
                <SelectField
                  label="画风"
                  name="artStyle"
                  options={artStyles}
                  value={formValues.artStyle}
                  onChange={(value) => updateFormValue("artStyle", value)}
                />
                <SelectField
                  label="目标平台"
                  name="targetPlatform"
                  options={platforms}
                  value={formValues.targetPlatform}
                  onChange={(value) => updateFormValue("targetPlatform", value)}
                />
              </div>

              {error ? (
                <div className="mt-5 rounded-lg border border-red-400/30 bg-red-400/[0.08] p-4 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              <div className="mt-5 rounded-lg border border-cyan-200/20 bg-cyan-200/[0.06] p-4 text-sm leading-7 text-cyan-50">
                <Link href="/cases" className="inline-flex items-center gap-2 transition hover:text-white">
                  <Clapperboard className="h-4 w-4" />
                  不知道怎么写想法？先看 3 个官方 Demo 案例
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                  {loading ? "生成中..." : "生成游戏世界方案"}
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-auto whitespace-normal rounded-md border-white/15 bg-transparent py-3 text-left text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/submit">需要宣传片、素材包或可交互 Demo？提交定制需求</Link>
                </Button>
              </div>
            </form>
          </section>

          {loading ? (
            <section className="rounded-lg border border-cyan-200/20 bg-cyan-200/[0.07] p-6 text-cyan-50">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>正在整理世界观、角色、Boss、场景与素材 Prompt...</span>
              </div>
            </section>
          ) : null}

          {project ? (
            <section className="mb-6 rounded-lg border border-emerald-300/25 bg-emerald-300/[0.07] p-6">
              <h2 className="text-2xl font-semibold text-emerald-50">已生成你的 AI 游戏项目</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-300">下一步可以在项目工作台中：</p>
              <ol className="mt-4 grid gap-2 text-sm leading-7 text-neutral-300 md:grid-cols-2">
                <li>1. 查看世界观、角色、Boss、场景、UI 和视频分镜</li>
                <li>2. 单独重新生成某个模块</li>
                <li>3. 拆解视觉资产任务</li>
                <li>4. 提交定制需求，升级为宣传片、素材包或可交互 Demo</li>
              </ol>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                  <Link href={`/game-projects/${project.id}`}>
                    进入项目工作台
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/submit">提交定制制作需求</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/cases">查看官方 Demo 案例</Link>
                </Button>
              </div>
            </section>
          ) : null}

          {result ? <AIGameWorldResult result={result} /> : null}
        </div>
      </main>
    </div>
  )
}

function SelectField({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string
  name: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-200">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-md border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-cyan-200/55"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#050608] text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
