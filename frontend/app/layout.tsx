import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import { Analytics } from "@vercel/analytics/next"

import { AppHeader } from "@/components/app-header"
import "./globals.css"

export const metadata: Metadata = {
  title: "造境 AI - 一句话生成你的游戏世界",
  description: "AI 游戏世界方案生成平台，帮助用户整理世界观、角色、场景、UI、视频分镜、素材 Prompt 和 Pitch 初稿。",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
        <AppHeader />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
