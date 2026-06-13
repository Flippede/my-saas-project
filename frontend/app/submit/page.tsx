"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getStoredToken } from "@/lib/app-config"
import { createGameSubmission } from "@/lib/game-submissions"

const deliveryOptions = ["概念图", "宣传片", "2D 素材", "3D 模型", "Pitch 包", "可交互 Demo"]

export default function SubmitPage() {
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const toggleDelivery = (item: string) => {
    setSelectedDeliveries((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setSubmitted(false)
    setSubmissionId(null)

    const formData = new FormData(event.currentTarget)

    try {
      const result = await createGameSubmission(
        {
          game_name: String(formData.get("gameName") || ""),
          game_type: String(formData.get("gameType") || ""),
          art_style: String(formData.get("artStyle") || ""),
          protagonist: String(formData.get("hero") || ""),
          enemy_boss: String(formData.get("boss") || ""),
          scene_setting: String(formData.get("world") || ""),
          core_gameplay: String(formData.get("gameplay") || ""),
          deliverables: selectedDeliveries,
          budget_range: String(formData.get("budget") || ""),
          contact: String(formData.get("contact") || ""),
          notes: String(formData.get("notes") || ""),
        },
        getStoredToken(),
      )

      setSubmissionId(result.id)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败，请稍后重试。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <main className="relative overflow-hidden px-4 pb-20 pt-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),transparent_38%,rgba(251,191,36,0.08))]" />

        <div className="relative mx-auto max-w-5xl">
          <Button
            asChild
            variant="outline"
            className="mb-8 rounded-md border-white/15 bg-white/[0.04] text-neutral-200 hover:bg-white/10 hover:text-white"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
          </Button>

          <div className="mb-10 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-200">Game Brief</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal md:text-6xl">提交你的游戏想法</h1>
            <p className="mt-5 text-lg leading-8 text-neutral-300">
              告诉我们你的游戏设定，我们会帮你生成概念方案、类游戏宣传片、素材包或可交互 Demo 的第一版方向。
            </p>
          </div>

          {submitted ? (
            <div className="mb-8 rounded-lg border border-emerald-300/30 bg-emerald-300/[0.08] p-6 text-emerald-100 shadow-[0_0_38px_rgba(52,211,153,0.12)]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-6 w-6 shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold">已收到你的游戏想法。</h2>
                  <p className="mt-2 leading-7 text-emerald-50/85">
                    需求编号：{submissionId ?? "--"}。我们会根据你的设定整理第一版概念方向，并尽快与你联系。
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mb-8 rounded-lg border border-red-400/30 bg-red-400/[0.08] p-5 text-red-100">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur md:p-7">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="游戏名称，可选" name="gameName" placeholder="例如：雷鸣古寺" required={false} />
              <Field label="游戏类型" name="gameType" placeholder="例如：横版动作 / 开放世界 / 像素 RPG" />
              <Field label="画风" name="artStyle" placeholder="例如：国风暗黑、赛博霓虹、像素复古" />
              <Field label="预算范围" name="budget" placeholder="例如：199-499 元 / 2999 元以上 / 需报价" />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextField label="主角设定" name="hero" placeholder="主角身份、武器、性格、视觉特征..." />
              <TextField label="敌人 / Boss 设定" name="boss" placeholder="敌人阵营、Boss 造型、能力和压迫感..." />
              <TextField label="场景设定" name="world" placeholder="主要地图、时代背景、氛围和关键场景..." />
              <TextField label="核心玩法" name="gameplay" placeholder="战斗、探索、养成、叙事、多人或解谜机制..." />
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-neutral-200">想要的交付内容</label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {deliveryOptions.map((item) => {
                  const checked = selectedDeliveries.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleDelivery(item)}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                        checked
                          ? "border-cyan-200/60 bg-cyan-200/12 text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.1)]"
                          : "border-white/12 bg-black/25 text-neutral-300 hover:border-white/30"
                      }`}
                    >
                      <span>{item}</span>
                      <span className={`h-4 w-4 rounded-sm border ${checked ? "border-cyan-100 bg-cyan-200" : "border-white/25"}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="联系方式" name="contact" placeholder="微信 / 手机 / 邮箱" />
              <TextField label="补充说明" name="notes" placeholder="参考方向、交付时间、用途、特别注意事项..." rows={5} />
            </div>

            <input type="hidden" name="deliveries" value={selectedDeliveries.join(",")} />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {loading ? "提交中..." : "提交游戏想法"}
              </Button>
              <p className="text-sm text-neutral-400">未登录也可以提交；登录后提交会自动关联到你的工作台。</p>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

function Field({
  label,
  name,
  placeholder,
  required = true,
}: {
  label: string
  name: string
  placeholder: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-200">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-md border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-200/55"
      />
    </label>
  )
}

function TextField({
  label,
  name,
  placeholder,
  rows = 4,
}: {
  label: string
  name: string
  placeholder: string
  rows?: number
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-200">{label}</span>
      <textarea
        name={name}
        required
        rows={rows}
        placeholder={placeholder}
        className="mt-2 min-h-[132px] w-full resize-y rounded-md border border-white/12 bg-black/30 px-3 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-200/55"
      />
    </label>
  )
}
