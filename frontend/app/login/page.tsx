"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { buildApiUrl, storeSession } from "@/lib/app-config"

type LoginQrcodeResponse = {
  scene_id?: string
  qrcode_url?: string
  expires_in?: number
  message?: string
}

type LoginStatusResponse = {
  status?: string
  token?: string
  user_id?: string | number
  message?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [qrcodeUrl, setQrcodeUrl] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchLoginQrcode() {
      try {
        const response = await fetch(buildApiUrl("/api/v1/auth/get_login_qrcode"))
        const data = (await response.json()) as LoginQrcodeResponse

        if (!response.ok || !data?.qrcode_url || !data?.scene_id) {
          throw new Error(data?.message || "获取登录二维码失败，请稍后重试。")
        }

        if (cancelled) {
          return
        }

        setQrcodeUrl(data.qrcode_url)
        setSessionId(data.scene_id)
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "登录请求失败，请稍后重试。")
        }
      }
    }

    void fetchLoginQrcode()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!sessionId) {
      return
    }

    let cancelled = false
    const pollTimer = setInterval(async () => {
      try {
        const response = await fetch(
          buildApiUrl(`/api/v1/auth/login_status?session_id=${encodeURIComponent(sessionId)}`),
        )
        const data = (await response.json()) as LoginStatusResponse

        if (!response.ok || cancelled) {
          return
        }

        if (data.status === "success" && data.token) {
          clearInterval(pollTimer)
          storeSession(data.token, data.user_id)
          router.push("/")
        }
      } catch {
        // Ignore transient polling errors and keep waiting.
      }
    }, 2000)

    return () => {
      cancelled = true
      clearInterval(pollTimer)
    }
  }, [router, sessionId])

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">微信扫码登录</h1>
        <p className="mt-2 text-sm text-neutral-300">请使用微信扫码关注公众号登录</p>

        <div className="mt-6 flex justify-center">
          <div className="h-64 w-64 rounded-xl bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            {qrcodeUrl ? (
              <img src={qrcodeUrl} alt="微信扫码登录二维码" className="h-full w-full rounded-lg object-contain" />
            ) : (
              <div className="h-full w-full animate-pulse rounded-lg bg-neutral-100" />
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-neutral-400">
          {sessionId ? `会话 ID：${sessionId}` : "正在获取二维码..."}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  )
}
