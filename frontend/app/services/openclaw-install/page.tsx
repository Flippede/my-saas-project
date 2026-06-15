"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QRCodeCanvas } from "qrcode.react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Laptop,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildApiUrl, formatAmount, getStoredToken, jsonHeaders } from "@/lib/app-config"
import { createOpenClawInstallPayment, getServiceOrder, type ServiceOrderResponse } from "@/lib/service-orders"

const productName = "OpenClaw 龙虾安装调试服务"
const originalPrice = "299"
const salePrice = "128"
const savedPrice = "171"

const fitItems = [
  "想使用 OpenClaw，但不熟悉环境配置的人",
  "已经有 DeepSeek API Key，但不知道怎么接入的人",
  "想快速测试 OpenClaw 是否能正常运行的人",
  "不想在安装、依赖、配置文件上浪费时间的人",
  "需要有人远程带着跑通第一遍基础流程的人",
]

const includedItems = [
  "远程检查基础运行环境",
  "安装 OpenClaw 所需依赖",
  "配置 DeepSeek API Key",
  "配置基础运行参数",
  "启动 OpenClaw",
  "测试基础对话 / 调用是否正常",
  "处理常见启动报错",
  "简单说明如何启动、关闭、重新运行",
  "告知 DeepSeek API 充值和消耗注意事项",
  "提供一次基础使用说明",
]

const excludedItems = [
  "不包含 DeepSeek API 调用费用",
  "不代充值 DeepSeek 账户",
  "不承诺解决客户电脑所有系统问题",
  "不包含复杂二次开发",
  "不包含长期维护",
  "不包含服务器部署",
  "不包含商业项目定制",
  "不包含 OpenClaw 以外的软件深度教学",
  "不包含因客户系统权限、杀毒软件、网络限制导致的不可控问题",
  "不提供违法、违规、灰产用途配置",
]

const processSteps = [
  "登录账号",
  "支付 128 元服务费",
  "联系客服预约远程时间",
  "远程连接客户电脑",
  "安装 OpenClaw",
  "配置 DeepSeek API",
  "测试运行",
  "简单讲解使用方式",
]

const preparationItems = [
  "一台可远程操作的电脑",
  "稳定网络",
  "DeepSeek 账号",
  "已充值或可用的 DeepSeek API Key",
  "允许远程协助的软件环境",
  "基础系统权限，例如安装软件、修改配置文件",
]

type PaymentState = {
  orderId: string
  amount: string
  codeUrl: string
  status: string
  serviceStatus: string
}

