"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type PricingPlan = {
  name?: string
  price?: string
  yearlyPrice?: string
  period?: string
  features?: string[]
  description?: string
  buttonText?: string
  href?: string
  isPopular?: boolean
}

export function Pricing({
  title,
  description,
  plans,
}: {
  title?: string
  description?: string
  plans?: PricingPlan[]
}) {
  // MVP：静态码收单 + AI 自动发卡
  // 这里按“档位固定价格 + 统一 CTA 跳转 /checkout”来渲染，忽略传入的价格/按钮文案。
  const tierCards = [
    {
      tierId: "starter",
      label: plans?.[0]?.name ?? "入门版",
      priceBig: "￥49",
      popular: false,
      features:
        [
          "一键生成短视频引流脚本",
          "基础裂变流程模板（3步）",
          "私域开场/追问话术库",
          "生成结果可直接复制投放",
          "30 天无忧保障",
        ] as const,
    },
    {
      tierId: "professional",
      label: plans?.[1]?.name ?? "专业版",
      priceBig: "￥99",
      popular: true,
      features:
        [
          "无限次调用大模型生成",
          "线索筛选 + 对话追问脚本",
          "多版本脚本 A/B 测试建议",
          "私域群答疑要点（按周期）",
          "更快跑出转化结果",
        ] as const,
    },
    {
      tierId: "enterprise",
      label: plans?.[2]?.name ?? "旗舰版",
      priceBig: "￥299",
      popular: false,
      features:
        [
          "专属私域社群答疑（高优先）",
          "多场景脚本包（短视频/直播）",
          "业务主题定制模板",
          "全流程复盘与策略迭代",
          "适合长期持续投放团队",
        ] as const,
    },
  ] as const

  return (
    <div className="container py-20">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-white">
          {title ?? "MVP 定价方案"}
        </h2>
        {description ? (
          <p className="text-xl text-gray-300 max-w-2xl mx-auto whitespace-pre-line">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 place-content-center md:grid-cols-3">
          {tierCards.map((tier, idx) => (
            <motion.div
              key={tier.tierId}
              initial={{ y: 30, opacity: 1 }}
              whileInView={{ y: -10, opacity: 1, scale: tier.popular ? 1.03 : 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 1.1,
                type: "spring",
                stiffness: 120,
                damping: 22,
                delay: 0.15 + idx * 0.12,
              }}
              className={cn(
                "relative rounded-2xl p-6 text-center flex flex-col",
                tier.popular
                  ? "border-2 border-blue-400 bg-white/10 shadow-xl z-10"
                  : "border border-white/15 bg-white/5",
              )}
            >
              {tier.popular ? (
                <div className="absolute -top-3 right-4 bg-blue-500 py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                  <Star className="text-white h-4 w-4 fill-current" />
                  <span className="text-white ml-1 font-sans font-semibold">主推</span>
                </div>
              ) : null}

              <div className="flex-1 flex flex-col">
                <p className="text-base font-semibold text-gray-300">{tier.label}</p>

                <div className="mt-6 flex items-center justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-white transition-all duration-500 ease-out">
                    {tier.priceBig}
                  </span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-gray-300">
                    / 月
                  </span>
                </div>

                <ul className="mt-6 gap-3 flex flex-col">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                      <span className="text-left text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Button asChild size="lg" className="w-full bg-white text-black hover:bg-neutral-200">
                    <Link href="/checkout">立即开通</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
