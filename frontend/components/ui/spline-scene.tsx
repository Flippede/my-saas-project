"use client"

import { Suspense, lazy, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const Spline = lazy(() => import("@splinetool/react-spline"))

interface SplineSceneProps {
  scene: string
  className?: string
  desktopDelayMs?: number
}

function SplineFallback({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-black", className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(59,130,246,0.22),transparent_36%,rgba(255,255,255,0.08)_58%,transparent_78%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_55%)]" />
      <div className="absolute inset-x-8 bottom-12 top-12 rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-blue-300/35 bg-blue-400/10 shadow-[0_0_80px_rgba(96,165,250,0.22)]" />
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-[42%] -translate-y-[58%] rotate-45 border border-white/25 bg-white/10" />
        <div className="absolute left-1/2 top-1/2 h-px w-48 -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-48 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-blue-200/45 to-transparent" />
        <div className="absolute bottom-8 left-10 right-10 grid grid-cols-4 gap-3">
          <span className="h-1 rounded-full bg-white/15" />
          <span className="h-1 rounded-full bg-blue-300/35" />
          <span className="h-1 rounded-full bg-white/15" />
          <span className="h-1 rounded-full bg-blue-300/25" />
        </div>
      </div>
    </div>
  )
}

export function SplineScene({ scene, className, desktopDelayMs = 2500 }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hasLoadedOnceRef = useRef(false)
  const [isInView, setIsInView] = useState(false)
  const [shouldLoadSpline, setShouldLoadSpline] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { rootMargin: "120px 0px", threshold: 0.1 },
    )

    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)")
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const lowCoreDevice = window.navigator.hardwareConcurrency ? window.navigator.hardwareConcurrency <= 4 : false
    const lowMemoryDevice =
      "deviceMemory" in window.navigator && typeof window.navigator.deviceMemory === "number"
        ? window.navigator.deviceMemory <= 4
        : false

    const scheduleSplineLoad = () => {
      if (!isInView || mobileQuery.matches || reducedMotionQuery.matches || lowCoreDevice || lowMemoryDevice) {
        setShouldLoadSpline(false)
        return undefined
      }

      const timer = window.setTimeout(() => {
        setShouldLoadSpline(true)
        hasLoadedOnceRef.current = true
      }, hasLoadedOnceRef.current ? 250 : desktopDelayMs)

      return timer
    }

    let timer = scheduleSplineLoad()

    const handlePreferenceChange = () => {
      if (timer) {
        window.clearTimeout(timer)
      }
      timer = scheduleSplineLoad()
    }

    mobileQuery.addEventListener("change", handlePreferenceChange)
    reducedMotionQuery.addEventListener("change", handlePreferenceChange)

    return () => {
      if (timer) {
        window.clearTimeout(timer)
      }
      mobileQuery.removeEventListener("change", handlePreferenceChange)
      reducedMotionQuery.removeEventListener("change", handlePreferenceChange)
    }
  }, [desktopDelayMs, isInView])

  return (
    <div ref={containerRef} className={className}>
      {!shouldLoadSpline ? (
        <SplineFallback />
      ) : (
        <Suspense fallback={<SplineFallback />}>
          <Spline scene={scene} className="h-full w-full" />
        </Suspense>
      )}
    </div>
  )
}