export default function OpenClawInstallServicePage() {
  const router = useRouter()
  const [checkingLogin, setCheckingLogin] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [payment, setPayment] = useState<PaymentState | null>(null)

  const isPaid = payment?.status === "paid"

  useEffect(() => {
    let cancelled = false

    async function checkLogin() {
      const token = getStoredToken()
      if (!token) {
        setLoggedIn(false)
        setCheckingLogin(false)
        return
      }

      try {
        const response = await fetch(buildApiUrl("/api/me"), {
          cache: "no-store",
          headers: jsonHeaders(token),
        })
        if (!cancelled) {
          setLoggedIn(response.ok)
        }
      } catch {
        if (!cancelled) {
          setLoggedIn(false)
        }
      } finally {
        if (!cancelled) {
          setCheckingLogin(false)
        }
      }
    }

    void checkLogin()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!payment?.orderId || payment.status === "paid") {
      return
    }

    let cancelled = false
    const token = getStoredToken()
    if (!token) {
      return
    }

    async function pollOrder() {
      try {
        const data = await getServiceOrder(payment.orderId, token)
        if (cancelled) {
          return
        }
        setPayment((current) =>
          current
            ? {
                ...current,
                status: data.status,
                serviceStatus: data.service_status,
                amount: data.amount || current.amount,
              }
            : current,
        )
        if (data.status === "paid") {
          setMessage("支付成功，你已购买 OpenClaw 龙虾安装调试服务。")
        }
      } catch {
        if (!cancelled) {
          setMessage("正在确认支付状态，请稍后刷新或继续等待。")
        }
      }
    }

    void pollOrder()
    const timer = window.setInterval(pollOrder, 2500)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [payment?.orderId, payment?.status])

  async function handleBuy() {
    const token = getStoredToken()
    if (!token) {
      router.push("/login")
      return
    }

    setCreateLoading(true)
    setError("")
    setMessage("")
    try {
      const data = await createOpenClawInstallPayment(token)
      setPayment({
        orderId: data.order_id,
        amount: data.amount,
        codeUrl: data.code_url || "",
        status: data.status,
        serviceStatus: data.service_status,
      })
      setMessage("服务订单已创建，请使用微信扫码支付。")
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建服务订单失败，请稍后重试。")
    } finally {
      setCreateLoading(false)
    }
  }

  const ctaLabel = useMemo(() => {
    if (checkingLogin) {
      return "正在检查登录状态..."
    }
    if (!loggedIn) {
      return "登录后锁定优惠价"
    }
    return createLoading ? "正在创建服务订单..." : "立即锁定 128 元体验价"
  }, [checkingLogin, createLoading, loggedIn])

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),transparent_34%,rgba(251,191,36,0.08)_62%,rgba(244,114,182,0.08))]" />

        <section className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-16 pt-24 lg:grid-cols-[1fr_420px] lg:px-6">
          <div>
            <Link href="/" className="mb-8 inline-flex text-sm text-neutral-400 transition hover:text-white">
              返回首页
            </Link>
            <p className="inline-flex items-center gap-2 rounded-md border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-sm text-cyan-100">
              <Wrench className="h-4 w-4" />
              远程安装调试服务
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal md:text-6xl">{productName}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
              为你远程完成 OpenClaw 基础安装、DeepSeek API 配置、运行测试与简单使用说明，减少环境配置和首次启动的折腾成本。
            </p>
            <div className="mt-7 rounded-lg border border-amber-200/25 bg-amber-200/[0.08] p-5">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <div className="text-sm text-neutral-400">原价</div>
                  <div className="mt-1 text-2xl text-neutral-500 line-through">{originalPrice} 元</div>
                </div>
                <div>
                  <div className="text-sm text-amber-100">限时体验价</div>
                  <div className="mt-1 text-5xl font-semibold text-amber-100">{salePrice} 元 <span className="text-lg font-normal">/ 次</span></div>
                </div>
                <div className="rounded-md border border-emerald-300/25 bg-emerald-300/[0.1] px-3 py-2 text-sm text-emerald-100">
                  试运营期间立省 {savedPrice} 元
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-300">
                <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1">当前为试运营价格</span>
                <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1">远程服务排期中</span>
                <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1">名额有限，以预约确认为准</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                当前 128 元为试运营体验价，后续可能根据服务时长、安装复杂度和排期情况调整价格。
              </p>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-black/35 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="rounded-lg border border-cyan-200/20 bg-cyan-200/[0.06] p-5">
              <div className="text-sm text-neutral-400">{productName}</div>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-neutral-500 line-through">原价 {originalPrice} 元</span>
                <span className="rounded bg-amber-200 px-2 py-1 text-xs font-semibold text-black">早鸟优惠</span>
              </div>
              <div className="mt-3 text-4xl font-semibold text-white">{salePrice} 元</div>
              <p className="mt-3 text-sm leading-7 text-neutral-300">
                包含远程安装、DeepSeek API 配置、基础运行测试和简单使用说明。
              </p>
              <Button
                type="button"
                onClick={handleBuy}
                disabled={checkingLogin || createLoading}
                className="mt-5 w-full rounded-md bg-cyan-200 text-black hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkingLogin || createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {ctaLabel}
              </Button>
              {!loggedIn && !checkingLogin ? (
                <p className="mt-3 text-sm leading-6 text-neutral-400">为了关联订单和服务记录，请先登录账号。</p>
              ) : null}
              <p className="mt-4 text-xs leading-6 text-neutral-500">
                DeepSeek API 调用费用由客户自行充值，本服务费不包含模型调用费用。
              </p>
            </div>

            {error ? <Notice tone="error" text={error} /> : null}
            {message ? <Notice tone={isPaid ? "success" : "info"} text={message} /> : null}

            {payment?.codeUrl && !isPaid ? (
              <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-5 text-center">
                <h2 className="text-xl font-semibold">微信扫码支付</h2>
                <p className="mt-2 text-sm text-neutral-400">金额：¥{formatAmount(payment.amount)}</p>
                <p className="mt-1 break-all text-xs text-neutral-500">订单号：{payment.orderId}</p>
                <div className="mt-5 flex justify-center">
                  <div className="rounded-lg bg-white p-3">
                    <QRCodeCanvas value={payment.codeUrl} size={220} includeMargin />
                  </div>
                </div>
                <p className="mt-4 text-sm text-neutral-300">支付后页面会自动确认状态。二维码有效期以微信提示为准。</p>
              </div>
            ) : null}

            {isPaid && payment ? (
              <div className="mt-5 rounded-lg border border-emerald-300/25 bg-emerald-300/[0.08] p-5">
                <h2 className="text-xl font-semibold text-emerald-50">支付成功</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-300">
                  你已购买 {productName}。请根据页面提示联系客服预约远程安装时间。
                </p>
                <div className="mt-4 grid gap-2 text-sm text-neutral-300">
                  <span>订单号：{payment.orderId}</span>
                  <span>支付金额：{formatAmount(payment.amount)} 元</span>
                  <span>服务名称：{productName}</span>
                  <span>服务状态：{payment.serviceStatus || "待预约 / 待远程服务"}</span>
                </div>
                <p className="mt-4 text-xs leading-6 text-neutral-400">
                  DeepSeek API 调用费用需自行充值，本服务费不包含模型调用费用。
                </p>
              </div>
            ) : null}
          </aside>
        </section>

        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-24 lg:px-6">
          <GridSection title="服务适合谁" icon={HelpCircle} items={fitItems} />
          <GridSection title="服务包含什么" icon={CheckCircle2} items={includedItems} />
          <GridSection title="服务不包含什么" icon={XCircle} items={excludedItems} danger />

          <section className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Clock className="h-5 w-5 text-cyan-200" />
              <h2 className="text-2xl font-semibold">交付方式</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["交付方式", "远程协助"],
                ["服务形式", "在线远程安装调试"],
                ["服务时长", "以基础安装调试完成为准，通常为一次服务"],
                ["购买后", "支付完成后，请联系页面客服或站内提示方式预约服务。"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-black/25 p-4">
                  <div className="text-sm text-neutral-500">{label}</div>
                  <div className="mt-2 text-sm leading-7 text-neutral-300">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Laptop className="h-5 w-5 text-cyan-200" />
              <h2 className="text-2xl font-semibold">服务流程</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {processSteps.map((item, index) => (
                <div key={item} className="rounded-lg border border-white/10 bg-black/25 p-4">
                  <div className="font-mono text-2xl font-semibold text-cyan-200">{String(index + 1).padStart(2, "0")}</div>
                  <div className="mt-3 text-sm leading-6 text-neutral-300">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <GridSection title="客户需要提前准备" icon={ShieldCheck} items={preparationItems} />

          <section className="rounded-lg border border-amber-300/25 bg-amber-300/[0.07] p-6">
            <div className="mb-5 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-200" />
              <h2 className="text-2xl font-semibold">注意事项 / 免责声明</h2>
            </div>
            <div className="grid gap-3 text-sm leading-7 text-neutral-300">
              <p>本服务为 OpenClaw 安装调试协助服务，不是 OpenClaw 官方授权服务。</p>
              <p>本服务费仅包含人工远程安装调试，不包含 DeepSeek、OpenAI 或其他模型平台产生的 API 调用费用。</p>
              <p>客户需自行保证 API Key 来源合法、账户可用，并自行承担模型调用费用。</p>
              <p>服务过程中不会主动索要客户无关账号密码。涉及 API Key 时，客户可自行输入，服务人员只协助确认配置是否正确。</p>
            </div>
          </section>

          <section className="rounded-lg border border-cyan-200/20 bg-cyan-200/[0.07] p-6 text-center">
            <Sparkles className="mx-auto mb-4 h-8 w-8 text-cyan-100" />
            <h2 className="text-3xl font-semibold">{productName}</h2>
            <div className="mt-5 flex flex-col items-center justify-center gap-2">
              <div className="text-neutral-500 line-through">原价 {originalPrice} 元</div>
              <div className="text-4xl font-semibold text-amber-100">限时体验价 {salePrice} 元</div>
              <div className="text-sm text-emerald-100">试运营期间立省 {savedPrice} 元</div>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-300">
              包含远程安装、DeepSeek API 配置、基础运行测试和简单使用说明。
            </p>
            <Button
              type="button"
              onClick={handleBuy}
              disabled={checkingLogin || createLoading}
              className="mt-7 rounded-md bg-cyan-200 text-black hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingLogin || createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {ctaLabel}
            </Button>
          </section>
        </div>
      </main>
    </div>
  )
}

function Notice({ tone, text }: { tone: "error" | "info" | "success"; text: string }) {
  const className =
    tone === "error"
      ? "border-red-400/25 bg-red-400/[0.08] text-red-100"
      : tone === "success"
        ? "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100"
        : "border-cyan-200/20 bg-cyan-200/[0.07] text-cyan-50"

  return <div className={`mt-5 rounded-lg border p-4 text-sm leading-7 ${className}`}>{text}</div>
}

function GridSection({
  title,
  icon: Icon,
  items,
  danger,
}: {
  title: string
  icon: typeof HelpCircle
  items: string[]
  danger?: boolean
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
      <div className="mb-5 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${danger ? "text-rose-200" : "text-cyan-200"}`} />
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="flex gap-2 text-sm leading-7 text-neutral-300">
              {danger ? <XCircle className="mt-1 h-4 w-4 shrink-0 text-rose-200" /> : <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />}
              <span>{item}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
