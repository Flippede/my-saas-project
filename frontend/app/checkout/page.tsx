"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QRCodeCanvas } from "qrcode.react"

import { buildApiUrl, formatAmount, getStoredToken, storeSession } from "@/lib/app-config"
import { createOrder } from "@/lib/payment"

type PaymentStatusResponse = {
  status?: string
  token?: string
  message?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [createLoading, setCreateLoading] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [orderId, setOrderId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("49.00")
  const [countdown, setCountdown] = useState(120)
  const [payExpired, setPayExpired] = useState(false)
  const [error, setError] = useState("")
  const [statusText, setStatusText] = useState("等待发起支付")

  const handlePaymentSuccess = (rawToken?: string) => {
    setShowPayModal(false)
    setStatusText("支付成功，正在跳转到分镜工作台...")

    if (rawToken?.trim()) {
      storeSession(rawToken)
    }

    router.push("/generate")
  }

  useEffect(() => {
    if (!showPayModal || !orderId) {
      return
    }

    let cancelled = false
    setCountdown(120)

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          buildApiUrl(`/api/v1/payment/status?order_id=${encodeURIComponent(orderId)}`),
        )
        const data = (await response.json()) as PaymentStatusResponse

        if (!response.ok || cancelled) {
          return
        }

        if ((data.status || "").toLowerCase() === "success") {
          handlePaymentSuccess(data.token)
        }
      } catch {
        if (!cancelled) {
          setStatusText("正在确认支付状态，请稍候...")
        }
      }
    }

    void checkPaymentStatus()
    const pollTimer = setInterval(checkPaymentStatus, 2000)
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(pollTimer)
          clearInterval(countdownTimer)

          if (!cancelled) {
            setPayExpired(true)
            setShowPayModal(false)
            setStatusText("支付超时，请重新发起订单")
          }

          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => {
      cancelled = true
      clearInterval(pollTimer)
      clearInterval(countdownTimer)
    }
  }, [orderId, showPayModal])

  const handleSubscribe = async () => {
    const token = getStoredToken()
    if (!token) {
      setStatusText("请先登录，再发起支付。")
      router.push("/login")
      return
    }

    setCreateLoading(true)
    setError("")
    setPayExpired(false)
    setStatusText("正在创建微信支付订单...")

    try {
      const payload = await createOrder(token)
      setQrCodeUrl(payload.code_url || "")
      setOrderId(payload.order_id || "")
      setPaymentAmount(payload.amount || "49.00")
      setShowPayModal(true)
      setCountdown(120)
      setStatusText("请使用微信扫码完成支付")
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "支付请求失败，请稍后再试。"
      setError(message)
      setStatusText("支付创建失败")
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-neutral-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-neutral-300 hover:text-white">
            <span className="text-lg leading-none">←</span>
            返回主页
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl">
          <div className="p-6">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">AI Storyboard X</h1>
              <p className="text-neutral-300">专业版订阅</p>
              <p className="text-4xl font-bold text-white">¥49 / 月</p>

              <button
                onClick={handleSubscribe}
                disabled={createLoading}
                className="mt-4 h-11 w-full rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createLoading ? "创建订单中..." : "订阅专业版"}
              </button>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-300">
              {statusText}
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showPayModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">请使用微信扫码支付</h2>
              <p className="mt-2 text-sm text-green-300">金额：¥{formatAmount(paymentAmount)}</p>
              <p className="mt-1 text-xs text-neutral-400">订单号：{orderId}</p>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="rounded-xl bg-white p-3">
                <QRCodeCanvas value={qrCodeUrl} size={220} includeMargin />
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-neutral-300">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>正在等待微信支付结果...</span>
              </div>
            </div>

            <div className="mt-3 text-center text-sm text-neutral-300">
              {payExpired
                ? "二维码已过期，请关闭后重新发起。"
                : `二维码有效期：${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`}
            </div>

            <button
              onClick={() => setShowPayModal(false)}
              className="mt-5 h-10 w-full rounded-xl border border-white/20 text-neutral-200 transition-colors hover:bg-white/10"
            >
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
