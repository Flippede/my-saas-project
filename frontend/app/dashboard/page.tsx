import Link from "next/link"
import { ArrowRight, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/ui/navbar"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="container mx-auto px-4 pt-36 pb-20">
        <section className="mb-10 space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-neutral-300">
            <LayoutDashboard className="h-4 w-4" />
            工具控制台
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">欢迎进入 AI 工具集平台</h1>
          <p className="max-w-2xl text-neutral-300">
            这里是统一的工具货架。你可以从这里按需进入各个独立工具页面，保持官网主页纯营销展示。
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-white/15 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>短视频裂变脚本生成器</CardTitle>
              <CardDescription className="text-neutral-300">
                输入卡密、视频链接与关键词，一键生成用于裂变传播的视频脚本。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-white text-black hover:bg-neutral-200">
                <Link href="/tools/script-generator">
                  进入工具
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
