import type { Metadata } from "next"
import type React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { existsSync } from "fs"
import path from "path"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeft,
  ArrowRight,
  Clapperboard,
  Compass,
  Crown,
  Film,
  Gamepad2,
  ImageIcon,
  Layers3,
  Lightbulb,
  Map,
  Monitor,
  Package,
  Palette,
  Sparkles,
  Swords,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/ui/navbar"
import { demoCases, getDemoCase, type DemoCase } from "@/lib/demo-cases"

const visualStyles: Record<string, { gradient: string; accent: string; gridAccent: string }> = {
  "dark-myth-action": {
    gradient: "from-emerald-400/24 via-cyan-400/10 to-amber-300/18",
    accent: "text-emerald-100",
    gridAccent: "bg-emerald-200/80",
  },
  "cyberpunk-open-world": {
    gradient: "from-cyan-400/22 via-fuchsia-400/16 to-blue-500/18",
    accent: "text-cyan-100",
    gridAccent: "bg-fuchsia-200/80",
  },
  "pixel-rpg-adventure": {
    gradient: "from-amber-300/24 via-rose-300/12 to-lime-300/18",
    accent: "text-amber-100",
    gridAccent: "bg-amber-200/80",
  },
}

const galleryTypeLabels: Record<NonNullable<DemoCase["gallery"]>[number]["type"], string> = {
  character: "角色图",
  boss: "Boss 图",
  scene: "场景图",
  ui: "UI 截图",
  storyboard: "封面 / 分镜",
}

function publicImageExists(image?: string) {
  if (!image || !image.startsWith("/")) {
    return false
  }
  return existsSync(path.join(process.cwd(), "public", image.slice(1)))
}

