"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, WandSparkles } from "lucide-react"

import { buildApiUrl, jsonHeaders } from "@/lib/app-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ToolResponse = {
  success?: boolean
  message?: string
  error?: string
  result?: string
}

export default function ScriptGeneratorPage() {
  const [cardKey, setCardKey] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [keywords, setKeywords] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setResult("")

    if (!cardKey.trim() || !videoUrl.trim() || !keywords.trim()) {
      setError("请完整填写卡密、链接和关键词后再提交。")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(buildApiUrl("/api/v1/tools"), {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          tool_id: "script_generator",
          payload: {
            card_key: cardKey.trim(),
            video_url: videoUrl.trim(),
            keywords: keywords.trim(),
          },
        }),
      })

      const payload = (await response.json()) as ToolResponse

      if (!response.ok) {
        throw new Error(payload?.message || `接口调用失败（HTTP ${response.status}）`)
      }

      if (payload.success === false) {
        throw new Error(payload.error || payload.message || "脚本生成失败")
      }

      setResult(String(payload.result || ""))
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "请求失败，请稍后重试。"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-transparent text-neutral-200 hover:bg-white/10 hover:text-white"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              返回工具控制台
            </Link>
          </Button>
        </div>

        <Card className="mx-auto max-w-3xl border-white/15 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">短视频裂变脚本生成器</CardTitle>
            <CardDescription className="text-neutral-300">
              输入卡密、视频链接和关键词，系统会生成可直接用于投放的脚本。
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="cardKey" className="text-sm text-neutral-200">
                  卡密
                </label>
                <input
                  id="cardKey"
                  value={cardKey}
                  onChange={(event) => setCardKey(event.target.value)}
                  placeholder="请输入卡密"
                  className="h-11 w-full rounded-md border border-white/15 bg-black/30 px-3 text-sm outline-none transition focus:border-white/40"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="videoUrl" className="text-sm text-neutral-200">
                  视频链接
                </label>
                <input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  placeholder="https://"
                  className="h-11 w-full rounded-md border border-white/15 bg-black/30 px-3 text-sm outline-none transition focus:border-white/40"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="keywords" className="text-sm text-neutral-200">
                  关键词
                </label>
                <textarea
                  id="keywords"
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder="例如：转化、种草、引流"
                  rows={4}
                  className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-white/40"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-neutral-200">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <WandSparkles className="h-4 w-4" />
                    生成脚本
                  </>
                )}
              </Button>
            </form>

            {error ? (
              <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {result ? (
              <div className="mt-6 space-y-2">
                <h2 className="text-sm font-medium text-neutral-200">生成结果</h2>
                <pre className="max-h-[420px] overflow-auto rounded-md border border-white/15 bg-black/35 p-4 text-xs text-neutral-200">
                  {result}
                </pre>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
