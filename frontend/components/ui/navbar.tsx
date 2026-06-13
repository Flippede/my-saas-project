"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a href={href} className="group relative inline-block h-5 overflow-hidden text-sm">
      <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span className="text-neutral-300">{children}</span>
        <span className="text-white">{children}</span>
      </div>
    </a>
  )
}

function LogoMark() {
  return (
    <div className="relative flex h-7 w-7 items-center justify-center rounded border border-cyan-200/45 bg-cyan-200/10 shadow-[0_0_18px_rgba(34,211,238,0.25)]">
      <div className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-sm bg-cyan-200" />
      <div className="absolute bottom-1.5 right-1.5 h-1.5 w-3 rounded-sm bg-amber-200" />
      <span className="text-[10px] font-bold text-white">境</span>
    </div>
  )
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [headerShapeClass, setHeaderShapeClass] = useState("rounded-full")
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current)
    }

    if (isOpen) {
      setHeaderShapeClass("rounded-lg")
      return
    }

    shapeTimeoutRef.current = setTimeout(() => {
      setHeaderShapeClass("rounded-full")
    }, 300)

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current)
      }
    }
  }, [isOpen])

  return (
    <header
      className={`fixed left-1/2 top-6 z-40 flex w-[calc(100%-2rem)] -translate-x-1/2 transform flex-col items-center border border-white/12 bg-black/55 px-5 py-3 shadow-[0_18px_55px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-[border-radius] duration-0 ease-in-out sm:w-auto ${headerShapeClass}`}
    >
      <div className="flex w-full items-center justify-between gap-x-6 sm:gap-x-8">
        <Link href="/" className="flex items-center gap-2" aria-label="返回造境 AI 首页">
          <LogoMark />
          <span className="hidden text-sm font-semibold text-white sm:inline">造境 AI</span>
        </Link>

        <nav className="hidden items-center space-x-4 text-sm sm:flex sm:space-x-6">
          <AnimatedNavLink href="/#solutions">能力</AnimatedNavLink>
          <AnimatedNavLink href="/#demos">Demo</AnimatedNavLink>
          <AnimatedNavLink href="/#workflow">流程</AnimatedNavLink>
          <AnimatedNavLink href="/#pricing">价格</AnimatedNavLink>
        </nav>

        <div className="hidden items-center gap-2 sm:flex sm:gap-3">
          <Link
            href="/login"
            className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs text-neutral-200 transition-colors duration-200 hover:border-white/40 hover:text-white sm:px-3 sm:text-sm"
          >
            登录 / 注册
          </Link>
          <Link
            href="/submit"
            className="relative z-10 inline-flex rounded-full bg-gradient-to-r from-cyan-200 to-amber-200 px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110 sm:px-3 sm:text-sm"
          >
            提交想法
          </Link>
        </div>

        <button
          className="flex h-8 w-8 items-center justify-center text-neutral-300 sm:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "关闭菜单" : "打开菜单"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={`flex w-full flex-col items-center overflow-hidden transition-all duration-300 ease-in-out sm:hidden ${isOpen ? "max-h-[1000px] pt-4 opacity-100" : "pointer-events-none max-h-0 pt-0 opacity-0"}`}
      >
        <nav className="flex w-full flex-col items-center space-y-4 text-base">
          {[
            { href: "/#solutions", label: "能力" },
            { href: "/#demos", label: "Demo" },
            { href: "/#workflow", label: "流程" },
            { href: "/#pricing", label: "价格" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="w-full text-center text-neutral-300 transition-colors hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-4 flex w-full flex-col items-center space-y-4">
          <Link
            href="/login"
            className="w-full rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-center text-sm text-neutral-200 transition-colors duration-200 hover:border-white/40 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            登录 / 注册
          </Link>
          <Link
            href="/submit"
            className="w-full rounded-full bg-gradient-to-r from-cyan-200 to-amber-200 px-4 py-2 text-center text-sm font-semibold text-black transition hover:brightness-110"
            onClick={() => setIsOpen(false)}
          >
            提交想法
          </Link>
        </div>
      </div>
    </header>
  )
}