export function generateStaticParams() {
  return demoCases.map((item) => ({ slug: item.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const demo = getDemoCase(params.slug)
  if (!demo) {
    return {
      title: "案例不存在 - 造境 AI",
    }
  }
  return {
    title: `${demo.title} - 官方 Demo 案例 - 造境 AI`,
    description: demo.oneSentencePitch,
  }
}

export default function CaseDetailPage({ params }: { params: { slug: string } }) {
  const demo = getDemoCase(params.slug)
  if (!demo) {
    notFound()
  }

  const style = visualStyles[demo.slug]

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.13),transparent_36%,rgba(244,114,182,0.09)_64%,rgba(251,191,36,0.08))]" />

        <section className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-16 pt-32 lg:grid-cols-[0.95fr_1.05fr] lg:px-6">
          <div>
            <Button
              asChild
              variant="outline"
              className="mb-8 rounded-md border-white/15 bg-white/[0.04] text-neutral-200 hover:bg-white/10 hover:text-white"
            >
              <Link href="/cases">
                <ArrowLeft className="h-4 w-4" />
                返回案例列表
              </Link>
            </Button>
            <p className="inline-flex items-center gap-2 rounded-md border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              {demo.subtitle}
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal md:text-6xl">{demo.title}</h1>
            <p className="mt-5 max-w-2xl text-xl leading-9 text-neutral-200">{demo.oneSentencePitch}</p>
            <div className="mt-6 grid gap-3 text-sm text-neutral-300 md:grid-cols-3">
              <MetaCard icon={Gamepad2} label="类型" value={demo.genre} />
              <MetaCard icon={Palette} label="画风" value={demo.artStyle} />
              <MetaCard icon={Monitor} label="平台" value={demo.targetPlatform} />
            </div>
            <div className="mt-6 rounded-lg border border-white/10 bg-black/25 p-5">
              <div className="text-sm text-neutral-500">原始想法</div>
              <p className="mt-2 text-sm leading-7 text-neutral-300">{demo.originalIdea}</p>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                <Link href={`/generate-game?case=${demo.slug}`}>
                  基于这个案例生成我的版本
                  <Sparkles className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-md border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/submit">提交定制需求</Link>
              </Button>
            </div>
          </div>

          <HeroVisual demo={demo} gradient={style.gradient} accent={style.accent} gridAccent={style.gridAccent} />
        </section>

        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-24 lg:px-6">
          <ContentSection title="视觉预览区" icon={ImageIcon}>
            <p className="text-sm leading-7 text-neutral-400">
              这里预留官方 Demo 图片展示结构。当前仓库不包含图片文件时，会显示占位卡片和生成 Prompt；后续手动放入约定路径图片后，页面会展示真实图片。
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {(demo.gallery || []).map((item) => (
                <VisualPreviewCard
                  key={`${item.type}-${item.title}`}
                  item={item}
                  imageExists={publicImageExists(item.image)}
                  gradient={style.gradient}
                />
              ))}
            </div>
          </ContentSection>

          <ContentSection title="世界观" icon={Compass}>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <TextBlock label="概要" value={demo.worldview.summary} />
              <div className="grid gap-4">
                <TextBlock label="时代与场域" value={demo.worldview.setting} />
                <TextBlock label="核心冲突" value={demo.worldview.conflict} />
              </div>
            </div>
            <TagGroup label="势力" items={demo.worldview.factions} />
            <TagGroup label="氛围关键词" items={demo.worldview.toneKeywords} />
          </ContentSection>

          <ContentSection title="核心玩法" icon={Swords}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextBlock label="玩法概要" value={demo.coreGameplay.summary} />
              <TextBlock label="核心循环" value={demo.coreGameplay.loop} />
              <TextBlock label="战斗 / 交互" value={demo.coreGameplay.combat} />
              <TextBlock label="成长系统" value={demo.coreGameplay.progression} />
            </div>
            <TextBlock label="独特钩子" value={demo.coreGameplay.uniqueHook} />
          </ContentSection>

          <ContentSection title="主角设定" icon={UserRound}>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="grid gap-4">
                <TextBlock label={demo.protagonist.name} value={`${demo.protagonist.identity}\n${demo.protagonist.appearance}`} />
                <TagGroup label="能力" items={demo.protagonist.abilities} />
              </div>
              <PromptBlock label="主角视觉 Prompt" value={demo.protagonist.visualPrompt} />
            </div>
          </ContentSection>

          <ContentSection title="Boss 设定" icon={Crown}>
            <div className="grid gap-4 lg:grid-cols-3">
              {demo.bosses.map((boss) => (
                <article key={boss.name} className="rounded-lg border border-white/10 bg-black/25 p-5">
                  <h3 className="text-xl font-semibold">{boss.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">{boss.concept}</p>
                  <p className="mt-3 text-sm leading-7 text-neutral-400">{boss.visualStyle}</p>
                  <TagGroup label="机制" items={boss.mechanics} compact />
                  <PromptBlock label="Boss Prompt" value={boss.visualPrompt} />
                </article>
              ))}
            </div>
          </ContentSection>

          <ContentSection title="场景设定" icon={Map}>
            <div className="grid gap-4 lg:grid-cols-3">
              {demo.scenes.map((scene) => (
                <AssetCard
                  key={scene.name}
                  title={scene.name}
                  description={scene.description}
                  tags={scene.visualKeywords}
                  prompt={scene.imagePrompt}
                  promptLabel="场景 Prompt"
                />
              ))}
            </div>
          </ContentSection>

          <ContentSection title="UI 页面设定" icon={Monitor}>
            <div className="grid gap-4 lg:grid-cols-2">
              {demo.uiScreens.map((screen) => (
                <AssetCard
                  key={screen.name}
                  title={screen.name}
                  description={`${screen.purpose}\n${screen.layoutDescription}`}
                  tags={["UI Mockup", "可读性", "可拆解"]}
                  prompt={screen.imagePrompt}
                  promptLabel="UI Prompt"
                />
              ))}
            </div>
          </ContentSection>

          <ContentSection title="视频分镜" icon={Film}>
            <div className="grid gap-4">
              {demo.videoStoryboard.map((shot) => (
                <article key={shot.shot} className="rounded-lg border border-white/10 bg-black/25 p-5">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="text-sm text-cyan-100">Shot {shot.shot} · {shot.duration}</div>
                      <h3 className="mt-2 text-xl font-semibold">{shot.caption}</h3>
                    </div>
                    <span className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-neutral-300">{shot.camera}</span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <TextBlock label="画面" value={shot.visual} />
                    <TextBlock label="动作" value={shot.action} />
                  </div>
                  <PromptBlock label="视频分镜 Prompt" value={shot.videoPrompt} />
                </article>
              ))}
            </div>
          </ContentSection>

          <ContentSection title="视觉资产 Prompt" icon={Layers3}>
            <PromptGroup title="角色概念图" items={demo.assetPrompts.characterConceptArt} />
            <PromptGroup title="环境概念图" items={demo.assetPrompts.environmentConceptArt} />
            <PromptGroup title="UI Mockup" items={demo.assetPrompts.uiMockups} />
            <PromptGroup title="Sprite Sheet" items={demo.assetPrompts.spriteSheet} />
            <PromptGroup title="视频分镜" items={demo.assetPrompts.videoStoryboard} />
          </ContentSection>

          <ContentSection title="Pitch 大纲" icon={Package}>
            <NumberedList items={demo.pitchDeckOutline} />
          </ContentSection>

          <ContentSection title="下一步升级方向" icon={Lightbulb}>
            <NumberedList items={demo.nextSteps} />
          </ContentSection>

          <section className="rounded-lg border border-cyan-200/20 bg-cyan-200/[0.07] p-6 text-center">
            <h2 className="text-2xl font-semibold md:text-4xl">把你的游戏想法拆成第一版方案</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-neutral-300">
              免费生成游戏世界方案；需要宣传片、素材包或可交互 Demo 时，再提交定制需求进入制作评估。
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100">
                <Link href={`/generate-game?case=${demo.slug}`}>基于这个案例生成我的版本</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-md border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/submit">
                  需要宣传片/素材包/可交互 Demo，提交定制需求
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function HeroVisual({
  demo,
  gradient,
  accent,
  gridAccent,
}: {
  demo: DemoCase
  gradient: string
  accent: string
  gridAccent: string
}) {
  return (
    <div className={`relative min-h-[460px] overflow-hidden rounded-lg border border-white/12 bg-gradient-to-br ${gradient} shadow-[0_24px_80px_rgba(0,0,0,0.32)]`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="absolute left-5 right-5 top-5 flex items-center justify-between rounded-md border border-white/20 bg-black/45 px-4 py-3 text-xs uppercase tracking-[0.16em] text-neutral-200">
        <span>{demo.subtitle}</span>
        <span className={accent}>World Plan</span>
      </div>
      <div className="absolute inset-x-8 top-28 grid grid-cols-5 gap-2">
        {Array.from({ length: 25 }).map((_, index) => (
          <span
            key={index}
            className={`aspect-square rounded-md border ${index === 6 || index === 12 || index === 18 ? `border-white/40 ${gridAccent}` : "border-white/12 bg-black/20"}`}
          />
        ))}
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/15 bg-black/60 p-5 backdrop-blur">
        <div className="mb-4 flex items-center justify-between text-sm text-neutral-300">
          <span>{demo.genre}</span>
          <span>Assets · {demo.scenes.length + demo.bosses.length + demo.uiScreens.length}</span>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {["世界观", "角色 Boss", "资产 Prompt"].map((item, index) => (
            <div key={item} className="rounded-md border border-white/10 bg-white/[0.05] p-3">
              <div className="text-xs text-neutral-500">0{index + 1}</div>
              <div className="mt-2 text-sm text-white">{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetaCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <Icon className="mb-3 h-5 w-5 text-cyan-200" />
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-2 text-sm leading-6 text-neutral-300">{value}</div>
    </div>
  )
}

function VisualPreviewCard({
  item,
  imageExists,
  gradient,
}: {
  item: NonNullable<DemoCase["gallery"]>[number]
  imageExists: boolean
  gradient: string
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-black/25">
      <div className={`relative aspect-video bg-gradient-to-br ${gradient}`}>
        {imageExists && item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col justify-between p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-md border border-white/15 bg-black/35 px-3 py-1 text-xs text-neutral-200">
                {galleryTypeLabels[item.type]}
              </span>
              <span className="rounded-md border border-amber-200/25 bg-amber-200/[0.12] px-3 py-1 text-xs text-amber-100">
                等待生成图片
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 18 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-3 rounded-sm ${index % 5 === 0 ? "bg-cyan-200/70" : index % 7 === 0 ? "bg-amber-200/70" : "bg-white/15"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-200">
              <ImageIcon className="h-4 w-4 text-cyan-100" />
              <span>占位预览</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold">{item.title}</h3>
          <span className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-neutral-300">
            {galleryTypeLabels[item.type]}
          </span>
        </div>
        <p className="mt-3 text-sm leading-7 text-neutral-400">
          用途：作为官方 Demo 的{galleryTypeLabels[item.type]}预览素材，后续可手动放入 <span className="text-neutral-200">{item.image || "约定图片路径"}</span>。
        </p>
        <PromptBlock label="生成 Prompt" value={item.prompt} />
      </div>
    </article>
  )
}

function ContentSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyan-200" />
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="text-sm text-neutral-500">{label}</div>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-neutral-300">{value}</p>
    </div>
  )
}

function TagGroup({ label, items, compact }: { label: string; items: string[]; compact?: boolean }) {
  return (
    <div className={compact ? "mt-4" : ""}>
      <div className="mb-2 text-sm text-neutral-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs leading-5 text-neutral-300">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function PromptBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 rounded-lg border border-cyan-200/15 bg-cyan-200/[0.055] p-4">
      <div className="text-sm text-cyan-100">{label}</div>
      <p className="mt-2 text-sm leading-7 text-neutral-200">{value}</p>
    </div>
  )
}

function AssetCard({
  title,
  description,
  tags,
  prompt,
  promptLabel,
}: {
  title: string
  description: string
  tags: string[]
  prompt: string
  promptLabel: string
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/25 p-5">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-300">{description}</p>
      <TagGroup label="关键词" items={tags} compact />
      <PromptBlock label={promptLabel} value={prompt} />
    </article>
  )
}

function PromptGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <p key={item} className="rounded-md border border-cyan-200/15 bg-cyan-200/[0.045] p-3 text-sm leading-7 text-neutral-200">
            {item}
          </p>
        ))}
      </div>
    </div>
  )
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div key={item} className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4 md:grid-cols-[48px_1fr] md:items-start">
          <div className="font-mono text-2xl font-semibold text-cyan-200">{String(index + 1).padStart(2, "0")}</div>
          <p className="text-sm leading-7 text-neutral-300">{item}</p>
        </div>
      ))}
    </div>
  )
}
