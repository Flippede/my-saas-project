"use client"

import { useMemo, useState } from "react"
import type React from "react"
import type { LucideIcon } from "lucide-react"
import {
  Check,
  Clipboard,
  Crown,
  Film,
  Layers3,
  Loader2,
  Map,
  Monitor,
  Package,
  RefreshCw,
  Sparkles,
  Swords,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AIGameProjectSection, GeneratedGameWorld } from "@/lib/ai-game-projects"

const assetPromptLabels: Record<keyof GeneratedGameWorld["asset_prompts"], string> = {
  character_concept_art: "角色概念图",
  environment_concept_art: "场景概念图",
  ui_mockups: "UI Mockup",
  sprite_sheet: "Sprite Sheet",
  video_storyboard: "视频分镜",
}

type ModuleProps = {
  title: string
  icon: LucideIcon
  section: AIGameProjectSection
  copyValue: string
  promptValue?: string
  enableRegeneration?: boolean
  loading?: boolean
  instruction?: string
  error?: string
  onInstructionChange?: (value: string) => void
  onRegenerate?: (section: AIGameProjectSection) => void
  children: React.ReactNode
}

function stringifyForCopy(value: unknown) {
  if (typeof value === "string") {
    return value
  }
  return JSON.stringify(value, null, 2)
}

function joinLines(items?: string[]) {
  return (items || []).filter(Boolean).join("\n")
}

function getWorldviewLines(result: GeneratedGameWorld) {
  const worldview = result.worldview
  if (typeof worldview === "string") {
    return [["概要", worldview]]
  }
  return [
    ["概要", worldview?.summary],
    ["时代与场域", worldview?.setting],
    ["核心冲突", worldview?.conflict],
    ["势力", worldview?.factions?.join(" / ")],
    ["氛围关键词", worldview?.tone_keywords?.join(" / ")],
  ].filter(([, value]) => value)
}

function getCoreGameplayLines(result: GeneratedGameWorld) {
  const gameplay = result.core_gameplay
  if (typeof gameplay === "string") {
    return [["概要", gameplay]]
  }
  return [
    ["概要", gameplay?.summary],
    ["循环", gameplay?.loop],
    ["战斗", gameplay?.combat],
    ["成长", gameplay?.progression],
    ["独特钩子", gameplay?.unique_hook],
  ].filter(([, value]) => value)
}

function getNextSteps(result: GeneratedGameWorld) {
  return result.development_next_steps?.length ? result.development_next_steps : result.next_steps || []
}

function getAllPrompts(result: GeneratedGameWorld) {
  const prompts: string[] = []
  if (result.protagonist?.visual_prompt) {
    prompts.push(result.protagonist.visual_prompt)
  }
  result.bosses?.forEach((boss) => boss.visual_prompt && prompts.push(boss.visual_prompt))
  result.scenes?.forEach((scene) => scene.image_prompt && prompts.push(scene.image_prompt))
  result.ui_screens?.forEach((screen) => screen.image_prompt && prompts.push(screen.image_prompt))
  result.video_storyboard?.forEach((shot) => shot.video_prompt && prompts.push(shot.video_prompt))
  Object.values(result.asset_prompts || {}).forEach((items) => prompts.push(...items))
  return prompts
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

function KeyValueList({ items }: { items: Array<(string | undefined)[]> }) {
  return (
    <div className="grid gap-3">
      {items.map(([label, value]) => (
        <div key={`${label}-${value}`} className="rounded-md border border-white/10 bg-black/25 p-3">
          <div className="text-xs text-neutral-500">{label}</div>
          <div className="mt-1 text-sm leading-6 text-neutral-300">{value || "--"}</div>
        </div>
      ))}
    </div>
  )
}

function CopyButton({ value, label = "复制" }: { value: string; label?: string }) {
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

function WorkbenchModule({
  title,
  icon: Icon,
  section,
  copyValue,
  promptValue,
  enableRegeneration,
  loading,
  instruction,
  error,
  onInstructionChange,
  onRegenerate,
  children,
}: ModuleProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur md:p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-cyan-200" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={copyValue} label="复制内容" />
          <CopyButton value={promptValue || copyValue} label="复制 Prompt" />
          {enableRegeneration ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onRegenerate?.(section)}
              disabled={loading}
              className="rounded-md bg-cyan-200 text-black hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              重新生成
            </Button>
          ) : null}
        </div>
      </div>

      {enableRegeneration ? (
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
          <textarea
            value={instruction || ""}
            onChange={(event) => onInstructionChange?.(event.target.value)}
            rows={2}
            placeholder="补充要求，例如：减少赛博元素，强化国风暗黑斩妖感"
            className="min-h-[72px] w-full resize-y rounded-md border border-white/12 bg-black/30 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-200/55"
          />
          {error ? <p className="rounded-md border border-red-400/25 bg-red-400/[0.08] px-3 py-2 text-sm text-red-100">{error}</p> : null}
        </div>
      ) : null}

      {children}
    </section>
  )
}

