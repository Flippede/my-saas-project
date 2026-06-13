"use client"

import Link from "next/link"
import { Check, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

const defaultPlans: PricingPlan[] = [
  {
    name: "基础概念包",
    price: "199-499 元",
    description: "适合快速验证一个游戏脑洞。",
    features: ["游戏名称", "世界观", "角色图", "场景图", "UI 风格图"],
    buttonText: "提交需求",
    href: "/submit",
  },
  {
    name: "AI 游戏宣传片",
    price: "999-2999 元",
    description: "适合短视频传播和项目预热。",
    features: ["15-30 秒类游戏宣传片", "竖屏版", "横屏版", "主视觉图"],
    buttonText: "提交需求",
    href: "/submit",
    isPopular: true,
  },
  {
    name: "游戏 Pitch 包",
    price: "2999-9999 元",
    description: "适合招商、融资和团队立项。",
    features: ["宣传片", "设定文档", "角色场景", "UI", "项目介绍页", "招商展示材料"],
    buttonText: "提交需求",
    href: "/submit",
  },
]

export function Pricing({
  title,
  description,
  plans,
}: {
  title?: string
  description?: string
  plans?: PricingPlan[]
}) {
  const tierCards = plans?.length ? plans : defaultPlans

  return (
    <div className="container py-20">
      <div className="mb-12 space-y-4 text-center">
        <h2 className="text-4xl font-bold tracking-normal text-white sm:text-5xl">{title ?? "会员 / 服务套餐"}</h2>
        {description ? <p className="mx-auto max-w-2xl text-xl text-neutral-300">{description}</p> : null}
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 md:grid-cols-3">
          {tierCards.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-lg p-6 text-center",
                tier.isPopular
                  ? "border border-cyan-200/45 bg-cyan-200/[0.08] shadow-[0_0_36px_rgba(34,211,238,0.14)]"
                  : "border border-white/12 bg-white/[0.04]",
              )}
            >
              {tier.isPopular ? (
                <div className="absolute right-4 top-4 flex items-center rounded bg-cyan-200 px-2 py-1 text-xs font-semibold text-black">
                  <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                  推荐
                </div>
              ) : null}

              <div className="flex flex-1 flex-col">
                <p className="text-lg font-semibold text-white">{tier.name}</p>
                <div className="mt-5 text-3xl font-bold tracking-normal text-cyan-100">{tier.price}</div>
                {tier.description ? <p className="mt-4 text-sm leading-6 text-neutral-300">{tier.description}</p> : null}

                <ul className="mt-6 flex flex-col gap-3">
                  {(tier.features ?? []).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                      <span className="text-left text-sm text-neutral-200">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Button asChild size="lg" className="w-full rounded-md bg-white text-black hover:bg-neutral-200">
                    <Link href={tier.href ?? "/submit"}>{tier.buttonText ?? "提交需求"}</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
