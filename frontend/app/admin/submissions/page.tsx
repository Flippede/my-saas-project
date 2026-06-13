"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, Loader2, Save, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getStoredToken } from "@/lib/app-config"
import {
  type GameSubmission,
  getAdminGameSubmission,
  getAdminGameSubmissions,
  updateAdminGameSubmission,
} from "@/lib/game-submissions"

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "new", label: "已提交" },
  { value: "reviewing", label: "整理概念中" },
  { value: "quoted", label: "已报价" },
  { value: "in_progress", label: "制作中" },
  { value: "delivered", label: "已交付" },
  { value: "cancelled", label: "已取消" },
]

const statusLabels = Object.fromEntries(statusOptions.filter((item) => item.value).map((item) => [item.value, item.label]))

function formatDate(value: string) {
  if (!value) {
    return "--"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function AdminSubmissionsPage() {
  const [token, setToken] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [items, setItems] = useState<GameSubmission[]>([])
  const [selected, setSelected] = useState<GameSubmission | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("new")
  const [adminNote, setAdminNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")

  const hasPermissionError = useMemo(() => error.includes("无权限") || error.includes("403"), [error])

  const loadList = async (nextStatus = statusFilter) => {
    const currentToken = getStoredToken()
    setToken(currentToken)
    setSaveMessage("")

    if (!currentToken) {
      setItems([])
      setSelected(null)
      setError("请先登录管理员账号后访问需求管理后台。")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    try {
      const data = await getAdminGameSubmissions({
        token: currentToken,
        status: nextStatus || undefined,
      })
      setItems(data.items || [])

      if (selected && !(data.items || []).some((item) => item.id === selected.id)) {
        setSelected(null)
      }
    } catch (requestError) {
      setItems([])
      setSelected(null)
      setError(requestError instanceof Error ? requestError.message : "获取需求列表失败。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadList("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    void loadList(value)
  }

  const handleViewDetail = async (id: number) => {
    if (!token) {
      setError("请先登录管理员账号后访问需求管理后台。")
      return
    }

    setDetailLoading(true)
    setSaveMessage("")
    setError("")

    try {
      const detail = await getAdminGameSubmission(token, id)
      setSelected(detail)
      setSelectedStatus(detail.status || "new")
      setAdminNote(detail.admin_note || "")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "获取需求详情失败。")
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selected || !token) {
      return
    }

    setSaving(true)
    setSaveMessage("")
    setError("")

    try {
      const updated = await updateAdminGameSubmission({
        token,
        id: selected.id,
        status: selectedStatus,
        admin_note: adminNote,
      })
      setSelected(updated)
      setSelectedStatus(updated.status || "new")
      setAdminNote(updated.admin_note || "")
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSaveMessage("已保存状态和内部备注。")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "更新需求失败。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <main className="relative overflow-hidden px-4 pb-20 pt-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:58px_58px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),transparent_38%,rgba(251,191,36,0.08))]" />

        <div className="relative mx-auto max-w-7xl">
          <Button
            asChild
            variant="outline"
            className="mb-8 rounded-md border-white/15 bg-white/[0.04] text-neutral-200 hover:bg-white/10 hover:text-white"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              返回工作台
            </Link>
          </Button>

          <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1 text-sm text-cyan-100">
                造境 AI · Admin
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">需求管理后台</h1>
              <p className="mt-4 max-w-2xl text-neutral-300">
                查看所有游戏想法提交，跟进状态，记录内部备注。
              </p>
            </div>

            <label className="block min-w-56">
              <span className="mb-2 block text-sm text-neutral-300">状态筛选</span>
              <select
                value={statusFilter}
                onChange={(event) => handleStatusFilterChange(event.target.value)}
                className="h-11 w-full rounded-md border border-white/15 bg-black/50 px-3 text-sm text-white outline-none focus:border-cyan-200/55"
              >
                {statusOptions.map((item) => (
                  <option key={item.value || "all"} value={item.value} className="bg-neutral-950">
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {error ? (
            <div
              className={`mb-6 rounded-lg border p-5 ${
                hasPermissionError
                  ? "border-red-400/30 bg-red-400/[0.08] text-red-100"
                  : "border-amber-300/25 bg-amber-300/[0.08] text-amber-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">全部需求</h2>
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-cyan-200" /> : null}
              </div>

              {loading ? (
                <div className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-neutral-300">正在加载需求列表...</div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-black/25 p-6 text-neutral-300">
                  暂无需求，或当前筛选条件下没有数据。
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                      <tr>
                        <th className="px-3 py-2">需求编号</th>
                        <th className="px-3 py-2">游戏名称</th>
                        <th className="px-3 py-2">游戏类型</th>
                        <th className="px-3 py-2">画风</th>
                        <th className="px-3 py-2">联系方式</th>
                        <th className="px-3 py-2">预算范围</th>
                        <th className="px-3 py-2">状态</th>
                        <th className="px-3 py-2">提交时间</th>
                        <th className="px-3 py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="rounded-lg bg-black/30 text-neutral-200">
                          <td className="rounded-l-lg px-3 py-3 font-mono text-cyan-100">#{item.id}</td>
                          <td className="px-3 py-3">{item.game_name || "未命名游戏想法"}</td>
                          <td className="px-3 py-3">{item.game_type || "--"}</td>
                          <td className="px-3 py-3">{item.art_style || "--"}</td>
                          <td className="px-3 py-3">{item.contact || "--"}</td>
                          <td className="px-3 py-3">{item.budget_range || "--"}</td>
                          <td className="px-3 py-3">
                            <span className="rounded border border-cyan-200/30 bg-cyan-200/10 px-2 py-1 text-xs text-cyan-100">
                              {statusLabels[item.status] || item.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-neutral-400">{formatDate(item.created_at)}</td>
                          <td className="rounded-r-lg px-3 py-3">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void handleViewDetail(item.id)}
                              className="rounded-md bg-white text-black hover:bg-neutral-200"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              查看
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">需求详情</h2>
                {detailLoading ? <Loader2 className="h-5 w-5 animate-spin text-cyan-200" /> : null}
              </div>

              {!selected ? (
                <div className="rounded-lg border border-white/10 bg-black/25 p-6 text-neutral-300">
                  从左侧列表选择一条需求查看详情。
                </div>
              ) : (
                <div className="space-y-5">
                  <DetailRow label="游戏名称" value={selected.game_name || "未命名游戏想法"} />
                  <DetailRow label="游戏类型" value={selected.game_type} />
                  <DetailRow label="画风" value={selected.art_style} />
                  <DetailRow label="主角设定" value={selected.protagonist} />
                  <DetailRow label="敌人 / Boss 设定" value={selected.enemy_boss} />
                  <DetailRow label="场景设定" value={selected.scene_setting} />
                  <DetailRow label="核心玩法" value={selected.core_gameplay} />
                  <DetailRow label="想要的交付内容" value={selected.deliverables?.join("、") || "--"} />
                  <DetailRow label="预算范围" value={selected.budget_range} />
                  <DetailRow label="联系方式" value={selected.contact} />
                  <DetailRow label="补充说明" value={selected.notes} />

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-300">当前状态</span>
                    <select
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value)}
                      className="h-11 w-full rounded-md border border-white/15 bg-black/50 px-3 text-sm text-white outline-none focus:border-cyan-200/55"
                    >
                      {statusOptions
                        .filter((item) => item.value)
                        .map((item) => (
                          <option key={item.value} value={item.value} className="bg-neutral-950">
                            {item.label}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-300">内部备注</span>
                    <textarea
                      value={adminNote}
                      onChange={(event) => setAdminNote(event.target.value)}
                      rows={5}
                      placeholder="记录跟进情况、报价、客户偏好、交付注意事项..."
                      className="w-full resize-y rounded-md border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-cyan-200/55"
                    />
                  </label>

                  {saveMessage ? <div className="rounded border border-emerald-300/25 bg-emerald-300/[0.08] p-3 text-sm text-emerald-100">{saveMessage}</div> : null}

                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="w-full rounded-md bg-cyan-200 text-black hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    保存跟进信息
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-[0.12em] text-neutral-500">{label}</div>
      <div className="whitespace-pre-wrap rounded-md border border-white/10 bg-black/25 px-3 py-2 text-sm leading-6 text-neutral-200">
        {value?.trim() || "--"}
      </div>
    </div>
  )
}