export function AIGameWorldResult({
  result,
  enableRegeneration = false,
  onRegenerateSection,
}: {
  result: GeneratedGameWorld
  enableRegeneration?: boolean
  onRegenerateSection?: (section: AIGameProjectSection, instruction: string) => Promise<void>
}) {
  const [instructions, setInstructions] = useState<Partial<Record<AIGameProjectSection, string>>>({})
  const [loadingSection, setLoadingSection] = useState<AIGameProjectSection | "">("")
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<AIGameProjectSection, string>>>({})

  const worldviewLines = useMemo(() => getWorldviewLines(result), [result])
  const gameplayLines = useMemo(() => getCoreGameplayLines(result), [result])
  const nextSteps = useMemo(() => getNextSteps(result), [result])
  const allPrompts = useMemo(() => getAllPrompts(result), [result])

  async function handleRegenerate(section: AIGameProjectSection) {
    if (!onRegenerateSection) {
      return
    }

    setLoadingSection(section)
    setSectionErrors((current) => ({ ...current, [section]: "" }))
    try {
      await onRegenerateSection(section, instructions[section] || "")
    } catch (error) {
      setSectionErrors((current) => ({
        ...current,
        [section]: error instanceof Error ? error.message : "重新生成失败。",
      }))
    } finally {
      setLoadingSection("")
    }
  }

  function setInstruction(section: AIGameProjectSection, value: string) {
    setInstructions((current) => ({ ...current, [section]: value }))
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-cyan-200/20 bg-cyan-200/[0.07] p-6 shadow-[0_0_42px_rgba(34,211,238,0.11)]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-100">Game World Workbench</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal md:text-5xl">{result.title || "未命名游戏项目"}</h1>
            <p className="mt-4 text-lg leading-8 text-neutral-100">{result.one_sentence_pitch}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={stringifyForCopy(result)} label="复制完整 JSON" />
            <CopyButton value={joinLines(allPrompts)} label="复制全部 Prompt" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-neutral-200">
          {result.genre ? <span className="rounded border border-white/10 bg-black/20 px-3 py-1">类型：{result.genre}</span> : null}
          {result.target_player ? <span className="rounded border border-white/10 bg-black/20 px-3 py-1">目标玩家：{result.target_player}</span> : null}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <WorkbenchModule
          title="世界观"
          icon={Map}
          section="worldview"
          copyValue={stringifyForCopy(result.worldview)}
          promptValue={worldviewLines.map(([label, value]) => `${label}: ${value}`).join("\n")}
          enableRegeneration={enableRegeneration}
          loading={loadingSection === "worldview"}
          instruction={instructions.worldview}
          error={sectionErrors.worldview}
          onInstructionChange={(value) => setInstruction("worldview", value)}
          onRegenerate={handleRegenerate}
        >
          <KeyValueList items={worldviewLines} />
        </WorkbenchModule>

        <WorkbenchModule
          title="核心玩法"
          icon={Swords}
          section="core_gameplay"
          copyValue={stringifyForCopy(result.core_gameplay)}
          promptValue={gameplayLines.map(([label, value]) => `${label}: ${value}`).join("\n")}
          enableRegeneration={enableRegeneration}
          loading={loadingSection === "core_gameplay"}
          instruction={instructions.core_gameplay}
          error={sectionErrors.core_gameplay}
          onInstructionChange={(value) => setInstruction("core_gameplay", value)}
          onRegenerate={handleRegenerate}
        >
          <KeyValueList items={gameplayLines} />
        </WorkbenchModule>
      </div>

      <WorkbenchModule
        title="主角设定"
        icon={UserRound}
        section="protagonist"
        copyValue={stringifyForCopy(result.protagonist)}
        promptValue={result.protagonist?.visual_prompt}
        enableRegeneration={enableRegeneration}
        loading={loadingSection === "protagonist"}
        instruction={instructions.protagonist}
        error={sectionErrors.protagonist}
        onInstructionChange={(value) => setInstruction("protagonist", value)}
        onRegenerate={handleRegenerate}
      >
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
            {result.protagonist?.visual_prompt ? (
              <p className="mt-4 break-words rounded-md border border-white/10 bg-black/30 p-3 text-xs leading-5 text-neutral-400">
                {result.protagonist.visual_prompt}
              </p>
            ) : null}
          </div>
        </div>
      </WorkbenchModule>

      <WorkbenchModule
        title="Boss 设定"
        icon={Crown}
        section="bosses"
        copyValue={stringifyForCopy(result.bosses)}
        promptValue={joinLines(result.bosses?.map((boss) => boss.visual_prompt || "").filter(Boolean))}
        enableRegeneration={enableRegeneration}
        loading={loadingSection === "bosses"}
        instruction={instructions.bosses}
        error={sectionErrors.bosses}
        onInstructionChange={(value) => setInstruction("bosses", value)}
        onRegenerate={handleRegenerate}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {result.bosses?.map((boss) => (
            <article key={boss.name} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <h3 className="text-lg font-semibold">{boss.name}</h3>
              <p className="mt-2 text-sm leading-6 text-cyan-100">{boss.concept}</p>
              <p className="mt-3 text-sm leading-6 text-neutral-400">{boss.visual_style}</p>
              <div className="mt-4">
                <ListItems items={boss.mechanics} />
              </div>
              {boss.visual_prompt ? (
                <p className="mt-4 break-words rounded-md border border-white/10 bg-black/30 p-3 text-xs leading-5 text-neutral-400">
                  {boss.visual_prompt}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </WorkbenchModule>

      <WorkbenchModule
        title="场景设定"
        icon={Layers3}
        section="scenes"
        copyValue={stringifyForCopy(result.scenes)}
        promptValue={joinLines(result.scenes?.map((scene) => scene.image_prompt))}
        enableRegeneration={enableRegeneration}
        loading={loadingSection === "scenes"}
        instruction={instructions.scenes}
        error={sectionErrors.scenes}
        onInstructionChange={(value) => setInstruction("scenes", value)}
        onRegenerate={handleRegenerate}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {result.scenes?.map((scene) => (
            <article key={scene.name} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <h3 className="text-lg font-semibold">{scene.name}</h3>
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
      </WorkbenchModule>

      <WorkbenchModule
        title="UI 页面设定"
        icon={Monitor}
        section="ui_screens"
        copyValue={stringifyForCopy(result.ui_screens)}
        promptValue={joinLines(result.ui_screens?.map((screen) => screen.image_prompt))}
        enableRegeneration={enableRegeneration}
        loading={loadingSection === "ui_screens"}
        instruction={instructions.ui_screens}
        error={sectionErrors.ui_screens}
        onInstructionChange={(value) => setInstruction("ui_screens", value)}
        onRegenerate={handleRegenerate}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {result.ui_screens?.map((screen) => (
            <article key={screen.name} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <h3 className="text-lg font-semibold">{screen.name}</h3>
              <p className="mt-2 text-sm text-cyan-100">{screen.purpose}</p>
              <p className="mt-4 text-sm leading-7 text-neutral-300">{screen.layout_description}</p>
              <p className="mt-4 break-words rounded-md border border-white/10 bg-black/30 p-3 text-xs leading-5 text-neutral-400">
                {screen.image_prompt}
              </p>
            </article>
          ))}
        </div>
      </WorkbenchModule>

      <WorkbenchModule
        title="视频分镜"
        icon={Film}
        section="video_storyboard"
        copyValue={stringifyForCopy(result.video_storyboard || [])}
        promptValue={joinLines(result.video_storyboard?.map((shot) => shot.video_prompt))}
        enableRegeneration={enableRegeneration}
        loading={loadingSection === "video_storyboard"}
        instruction={instructions.video_storyboard}
        error={sectionErrors.video_storyboard}
        onInstructionChange={(value) => setInstruction("video_storyboard", value)}
        onRegenerate={handleRegenerate}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {result.video_storyboard?.map((shot) => (
            <article key={`${shot.shot}-${shot.caption}`} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">镜头 {shot.shot}</h3>
                <span className="rounded border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-neutral-300">{shot.duration}</span>
              </div>
              <p className="mt-3 text-sm text-cyan-100">{shot.camera}</p>
              <p className="mt-3 text-sm leading-6 text-neutral-300">{shot.visual}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{shot.action}</p>
              {shot.caption ? <p className="mt-3 text-sm font-medium text-amber-100">{shot.caption}</p> : null}
              <p className="mt-4 break-words rounded-md border border-white/10 bg-black/30 p-3 text-xs leading-5 text-neutral-400">
                {shot.video_prompt}
              </p>
            </article>
          ))}
        </div>
      </WorkbenchModule>

      <WorkbenchModule
        title="素材生成 Prompt"
        icon={Package}
        section="asset_prompts"
        copyValue={stringifyForCopy(result.asset_prompts)}
        promptValue={joinLines(Object.values(result.asset_prompts || {}).flat())}
        enableRegeneration={enableRegeneration}
        loading={loadingSection === "asset_prompts"}
        instruction={instructions.asset_prompts}
        error={sectionErrors.asset_prompts}
        onInstructionChange={(value) => setInstruction("asset_prompts", value)}
        onRegenerate={handleRegenerate}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(assetPromptLabels) as Array<keyof GeneratedGameWorld["asset_prompts"]>).map((key) => {
            const prompts = result.asset_prompts?.[key] || []
            return (
              <article key={key} className="rounded-lg border border-white/10 bg-black/25 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{assetPromptLabels[key]}</h3>
                  <CopyButton value={prompts.join("\n\n")} label="复制本组" />
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
      </WorkbenchModule>

      <div className="grid gap-5 lg:grid-cols-2">
        <WorkbenchModule
          title="Pitch 大纲"
          icon={Sparkles}
          section="pitch_deck_outline"
          copyValue={joinLines(result.pitch_deck_outline)}
          enableRegeneration={enableRegeneration}
          loading={loadingSection === "pitch_deck_outline"}
          instruction={instructions.pitch_deck_outline}
          error={sectionErrors.pitch_deck_outline}
          onInstructionChange={(value) => setInstruction("pitch_deck_outline", value)}
          onRegenerate={handleRegenerate}
        >
          <ListItems items={result.pitch_deck_outline} />
        </WorkbenchModule>

        <WorkbenchModule
          title="下一步开发建议"
          icon={Sparkles}
          section="development_next_steps"
          copyValue={joinLines(nextSteps)}
          enableRegeneration={enableRegeneration}
          loading={loadingSection === "development_next_steps"}
          instruction={instructions.development_next_steps}
          error={sectionErrors.development_next_steps}
          onInstructionChange={(value) => setInstruction("development_next_steps", value)}
          onRegenerate={handleRegenerate}
        >
          <ListItems items={nextSteps} />
          {result.monetization_angle ? (
            <div className="mt-5 rounded-md border border-amber-200/20 bg-amber-200/[0.06] p-4 text-sm leading-7 text-amber-50">
              {result.monetization_angle}
            </div>
          ) : null}
        </WorkbenchModule>
      </div>
    </div>
  )
}
