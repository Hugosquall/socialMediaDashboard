"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  Heart,
  BarChart3,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Trash2,
  RefreshCw,
  Bell,
  ChevronRight,
  X,
  MessageCircle,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/database.types"

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = "instagram" | "tiktok" | "twitter" | "youtube"
type SortField = "name" | "totalFollowers" | "avgEngagement" | "totalPostsPerWeek" | "lastPost"
type SortDir = "asc" | "desc"

interface SocialAccount {
  platform: Platform
  handle: string
  followers: number
  followersDelta: number
  engagementRate: number
  postsPerWeek: number
  avgLikes: number
  avgComments: number
  lastPostHours: number
  trend: number[]
}

interface Competitor {
  id: string
  name: string
  color: string
  accounts: SocialAccount[]
}

type CompetitorRow = Tables<"competitors">

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

function fmtDelta(n: number): string {
  const abs = Math.abs(n)
  return n >= 0 ? `+${fmtNum(abs)}` : `-${fmtNum(abs)}`
}

function fmtLastPost(hours: number): string {
  if (hours < 0) return "—"
  if (hours < 1) return "< 1h"
  if (hours < 24) return `${Math.floor(hours)}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function totalFollowers(c: Competitor): number {
  return c.accounts.reduce((s, a) => s + a.followers, 0)
}

function avgEngagement(c: Competitor): number {
  if (!c.accounts.length) return 0
  return c.accounts.reduce((s, a) => s + a.engagementRate, 0) / c.accounts.length
}

function totalPostsPerWeek(c: Competitor): number {
  return c.accounts.reduce((s, a) => s + a.postsPerWeek, 0)
}

function minLastPostHours(c: Competitor): number {
  if (!c.accounts.length) return -1
  return Math.min(...c.accounts.map((a) => a.lastPostHours))
}

function totalDelta(c: Competitor): number {
  return c.accounts.reduce((s, a) => s + a.followersDelta, 0)
}

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bgClass: string }> = {
  instagram: { label: "Instagram", color: "#e1306c", bgClass: "bg-pink-500/15" },
  tiktok: { label: "TikTok", color: "#69c9d0", bgClass: "bg-cyan-500/15" },
  twitter: { label: "Twitter/X", color: "#1d9bf0", bgClass: "bg-sky-500/15" },
  youtube: { label: "YouTube", color: "#ff0000", bgClass: "bg-red-500/15" },
}

function PlatformSVG({ platform, size = 14 }: { platform: Platform; size?: number }) {
  const s = size
  if (platform === "instagram")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    )
  if (platform === "tiktok")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.53V6.78a4.85 4.85 0 01-1.01-.09z" />
      </svg>
    )
  if (platform === "twitter")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  if (platform === "youtube")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  return null
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = PLATFORM_CONFIG[platform]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${cfg.bgClass}`}
      style={{ color: cfg.color }}
    >
      <PlatformSVG platform={platform} size={9} />
      <span className="hidden sm:inline">{cfg.label}</span>
    </span>
  )
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────

function Sparkline({
  data,
  color = "#6366f1",
  width = 80,
  height = 28,
}: {
  data: number[]
  color?: string
  width?: number
  height?: number
}) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 3
  const step = (width - pad) / (data.length - 1)
  const points = data
    .map((v, i) => {
      const x = i * step + pad / 2
      const y = height - pad - ((v - min) / range) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  const lastX = (data.length - 1) * step + pad / 2
  const lastY =
    height - pad - ((data[data.length - 1] - min) / range) * (height - pad * 2)
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  )
}

// ─── DB → Competitor mapper ───────────────────────────────────────────────────

function flatTrend(value: number): number[] {
  const normalized = Number.isFinite(value) ? Math.max(value, 0) : 0
  return Array.from({ length: 7 }, () => parseFloat(normalized.toFixed(1)))
}

