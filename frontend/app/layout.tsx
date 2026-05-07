import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import { Analytics } from "@vercel/analytics/next"

import { AppHeader } from "@/components/app-header"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI 爆款脚本引擎 - AI 工具集平台",
  description: "面向短视频增长团队的 AI 工具平台，支持登录、支付、脚本生成与分镜工作台。",
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
