"use client"

import { useState } from "react"
import type React from "react"
import { Check, Clipboard, Crown, Film, Layers3, Map, Monitor, Package, Sparkles, Swords, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { GeneratedGameWorld } from "@/lib/ai-game-projects"

const assetPromptLabels: Record<keyof GeneratedGameWorld["asset_prompts"], string> = {
  character_concept_art: "角色概念图",
  environment_concept_art: "场景概念图",
  ui_mockups: "UI Mockup",
  sprite_sheet: "Sprite Sheet",
  video_storyboard: "视频分镜",
}

function ListItems({ items }: { items?: string[] }) {
  if (!items?.length) {
    return <p className="text-sm text-neutral-500">暂无内容</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-neutral-300">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-cyan-200" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function CopyButton({ value, label = "复制 Prompt" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!value) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
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
      {copied ? "已复制" : label}
    </Button>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Sparkles
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyan-200" />
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function AIGameWorldResult({ result }: { result: GeneratedGameWorld }) {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-cyan-200/20 bg-cyan-200/[0.07] p-6 shadow-[0_0_42px_rgba(34,211,238,0.11)]">
        <p className="text-sm uppercase tracking-[0.22em] text-cyan-100">Generated Game World</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal md:text-5xl">{result.title || "未命名游戏项目"}</h1>
        <p className="mt-4 text-lg leading-8 text-neutral-100">{result.one_sentence_pitch}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Section title="世界观" icon={Map}>
          <p className="text-sm leading-7 text-neutral-300">{result.worldview}</p>
        </Section>
        <Section title="核心玩法" icon={Swords}>
          <p className="text-sm leading-7 text-neutral-300">{result.core_gameplay}</p>
        </Section>
        <Section title="玩家幻想" icon={Sparkles}>
          <p className="text-sm leading-7 text-neutral-300">{result.player_fantasy}</p>
        </Section>
      </div>

      <Section title="主角设定" icon={UserRound}>
        <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h3 className="text-2xl font-semibold">{result.protagonist?.name || "未命名主角"}</h3>
            <p className="mt-2 text-sm leading-7 text-cyan-100">{result.protagonist?.identity}</p>
            <p className="mt-4 text-sm leading-7 text-neutral-300">{result.protagonist?.appearance}</p>
            <p className="mt-4 text-sm leading-7 text-neutral-400">{result.protagonist?.personality}</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium text-neutral-200">能力组</h4>
            <ListItems items={result.protagonist?.abilities} />
          </div>
        </div>
      </Section>

      <Section title="Boss 设定" icon={Crown}>
        <div className="grid gap-4 lg:grid-cols-3">
          {result.bosses?.map((boss) => (
            <article key={boss.name} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <h3 className="text-lg font-semibold">{boss.name}</h3>
              <p className="mt-2 text-sm leading-6 text-cyan-100">{boss.concept}</p>
              <p className="mt-3 text-sm leading-6 text-neutral-400">{boss.visual_style}</p>
              <div className="mt-4">
                <ListItems items={boss.mechanics} />
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="场景设定" icon={Layers3}>
        <div className="grid gap-4 lg:grid-cols-3">
          {result.scenes?.map((scene) => (
            <article key={scene.name} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold">{scene.name}</h3>
                <CopyButton value={scene.image_prompt} label="复制" />
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-300">{scene.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {scene.visual_keywords?.map((keyword) => (
                  <span key={keyword} className="rounded border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-neutral-300">
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="mt-4 break-words rounded-md border border-white/10 bg-black/30 p-3 text-xs leading-5 text-neutral-400">
                {scene.image_prompt}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="UI 截图方案" icon={Monitor}>
        <div className="grid gap-4 md:grid-cols-2">
          {result.ui_screens?.map((screen) => (
            <article key={screen.name} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{screen.name}</h3>
                  <p className="mt-2 text-sm text-cyan-100">{screen.purpose}</p>
                </div>
                <CopyButton value={screen.image_prompt} label="复制" />
              </div>
              <p className="mt-4 text-sm leading-7 text-neutral-300">{screen.layout_description}</p>
              <p className="mt-4 break-words rounded-md border border-white/10 bg-black/30 p-3 text-xs leading-5 text-neutral-400">
                {screen.image_prompt}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="素材生成 Prompt" icon={Package}>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(assetPromptLabels) as Array<keyof GeneratedGameWorld["asset_prompts"]>).map((key) => {
            const prompts = result.asset_prompts?.[key] || []
            return (
              <article key={key} className="rounded-lg border border-white/10 bg-black/25 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{assetPromptLabels[key]}</h3>
                  <CopyButton value={prompts.join("\n\n")} label="复制全部" />
                </div>
                <div className="space-y-3">
                  {prompts.map((prompt) => (
                    <p key={prompt} className="break-words rounded-md border border-white/10 bg-black/30 p-3 text-xs leading-5 text-neutral-300">
                      {prompt}
                    </p>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Pitch Deck 大纲" icon={Film}>
          <ListItems items={result.pitch_deck_outline} />
        </Section>
        <Section title="下一步建议" icon={Sparkles}>
          <ListItems items={result.next_steps} />
        </Section>
      </div>
    </div>
  )
}