function normalizeHandle(platform: Platform, rawHandle: string): string {
  if (platform === "youtube") return rawHandle
  return rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`
}

function createAccount(
  platform: Platform,
  handle: string,
  followers?: number | null,
  engagementRate?: number | null
): SocialAccount {
  const normalizedFollowers = Math.max(followers ?? 0, 0)
  const normalizedEngagement = Math.max(engagementRate ?? 0, 0)

  return {
    platform,
    handle: normalizeHandle(platform, handle),
    followers: normalizedFollowers,
    followersDelta: 0,
    engagementRate: normalizedEngagement,
    postsPerWeek: 0,
    avgLikes: 0,
    avgComments: 0,
    lastPostHours: -1,
    trend: flatTrend(normalizedEngagement),
  }
}

function dbRowToCompetitor(row: CompetitorRow): Competitor {
  const accounts: SocialAccount[] = []
  const platforms: Platform[] = ["instagram", "tiktok", "twitter", "youtube"]
  const handles: Record<Platform, string | null> = {
    instagram: row.instagram_handle,
    tiktok: row.tiktok_handle,
    twitter: row.twitter_handle,
    youtube: row.youtube_handle,
  }

  for (const p of platforms) {
    const handle = handles[p]
    if (!handle) continue

    accounts.push(
      createAccount(
        p,
        handle,
        p === "instagram" ? row.followers : null,
        p === "instagram" ? row.avg_engagement : null
      )
    )
  }

  return {
    id: row.id as string,
    name: row.name as string,
    color: COLORS[Math.abs(row.name.charCodeAt(0)) % COLORS.length],
    accounts,
  }
}

// ─── Alert Generator ──────────────────────────────────────────────────────────

interface Alert {
  id: string
  competitor: string
  type: string
  message: string
  severity: "warning" | "destructive"
}

function generateAlerts(competitors: Competitor[]): Alert[] {
  const alerts: Alert[] = []
  for (const c of competitors) {
    for (const acc of c.accounts) {
      if (acc.followersDelta > 2000) {
        alerts.push({
          id: `${c.id}-${acc.platform}-growth`,
          competitor: c.name,
          type: "Crescimento",
          message: `${PLATFORM_CONFIG[acc.platform].label}: +${fmtNum(acc.followersDelta)} seguidores em 7 dias`,
          severity: "warning",
        })
      }
      if (acc.followersDelta < -500) {
        alerts.push({
          id: `${c.id}-${acc.platform}-loss`,
          competitor: c.name,
          type: "Queda",
          message: `${PLATFORM_CONFIG[acc.platform].label}: perdeu ${fmtNum(Math.abs(acc.followersDelta))} seguidores esta semana`,
          severity: "destructive",
        })
      }
      if (acc.engagementRate > 8) {
        alerts.push({
          id: `${c.id}-${acc.platform}-eng`,
          competitor: c.name,
          type: "Engajamento",
          message: `${PLATFORM_CONFIG[acc.platform].label}: engajamento elevado — ${acc.engagementRate}%`,
          severity: "warning",
        })
      }
    }
  }
  return alerts
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField
  sortField: SortField
  sortDir: SortDir
}) {
  if (field !== sortField) return <ChevronsUpDown size={11} className="opacity-30" />
  return sortDir === "asc" ? (
    <ChevronUp size={11} className="text-[var(--primary)]" />
  ) : (
    <ChevronDown size={11} className="text-[var(--primary)]" />
  )
}

// ─── Add Competitor Modal ─────────────────────────────────────────────────────

const COLORS = [
  "#ec4899",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#0ea5e9",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
]

function AddCompetitorModal({
  onAdd,
  onClose,
}: {
  onAdd: (c: Competitor) => void
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [handles, setHandles] = useState<Partial<Record<Platform, string>>>({})
  const [colorIdx, setColorIdx] = useState(0)
  const [instagramFollowers, setInstagramFollowers] = useState("")
  const [instagramEngagement, setInstagramEngagement] = useState("")
  const platforms: Platform[] = ["instagram", "tiktok", "twitter", "youtube"]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const filledPlatforms = platforms.filter((p) => handles[p]?.trim())
    if (!filledPlatforms.length) return
    const parsedFollowers = Number.parseInt(instagramFollowers, 10)
    const parsedEngagement = Number.parseFloat(instagramEngagement)
    const instagramFollowersValue = Number.isFinite(parsedFollowers) ? Math.max(parsedFollowers, 0) : 0
    const instagramEngagementValue = Number.isFinite(parsedEngagement) ? Math.max(parsedEngagement, 0) : 0

    const accounts: SocialAccount[] = filledPlatforms.map((platform) => {
      const handle = handles[platform]!.trim()
      return createAccount(
        platform,
        handle,
        platform === "instagram" ? instagramFollowersValue : 0,
        platform === "instagram" ? instagramEngagementValue : 0
      )
    })

    onAdd({ id: Date.now().toString(), name: name.trim(), color: COLORS[colorIdx], accounts })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Adicionar Concorrente
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Nome do concorrente *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: BrandX"
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Cor do perfil
            </label>
            <div className="flex gap-2">
              {COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    colorIdx === i ? "scale-125 border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Handles por rede social{" "}
              <span className="text-[var(--muted-foreground)]">(ao menos uma)</span>
            </label>
            <div className="space-y-2">
              {platforms.map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <div
                    className="flex w-24 shrink-0 items-center gap-1.5 text-xs"
                    style={{ color: PLATFORM_CONFIG[p].color }}
                  >
                    <PlatformSVG platform={p} size={12} />
                    {PLATFORM_CONFIG[p].label}
                  </div>
                  <input
                    value={handles[p] ?? ""}
                    onChange={(e) =>
                      setHandles((prev) => ({ ...prev, [p]: e.target.value }))
                    }
                    placeholder={p === "youtube" ? "nome do canal" : "@handle"}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                Seguidores Instagram
              </label>
              <input
                value={instagramFollowers}
                onChange={(event) => setInstagramFollowers(event.target.value)}
                placeholder="Ex: 128000"
                inputMode="numeric"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                Engajamento Instagram (%)
              </label>
              <input
                value={instagramEngagement}
                onChange={(event) => setInstagramEngagement(event.target.value)}
                placeholder="Ex: 4.8"
                inputMode="decimal"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--border)]"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              <Plus size={14} />
              Adicionar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Platform Detail Row ──────────────────────────────────────────────────────

function PlatformDetailRow({ account }: { account: SocialAccount }) {
  const cfg = PLATFORM_CONFIG[account.platform]
  const positive = account.followersDelta >= 0
  return (
    <div className="grid grid-cols-12 items-center gap-2 rounded-lg border border-[var(--border)]/50 bg-[var(--secondary)]/40 px-3 py-2.5 text-xs">
      <div className="col-span-3 flex items-center gap-2 pl-4">
        <span style={{ color: cfg.color }}>
          <PlatformSVG platform={account.platform} size={12} />
        </span>
        <span className="truncate font-medium" style={{ color: cfg.color }}>
          {account.handle}
        </span>
      </div>

      <div className="col-span-2 text-right">
        <span className="font-semibold text-[var(--foreground)]">
          {fmtNum(account.followers)}
        </span>
        <span className={`ml-1.5 text-[10px] ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {fmtDelta(account.followersDelta)}
        </span>
      </div>

      <div className="col-span-2 text-right font-semibold text-[var(--foreground)]">
        {account.engagementRate.toFixed(1)}%
      </div>

      <div className="col-span-1 text-right text-[var(--muted-foreground)]">
        {account.postsPerWeek}/sem
      </div>

      <div className="col-span-2 flex items-center justify-end gap-3">
        <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
          <Heart size={10} />
          {fmtNum(account.avgLikes)}
        </span>
        <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
          <MessageCircle size={10} />
          {fmtNum(account.avgComments)}
        </span>
      </div>

      <div className="col-span-1 flex justify-end">
        <Sparkline data={account.trend} color={cfg.color} width={60} height={22} />
      </div>

      <div className="col-span-1 text-right text-[var(--muted-foreground)]">
        {fmtLastPost(account.lastPostHours)}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading]         = useState(true)
  const [userId, setUserId]           = useState<string | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [sortField, setSortField]     = useState<SortField>("totalFollowers")
  const [sortDir, setSortDir]         = useState<SortDir>("desc")
  const [search, setSearch]           = useState("")
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all")
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())

  const supabase = createClient()

  const loadCompetitors = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data, error } = await supabase
        .from("competitors")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        setCompetitors([])
        return
      }

      if (data) {
        setCompetitors(data.map(dbRowToCompetitor))
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadCompetitors()
  }, [loadCompetitors])

  const alerts = useMemo(() => generateAlerts(competitors), [competitors])

  const filtered = useMemo(() => {
    let list = competitors

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.accounts.some((a) => a.handle.toLowerCase().includes(q))
      )
    }

    if (platformFilter !== "all") {
      list = list.filter((c) => c.accounts.some((a) => a.platform === platformFilter))
    }

    return [...list].sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.name.localeCompare(b.name)
        return sortDir === "asc" ? cmp : -cmp
      }
      let va: number, vb: number
      switch (sortField) {
        case "totalFollowers":
          va = totalFollowers(a)
          vb = totalFollowers(b)
          break
        case "avgEngagement":
          va = avgEngagement(a)
          vb = avgEngagement(b)
          break
        case "totalPostsPerWeek":
          va = totalPostsPerWeek(a)
          vb = totalPostsPerWeek(b)
          break
        case "lastPost":
          va = minLastPostHours(a)
          vb = minLastPostHours(b)
          break
        default:
          va = 0
          vb = 0
      }
      return sortDir === "asc" ? va - vb : vb - va
    })
  }, [competitors, search, platformFilter, sortField, sortDir])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  function handleSort(field: SortField) {
    if (field === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAddCompetitor(c: Competitor) {
    // Monta handles a partir das accounts
    const byPlatform = Object.fromEntries(c.accounts.map((a) => [a.platform, a.handle]))

    if (userId) {
      const { data, error } = await supabase.from("competitors").insert({
        user_id:          userId,
        name:             c.name,
        instagram_handle: byPlatform["instagram"] ?? null,
        tiktok_handle:    byPlatform["tiktok"]    ?? null,
        twitter_handle:   byPlatform["twitter"]   ?? null,
        youtube_handle:   byPlatform["youtube"]   ?? null,
        followers:        c.accounts.find((a) => a.platform === "instagram")?.followers ?? null,
        avg_engagement:   c.accounts.find((a) => a.platform === "instagram")?.engagementRate ?? null,
        is_active:        true,
      }).select().single()

      if (!error && data) {
        // Usa o ID real do banco
        setCompetitors((prev) => [{ ...c, id: data.id }, ...prev])
        return
      }
    }

    // Fallback: adiciona localmente sem persistir
    setCompetitors((prev) => [c, ...prev])
  }

  async function removeCompetitor(id: string) {
    if (userId) {
      await supabase.from("competitors").update({ is_active: false }).eq("id", id)
    }
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
    setExpanded((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const platforms: Platform[] = ["instagram", "tiktok", "twitter", "youtube"]

  const totalAccounts = competitors.reduce((s, c) => s + c.accounts.length, 0)
  const competitorsCount = competitors.length
  const avgFollowersValue =
    competitorsCount > 0
      ? Math.round(
          competitors.reduce((s, c) => s + totalFollowers(c), 0) / competitorsCount
        )
      : 0
  const avgEngagementValue =
    competitorsCount > 0
      ? parseFloat(
          (
            competitors.reduce((s, c) => s + avgEngagement(c), 0) /
            competitorsCount
          ).toFixed(1)
        )
      : 0
  const avgPostsPerWeekValue =
    competitorsCount > 0
      ? Math.round(
          competitors.reduce((s, c) => s + totalPostsPerWeek(c), 0) /
            competitorsCount
        )
      : 0

  return (
    <div className="space-y-5">
      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-400">
              <Bell size={14} />
              {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"} detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"
                >
                  <Badge variant={alert.severity} className="mt-0.5 shrink-0 text-[10px]">
                    {alert.type}
                  </Badge>
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground)]">
                      {alert.competitor}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main Table ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Concorrentes Rastreados</CardTitle>
              <CardDescription>
                {competitors.length} perfis · {totalAccounts} contas em{" "}
                {platforms.filter((p) =>
                  competitors.some((c) => c.accounts.some((a) => a.platform === p))
                ).length}{" "}
                plataformas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => { void loadCompetitors() }}
                className="bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <RefreshCw size={13} />
              </Button>
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus size={14} />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px] flex-1">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou handle..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] py-1.5 pl-8 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPlatformFilter("all")}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  platformFilter === "all"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Todos
              </button>
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    platformFilter === p
                      ? "text-white"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  style={
                    platformFilter === p
                      ? { backgroundColor: PLATFORM_CONFIG[p].color }
                      : {}
                  }
                >
                  <PlatformSVG platform={p} size={11} />
                  <span className="hidden sm:inline">{PLATFORM_CONFIG[p].label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
              Nenhum concorrente encontrado.{" "}
              <button
                onClick={() => setShowModal(true)}
                className="text-[var(--primary)] underline"
              >
                Adicionar agora
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                <button
                  className="col-span-3 flex cursor-pointer items-center gap-1 text-left hover:text-[var(--foreground)]"
                  onClick={() => handleSort("name")}
                >
                  Perfil{" "}
                  <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                </button>
                <button
                  className="col-span-2 flex cursor-pointer items-center justify-end gap-1 hover:text-[var(--foreground)]"
                  onClick={() => handleSort("totalFollowers")}
                >
                  <SortIcon
                    field="totalFollowers"
                    sortField={sortField}
                    sortDir={sortDir}
                  />
                  Seguidores
                </button>
                <button
                  className="col-span-2 flex cursor-pointer items-center justify-end gap-1 hover:text-[var(--foreground)]"
                  onClick={() => handleSort("avgEngagement")}
                >
                  <SortIcon
                    field="avgEngagement"
                    sortField={sortField}
                    sortDir={sortDir}
                  />
                  Engajamento
                </button>
                <button
                  className="col-span-1 flex cursor-pointer items-center justify-end gap-1 hover:text-[var(--foreground)]"
                  onClick={() => handleSort("totalPostsPerWeek")}
                >
                  <SortIcon
                    field="totalPostsPerWeek"
                    sortField={sortField}
                    sortDir={sortDir}
                  />
                  Posts
                </button>
                <div className="col-span-2 text-right">Tendência</div>
                <button
                  className="col-span-1 flex cursor-pointer items-center justify-end gap-1 hover:text-[var(--foreground)]"
                  onClick={() => handleSort("lastPost")}
                >
                  <SortIcon field="lastPost" sortField={sortField} sortDir={sortDir} />
                  Último
                </button>
                <div className="col-span-1" />
              </div>

              {/* Rows */}
              {filtered.map((comp) => {
                const isExpanded = expanded.has(comp.id)
                const tf = totalFollowers(comp)
                const ae = avgEngagement(comp)
                const tp = totalPostsPerWeek(comp)
                const lp = minLastPostHours(comp)
                const delta = totalDelta(comp)
                const positive = delta >= 0
                const trendData = comp.accounts[0]?.trend ?? []

                const visibleAccounts =
                  platformFilter === "all"
                    ? comp.accounts
                    : comp.accounts.filter((a) => a.platform === platformFilter)

                return (
                  <div key={comp.id}>
                    {/* Main row */}
                    <div
                      className={`group grid cursor-pointer select-none grid-cols-12 items-center gap-2 rounded-lg border px-3 py-3 transition-all ${
                        isExpanded
                          ? "border-[var(--primary)]/40 bg-[var(--primary)]/5"
                          : "border-[var(--border)] hover:bg-[var(--secondary)]/50"
                      }`}
                      onClick={() => toggleExpand(comp.id)}
                    >
                      {/* Profile */}
                      <div className="col-span-3 flex min-w-0 items-center gap-2">
                        <ChevronRight
                          size={13}
                          className={`shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: comp.color }}
                        >
                          {comp.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                            {comp.name}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {visibleAccounts.map((a) => (
                              <PlatformBadge key={a.platform} platform={a.platform} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Followers */}
                      <div className="col-span-2 text-right">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {fmtNum(tf)}
                        </p>
                        <p
                          className={`text-xs ${
                            positive ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {fmtDelta(delta)}
                        </p>
                      </div>

                      {/* Engagement */}
                      <div className="col-span-2 text-right">
                        <p className="flex items-center justify-end gap-1 text-sm font-semibold text-[var(--foreground)]">
                          {ae > 5 ? (
                            <TrendingUp size={12} className="text-emerald-400" />
                          ) : ae < 2.5 ? (
                            <TrendingDown size={12} className="text-red-400" />
                          ) : (
                            <Minus size={12} className="text-[var(--muted-foreground)]" />
                          )}
                          {ae.toFixed(1)}%
                        </p>
                      </div>

                      {/* Posts/week */}
                      <div className="col-span-1 text-right">
                        <p className="text-sm text-[var(--foreground)]">{tp}</p>
                      </div>

                      {/* Sparkline */}
                      <div className="col-span-2 flex justify-end">
                        <Sparkline
                          data={trendData}
                          color={comp.color}
                          width={72}
                          height={28}
                        />
                      </div>

                      {/* Last post */}
                      <div className="col-span-1 text-right">
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {fmtLastPost(lp)}
                        </p>
                      </div>

                      {/* Remove button */}
                      <div
                        className="col-span-1 flex justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => { void removeCompetitor(comp.id) }}
                          className="rounded p-1 text-[var(--muted-foreground)] opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                          title="Remover concorrente"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded: per-platform rows */}
                    {isExpanded && (
                      <div className="mb-1.5 ml-4 mt-1 space-y-1">
                        <div className="grid grid-cols-12 gap-2 px-3 pb-1 text-[9px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                          <div className="col-span-3 pl-4">Conta</div>
                          <div className="col-span-2 text-right">Seguidores</div>
                          <div className="col-span-2 text-right">Engajamento</div>
                          <div className="col-span-1 text-right">Freq.</div>
                          <div className="col-span-2 text-right">Curtidas / Coments</div>
                          <div className="col-span-1 text-right">Tendência</div>
                          <div className="col-span-1 text-right">Postou</div>
                        </div>
                        {visibleAccounts.map((acc) => (
                          <PlatformDetailRow key={acc.platform} account={acc} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── You vs Competitors ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Seus seguidores",
            you: 48200,
            avg: avgFollowersValue,
            icon: Users,
            fmt: (v: number) => fmtNum(v),
            higherIsBetter: true,
          },
          {
            label: "Engajamento médio",
            you: 4.8,
            avg: avgEngagementValue,
            icon: Heart,
            fmt: (v: number) => `${v.toFixed(1)}%`,
            higherIsBetter: true,
          },
          {
            label: "Posts/semana",
            you: 9,
            avg: avgPostsPerWeekValue,
            icon: BarChart3,
            fmt: (v: number) => v.toString(),
            higherIsBetter: true,
          },
          {
            label: "Alertas ativos",
            you: 0,
            avg: alerts.length,
            icon: AlertTriangle,
            fmt: (v: number) => v.toString(),
            higherIsBetter: false,
          },
        ].map((item) => {
          const Icon = item.icon
          const youWins = item.higherIsBetter ? item.you >= item.avg : item.you <= item.avg
          const pct = Math.min(
            ((item.you / Math.max(item.you + item.avg, 1)) * 100 * 1.6),
            100
          )
          return (
            <Card key={item.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Icon size={13} className="text-[var(--muted-foreground)]" />
                  <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
                    {item.label}
                  </p>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Você</p>
                    <p
                      className={`text-xl font-bold ${
                        youWins ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                      }`}
                    >
                      {item.fmt(item.you)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--muted-foreground)]">Média concorrentes</p>
                    <p
                      className={`text-xl font-bold ${
                        !youWins ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                      }`}
                    >
                      {item.fmt(item.avg)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1 w-full rounded-full bg-[var(--secondary)]">
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: youWins ? "var(--primary)" : "#ef4444",
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-[var(--muted-foreground)]">
                  {youWins ? "✓ Acima da média" : "↓ Abaixo da média"}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <AddCompetitorModal
          onAdd={handleAddCompetitor}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
