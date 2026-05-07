"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a href={href} className="group relative inline-block h-5 overflow-hidden text-sm">
      <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span className="text-gray-300">{children}</span>
        <span className="text-white">{children}</span>
      </div>
    </a>
  )
}

function LogoMark() {
  return (
    <div className="relative flex h-6 w-6 items-center justify-center">
      <div className="absolute inset-0 rounded-sm border border-gray-300 opacity-60" />
      <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-blue-400" />
      <div className="absolute right-1 top-1 h-1 w-1 rounded-full bg-gray-300" />
      <div className="absolute bottom-1 left-1 h-1 w-1 rounded-full bg-gray-300" />
      <div className="absolute bottom-1.5 right-1 h-0.5 w-2 bg-gray-300" />
      <span className="absolute text-xs font-bold text-white">AI</span>
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
      setHeaderShapeClass("rounded-xl")
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
      className={`fixed left-1/2 top-6 z-20 flex w-[calc(100%-2rem)] -translate-x-1/2 transform flex-col items-center border border-[#333] bg-[#1f1f1f57] px-6 py-3 backdrop-blur-sm transition-[border-radius] duration-0 ease-in-out sm:w-auto ${headerShapeClass}`}
    >
      <div className="flex w-full items-center justify-between gap-x-6 sm:gap-x-8">
        <Link href="/" className="flex items-center" aria-label="返回首页">
          <LogoMark />
        </Link>

        <nav className="hidden items-center space-x-4 text-sm sm:flex sm:space-x-6">
          <AnimatedNavLink href="#services">核心功能</AnimatedNavLink>
          <AnimatedNavLink href="#testimonials">爆款案例</AnimatedNavLink>
        </nav>

        <div className="hidden items-center gap-2 sm:flex sm:gap-3">
          <Link
            href="/login"
            className="rounded-full border border-[#333] bg-[rgba(31,31,31,0.62)] px-4 py-2 text-xs text-gray-300 transition-colors duration-200 hover:border-white/50 hover:text-white sm:px-3 sm:text-sm"
          >
            登录 / 获取卡密
          </Link>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-0 -m-2 hidden rounded-full bg-blue-400 opacity-40 blur-lg transition-all duration-300 ease-out group-hover:-m-3 group-hover:opacity-60 group-hover:blur-xl sm:block" />
            <Link
              href="/dashboard"
              className="relative z-10 inline-flex rounded-full bg-gradient-to-br from-blue-400 to-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:from-blue-500 hover:to-blue-700 sm:px-3 sm:text-sm"
            >
              进入工具控制台
            </Link>
          </div>
        </div>

        <button
          className="flex h-8 w-8 items-center justify-center text-gray-300 sm:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          {isOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12M6 12h12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <div
        className={`flex w-full flex-col items-center overflow-hidden transition-all duration-300 ease-in-out sm:hidden ${isOpen ? "max-h-[1000px] pt-4 opacity-100" : "pointer-events-none max-h-0 pt-0 opacity-0"}`}
      >
        <nav className="flex w-full flex-col items-center space-y-4 text-base">
          <a href="#services" className="w-full text-center text-gray-300 transition-colors hover:text-white">
            核心功能
          </a>
          <a href="#testimonials" className="w-full text-center text-gray-300 transition-colors hover:text-white">
            爆款案例
          </a>
        </nav>
        <div className="mt-4 flex w-full flex-col items-center space-y-4">
          <Link
            href="/login"
            className="w-full rounded-full border border-[#333] bg-[rgba(31,31,31,0.62)] px-4 py-2 text-center text-sm text-gray-300 transition-colors duration-200 hover:border-white/50 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            登录 / 获取卡密
          </Link>
          <Link
            href="/dashboard"
            className="w-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition-all duration-200 hover:from-blue-500 hover:to-blue-700"
            onClick={() => setIsOpen(false)}
          >
            进入工具控制台
          </Link>
        </div>
      </div>
    </header>
  )
}
