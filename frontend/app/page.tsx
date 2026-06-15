import Link from "next/link"
import {
  ArrowRight,
  Box,
  Boxes,
  CheckCircle2,
  Clapperboard,
  Compass,
  Film,
  Gamepad2,
  Layers3,
  MonitorUp,
  Package,
  Play,
  Send,
  Sparkles,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/ui/navbar"

const painPoints = [
  "有游戏想法，但不会美术",
  "想做 Demo，但没有团队",
  "想招商融资，但缺视觉材料",
  "想发 AI 游戏短视频，但缺稳定产出流程",
  "AI 工具太散，生成结果不能直接变成项目资产",
]

const capabilities = [
  { title: "游戏世界观生成", icon: Compass },
  { title: "角色设定图", icon: Gamepad2 },
  { title: "场景设定图", icon: Sparkles },
  { title: "UI 游戏截图", icon: MonitorUp },
  { title: "视频分镜方案", icon: Film },
  { title: "2D sprite sheet", icon: Layers3 },
  { title: "3D 资产方向", icon: Box },
  { title: "游戏 Pitch 包", icon: Package },
  { title: "可交互 Demo 方案", icon: Play },
]

const demos = [
  {
    slug: "dark-myth-action",
    title: "国风暗黑动作游戏",
    subtitle: "Oriental Dark Action",
    description: "查看 AI 生成的国风暗黑世界观、斩妖主角、Boss、场景、UI、视频分镜和资产 Prompt。",
    tags: ["横版动作", "Boss 战", "技能 UI"],
    gradient: "from-emerald-400/22 via-cyan-400/10 to-amber-300/18",
    accent: "text-emerald-200",
    hud: "HP 82% · QTE READY",
  },
  {
    slug: "cyberpunk-open-world",
    title: "赛博朋克开放世界",
    subtitle: "Neon Open World",
    description: "查看霓虹都市、飞行摩托、城市断层地图、任务 UI 和宣传片分镜样板。",
    tags: ["开放世界", "任务系统", "载具追逐"],
    gradient: "from-cyan-400/22 via-fuchsia-400/14 to-blue-400/16",
    accent: "text-cyan-200",
    hud: "MISSION SYNC · 03:21",
  },
  {
    slug: "pixel-rpg-adventure",
    title: "像素 RPG 冒险游戏",
    subtitle: "Pixel RPG Adventure",
    description: "查看温暖像素 RPG 如何拆解送信叙事、角色 sprite、场景、UI 和 Pitch 大纲。",
    tags: ["像素风", "地牢", "Sprite"],
    gradient: "from-amber-300/22 via-rose-400/10 to-lime-300/16",
    accent: "text-amber-200",
    hud: "ITEM x12 · DIALOG ON",
  },
]

const workflow = [
  { step: "01", title: "输入游戏想法", description: "用一句话、一个世界观或一段玩法描述开始。" },
  { step: "02", title: "AI 生成方案初稿", description: "整理世界观、角色、场景、UI、镜头和资产 Prompt。" },
  { step: "03", title: "进入项目工作台", description: "复制 Prompt、调整模块，并把概念方案继续细化。" },
  { step: "04", title: "提交定制需求", description: "需要宣传片、素材包或 Demo 时，再进入人工报价和制作流程。" },
]

const plans = [
  {
    name: "基础概念包",
    price: "199-499 元",
    features: ["游戏名称", "世界观", "角色图", "场景图", "UI 风格图"],
  },
  {
    name: "AI 游戏宣传片",
    price: "999-2999 元",
    features: ["15-30 秒类游戏宣传片", "竖屏版", "横屏版", "主视觉图"],
  },
  {
    name: "游戏 Pitch 包",
    price: "2999-9999 元",
    features: ["宣传片", "设定文档", "角色场景", "UI", "项目介绍页", "招商展示材料"],
  },
  {
    name: "可交互 Demo",
    price: "10000 元起",
    features: ["Unity / WebGL 原型", "角色控制", "基础战斗", "简单关卡", "在线演示链接"],
  },
]

function EnginePreview() {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-cyan-300/20 bg-black/45 shadow-[0_0_70px_rgba(34,211,238,0.16)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,182,212,0.18),transparent_32%,rgba(244,114,182,0.16)_58%,transparent_78%)]" />
      <div className="relative z-10 flex h-full min-h-[360px] flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-cyan-100/80">
          <span>World Engine</span>
          <span>Prototype 01</span>
        </div>

        <div className="mx-auto grid w-full max-w-md grid-cols-5 gap-2">
          {Array.from({ length: 25 }).map((_, index) => (
            <div
              key={index}
              className={`aspect-square rounded border ${
                index === 7 || index === 13 || index === 17
                  ? "border-amber-300/70 bg-amber-300/20 shadow-[0_0_22px_rgba(252,211,77,0.28)]"
                  : index === 11 || index === 12
                    ? "border-cyan-300/70 bg-cyan-300/20 shadow-[0_0_22px_rgba(34,211,238,0.3)]"
                    : "border-white/10 bg-white/[0.03]"
              }`}
            />
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {["角色生成", "场景拼装", "Demo 编排"].map((item, index) => (
            <div key={item} className="rounded border border-white/12 bg-white/[0.06] p-3 backdrop-blur">
              <div className="mb-2 flex items-center gap-2 text-xs text-neutral-300">
                <span className="h-1.5 w-1.5 rounded-sm bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                {item}
              </div>
              <div className="h-1.5 rounded-sm bg-white/10">
                <div
                  className="h-full rounded-sm bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300"
                  style={{ width: `${62 + index * 12}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),transparent_30%,rgba(244,114,182,0.12)_58%,rgba(250,204,21,0.08))]" />
          <div className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-10 px-4 pb-24 pt-32 md:grid-cols-[1.02fr_0.98fr] lg:px-6">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.18)]">
                <Zap className="h-4 w-4" />
                造境 AI · AI 游戏原型生成平台
              </div>
              <h1 className="text-5xl font-bold tracking-normal text-white md:text-7xl">
                造境 AI
                <span className="mt-3 block bg-gradient-to-r from-cyan-200 via-white to-amber-200 bg-clip-text text-4xl text-transparent md:text-6xl">
                  一句话生成游戏世界方案
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
                输入一个游戏想法，生成世界观、角色、场景、UI、视频分镜和 Pitch 初稿；需要宣传片、素材包或可交互 Demo 时，再提交定制制作需求。
              </p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400">
                适合游戏创业者、独立开发者、短视频创作者、AI 创作者、游戏工作室做概念验证和招商展示。
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                  <Link href="/generate-game">
                    免费生成概念方案
                    <Sparkles className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-md border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/cases">
                    查看官方 Demo 案例
                    <Clapperboard className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-md border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/submit">
                    提交定制制作需求
                    <Send className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <EnginePreview />
          </div>
        </section>

        <section id="pain" className="border-b border-white/10 bg-[#07090f] py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-200">Problem</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">想法很多，第一版视觉原型最难落地</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {painPoints.map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                  <CheckCircle2 className="mb-5 h-5 w-5 text-rose-200" />
                  <p className="text-base leading-7 text-neutral-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="solutions" className="border-b border-white/10 bg-[#050608] py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-amber-200">Solution</p>
                <h2 className="mt-3 text-3xl font-semibold md:text-5xl">从游戏想法到可展示原型的一站式路径</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-neutral-400">
                第一阶段先用 AI 生成概念方案和可复制 Prompt，再通过人工制作把高意向项目升级成能展示、能传播、能继续开发的资产。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map(({ title, icon: Icon }) => (
                <div
                  key={title}
                  className="group rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-5 transition hover:border-cyan-200/45 hover:shadow-[0_0_34px_rgba(34,211,238,0.12)]"
                >
                  <Icon className="mb-5 h-6 w-6 text-cyan-200" />
                  <h3 className="text-lg font-medium text-white">{title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="demos" className="border-b border-white/10 bg-[#080a10] py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.22em] text-fuchsia-200">Demo Cases</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">查看 AI 生成的游戏世界方案样板</h2>
              <p className="mt-5 text-sm leading-7 text-neutral-400">
                查看角色、Boss、场景、UI、视频分镜和资产 Prompt 如何从一句想法拆解出来。
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {demos.map((demo) => (
                <article
                  key={demo.title}
                  className="overflow-hidden rounded-lg border border-white/12 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
                >
                  <div className={`relative h-60 bg-gradient-to-br ${demo.gradient}`}>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:28px_28px]" />
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between rounded border border-white/20 bg-black/45 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-neutral-200">
                      <span>{demo.subtitle}</span>
                      <span className={demo.accent}>LIVE HUD</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 rounded border border-white/15 bg-black/55 p-4 backdrop-blur">
                      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-neutral-300">
                        <span>{demo.hud}</span>
                        <span>FPS 60</span>
                      </div>
                      <div className="h-2 rounded-sm bg-white/10">
                        <div className="h-full w-3/4 rounded-sm bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold">{demo.title}</h3>
                    <p className="mt-3 min-h-[56px] text-sm leading-7 text-neutral-300">{demo.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {demo.tags.map((tag) => (
                        <span key={tag} className="rounded border border-white/12 bg-white/[0.06] px-2.5 py-1 text-xs text-neutral-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button asChild className="mt-6 w-full rounded-md bg-white text-black hover:bg-neutral-200">
                      <Link href={`/cases/${demo.slug}`}>
                        查看案例
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                <Link href="/cases">查看全部官方 Demo 案例</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-md border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/generate-game">免费生成我的游戏世界方案</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b border-white/10 bg-[#050608] py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-200">Workflow</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">从一句话到第一版交付物</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {workflow.map((item) => (
                <div key={item.step} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-7 font-mono text-3xl font-semibold text-cyan-200">{item.step}</div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b border-white/10 bg-[#080a10] py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-amber-200">Pricing</p>
                <h2 className="mt-3 text-3xl font-semibold md:text-5xl">会员 / 服务套餐</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-neutral-400">
                第一阶段先卖交付结果，不强行承诺全自动平台。套餐按钮会先进入需求提交页，便于确认范围和报价。
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              {plans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`rounded-lg border p-5 ${
                    index === 2
                      ? "border-amber-200/45 bg-amber-200/[0.07] shadow-[0_0_34px_rgba(251,191,36,0.12)]"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-4 text-2xl font-bold text-cyan-100">{plan.price}</div>
                  <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-7 w-full rounded-md bg-white text-black hover:bg-neutral-200">
                    <Link href="/submit">提交需求</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="vision" className="border-b border-white/10 bg-[#050608] py-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[0.9fr_1.1fr] lg:px-6">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-fuchsia-200">Vision</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">从游戏原型，到 AI 交互世界</h2>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <Boxes className="mb-5 h-8 w-8 text-fuchsia-200" />
              <p className="text-lg leading-9 text-neutral-200">
                当前阶段先生成游戏世界方案、视觉 Prompt 和 Pitch 初稿；有明确方向后，可提交需求升级为宣传片、素材包或可交互 Demo 的定制制作流程。
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#080a10] py-24">
          <div className="mx-auto max-w-4xl px-4 text-center lg:px-6">
            <Clapperboard className="mx-auto mb-6 h-10 w-10 text-cyan-200" />
            <h2 className="text-3xl font-semibold md:text-5xl">把你的游戏想法变成第一版视觉原型</h2>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                <Link href="/generate-game">免费生成概念方案</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-md border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/submit">提交定制制作需求</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-md border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#pricing">查看价格</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
