"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { QRCodeCanvas } from "qrcode.react"

import {
  AUTH_STATE_CHANGED_EVENT,
  buildApiUrl,
  clearSession,
  formatAmount,
  getStoredToken,
  storeSession,
  USER_ID_KEY,
} from "@/lib/app-config"
import { createOrder } from "@/lib/payment"

const USER_INFO_REFRESH_EVENT = AUTH_STATE_CHANGED_EVENT

type UserInfoResponse = {
  user_id?: string | number
  username?: string
  is_vip?: number
  expire_at?: string
  message?: string
}

type CurrentUserResponse = UserInfoResponse & {
  is_logged_in?: boolean
  user?: UserInfoResponse | null
}

type PaymentStatusResponse = {
  status?: string
  token?: string
  message?: string
  vip_active?: boolean
  redirect_url?: string
}

export function triggerUserInfoRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_INFO_REFRESH_EVENT))
  }
}

export function AppHeader() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)
  const [loadingUser, setLoadingUser] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const [paymentCodeUrl, setPaymentCodeUrl] = useState("")
  const [paymentOrderId, setPaymentOrderId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("49.00")
  const [showPaySuccessToast, setShowPaySuccessToast] = useState(false)

  useEffect(() => {
    const clearLoginSuccessParam = () => {
      if (typeof window === "undefined") {
        return
      }

      const url = new URL(window.location.href)
      if (url.searchParams.get("login") !== "success") {
        return
      }

      url.searchParams.delete("login")
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    }

    const loadUserInfo = async () => {
      const token = getStoredToken()
      if (!token) {
        setLoggedIn(false)
        setUserInfo(null)
        clearLoginSuccessParam()
        return
      }

      setLoggedIn(true)
      setLoadingUser(true)

      try {
        const response = await fetch(buildApiUrl("/api/me"), {
          cache: "no-store",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = (await response.json()) as CurrentUserResponse

        if (!response.ok) {
          throw new Error(data?.message || "获取用户信息失败")
        }

        const currentUser = data?.user || data
        if (data?.is_logged_in === false) {
          setLoggedIn(false)
          setUserInfo(null)
          return
        }

        setUserInfo({
          user_id: currentUser?.user_id || "",
          username: currentUser?.username || "AI 创作者",
          is_vip: currentUser?.is_vip ?? 0,
          expire_at: currentUser?.expire_at || "",
        })

        if (typeof window !== "undefined" && currentUser?.user_id !== undefined && currentUser?.user_id !== null) {
          localStorage.setItem(USER_ID_KEY, String(currentUser.user_id))
        }

        clearLoginSuccessParam()
      } catch {
        setUserInfo({
          user_id: "",
          username: "AI 创作者",
          is_vip: 0,
          expire_at: "",
        })
      } finally {
        setLoadingUser(false)
      }
    }

    void loadUserInfo()
    window.addEventListener(USER_INFO_REFRESH_EVENT, loadUserInfo)
    window.addEventListener("focus", loadUserInfo)
    window.addEventListener("pageshow", loadUserInfo)
    window.addEventListener("storage", loadUserInfo)

    return () => {
      window.removeEventListener(USER_INFO_REFRESH_EVENT, loadUserInfo)
      window.removeEventListener("focus", loadUserInfo)
      window.removeEventListener("pageshow", loadUserInfo)
      window.removeEventListener("storage", loadUserInfo)
    }
  }, [])

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setPaymentOrderId("")
    setPaymentCodeUrl("")
    setPaymentError("")
    setPaymentLoading(false)
  }

  const handleLogout = () => {
    clearSession()
    window.location.reload()
  }

  const handleOpenPayment = async () => {
    if (userInfo?.is_vip === 1) {
      alert("您已经是 VIP，无需重复购买。")
      return
    }

    const token = getStoredToken()
    if (!token) {
      router.push("/login")
      return
    }

    setShowPaymentModal(true)
    setPaymentLoading(true)
    setPaymentError("")
    setPaymentCodeUrl("")
    setPaymentOrderId("")

    try {
      const data = await createOrder(token)
      setPaymentCodeUrl(data.code_url || "")
      setPaymentOrderId(data.order_id || "")
      setPaymentAmount(data.amount || "49.00")
    } catch (requestError) {
      setPaymentError(requestError instanceof Error ? requestError.message : "支付请求失败，请重试。")
    } finally {
      setPaymentLoading(false)
    }
  }

  useEffect(() => {
    if (!showPaymentModal || !paymentOrderId) {
      return
    }

    let cancelled = false
    const pollTimer = setInterval(async () => {
      try {
        const response = await fetch(
          buildApiUrl(`/api/payment/order-status?order_id=${encodeURIComponent(paymentOrderId)}`),
        )
        const data = (await response.json()) as PaymentStatusResponse

        if (!response.ok || cancelled) {
          return
        }

        const normalizedStatus = (data?.status || "").toLowerCase()
        if (normalizedStatus === "paid" || normalizedStatus === "success") {
          clearInterval(pollTimer)

          if (data?.token) {
            storeSession(data.token)
          }

          closePaymentModal()
          triggerUserInfoRefresh()
          setShowPaySuccessToast(true)
          setTimeout(() => setShowPaySuccessToast(false), 2600)
        }
      } catch {
        // Keep polling.
      }
    }, 2000)

    return () => {
      cancelled = true
      clearInterval(pollTimer)
    }
  }, [paymentOrderId, showPaymentModal])

  const isVip = userInfo?.is_vip === 1

  return (
    <>
      <div className="fixed right-4 top-4 z-50">
        {loggedIn ? (
          <div className="flex items-center gap-3 rounded-full border border-white/15 bg-neutral-900/90 px-3 py-2 shadow-[0_12px_38px_rgba(59,130,246,0.22)] backdrop-blur">
            <div
              className={`h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 ${
                isVip ? "ring-2 ring-amber-300" : "ring-2 ring-white/30"
              }`}
            />

            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-sm font-medium text-neutral-100">{userInfo?.username || "AI 创作者"}</div>
              {loadingUser ? (
                <div className="text-xs text-neutral-400">加载中...</div>
              ) : isVip ? (
                <div className="rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-2 py-0.5 text-[11px] font-bold text-neutral-900 shadow-[0_0_16px_rgba(245,158,11,0.45)]">
                  VIP
                </div>
              ) : (
                <div className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[11px] text-neutral-300">
                  普通用户
                </div>
              )}
            </div>

            {!loadingUser ? (
              <button
                onClick={handleOpenPayment}
                className="h-9 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-4 text-sm font-semibold text-neutral-900 transition-all hover:brightness-110"
              >
                {isVip ? "已是 VIP" : "升级 VIP"}
              </button>
            ) : null}

            <button
              onClick={() => router.push("/generate")}
              className="h-9 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              进入工作台
            </button>

            <button onClick={handleLogout} className="text-sm text-neutral-300 transition-colors hover:text-white">
              退出登录
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="h-9 rounded-full border border-white/20 bg-neutral-900/75 px-4 text-sm font-medium text-neutral-100 shadow-lg backdrop-blur transition-colors hover:bg-white/10"
          >
            登录
          </button>
        )}
      </div>

      {showPaymentModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-neutral-900/90 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">AI Storyboard X 订阅升级</h3>
            <p className="mt-1 text-sm text-amber-300">¥{formatAmount(paymentAmount)}</p>

            <div className="mt-5 flex justify-center">
              <div className="rounded-xl bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                {paymentCodeUrl ? (
                  <QRCodeCanvas value={paymentCodeUrl} size={220} includeMargin />
                ) : (
                  <div className="h-[220px] w-[220px] animate-pulse rounded bg-neutral-200" />
                )}
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-neutral-300">
              {paymentLoading ? "正在创建支付订单..." : "请使用微信扫码完成支付"}
            </div>

            {paymentError ? <div className="mt-3 text-center text-sm text-red-300">{paymentError}</div> : null}

            <button
              onClick={closePaymentModal}
              className="mt-5 h-10 w-full rounded-xl border border-white/20 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}

      {showPaySuccessToast ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/15 px-8 py-6 text-center shadow-2xl">
            <div className="text-lg font-semibold text-emerald-200">支付成功，会员状态已更新。</div>
          </div>
        </div>
      ) : null}
    </>
  )
}
