import type { Metadata } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, Clapperboard, Gamepad2, Palette, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/ui/navbar"
import { demoCases } from "@/lib/demo-cases"

export const metadata: Metadata = {
  title: "官方 Demo 案例 - 造境 AI",
  description: "查看造境 AI 如何把一句游戏想法拆解为世界观、角色、场景、UI、视频分镜和视觉资产 Prompt。",
}

const caseStyles: Record<string, { gradient: string; accent: string; hud: string }> = {
  "dark-myth-action": {
    gradient: "from-emerald-400/24 via-cyan-400/10 to-amber-300/18",
    accent: "text-emerald-100",
    hud: "BOSS READY · TALISMAN ON",
  },
  "cyberpunk-open-world": {
    gradient: "from-cyan-400/22 via-fuchsia-400/16 to-blue-500/18",
    accent: "text-cyan-100",
    hud: "CITY LAYER · OLD NET",
  },
  "pixel-rpg-adventure": {
    gradient: "from-amber-300/24 via-rose-300/12 to-lime-300/18",
    accent: "text-amber-100",
    hud: "MAIL x7 · STARLIGHT",
  },
}

export default function CasesPage() {
  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.13),transparent_36%,rgba(244,114,182,0.09)_64%,rgba(251,191,36,0.08))]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-32 lg:px-6">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-md border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-sm text-cyan-100">
              <Clapperboard className="h-4 w-4" />
              Official Demo Cases
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal md:text-6xl">官方 Demo 案例</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
              查看造境 AI 如何把一句游戏想法拆解为世界观、角色、场景、UI、视频分镜和视觉资产 Prompt。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                <Link href="/generate-game">
                  免费生成我的游戏世界方案
                  <Sparkles className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-md border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/submit">提交定制制作需求</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 pb-24 lg:px-6">
          <div className="grid gap-5 lg:grid-cols-3">
            {demoCases.map((demo) => {
              const style = caseStyles[demo.slug]
              return (
                <article
                  key={demo.slug}
                  className="overflow-hidden rounded-lg border border-white/12 bg-white/[0.045] shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
                >
                  <div className={`relative h-64 bg-gradient-to-br ${style.gradient}`}>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:28px_28px]" />
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between rounded-md border border-white/20 bg-black/45 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-neutral-200">
                      <span>{demo.subtitle}</span>
                      <span className={style.accent}>Demo</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 rounded-md border border-white/15 bg-black/55 p-4 backdrop-blur">
                      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-neutral-300">
                        <span>{style.hud}</span>
                        <span>Prompt Pack</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {Array.from({ length: 14 }).map((_, index) => (
                          <span
                            key={index}
                            className={`h-2 rounded-sm ${index % 4 === 0 ? "bg-cyan-200/80" : index % 5 === 0 ? "bg-amber-200/80" : "bg-white/18"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h2 className="text-2xl font-semibold">{demo.title}</h2>
                    <p className="mt-2 text-sm text-cyan-100">{demo.subtitle}</p>
                    <p className="mt-4 min-h-[96px] text-sm leading-7 text-neutral-300">{demo.oneSentencePitch}</p>
                    <div className="mt-5 grid gap-2 text-sm text-neutral-300">
                      <InfoLine icon={Gamepad2} label="类型" value={demo.genre} />
                      <InfoLine icon={Palette} label="画风" value={demo.artStyle} />
                      <InfoLine icon={Clapperboard} label="平台" value={demo.targetPlatform} />
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Button asChild className="rounded-md bg-white text-black hover:bg-neutral-200">
                        <Link href={`/cases/${demo.slug}`}>
                          查看案例
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-md border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                      >
                        <Link href={`/generate-game?case=${demo.slug}`}>生成类似方案</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

function InfoLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-2 rounded-md border border-white/10 bg-black/25 px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className="leading-6">{value}</span>
    </div>
  )
}
