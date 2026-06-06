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
  CheckCircle2,
  Search,
  Trash2,
  RefreshCw,
  Bell,
  ChevronRight,
  X,
  MessageCircle,
  Loader2,
  Copy,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { AnalyticsResponse } from "@/app/api/analytics/route"
import type { Tables, TablesInsert } from "@/lib/database.types"

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = "instagram" | "tiktok" | "twitter" | "youtube"
type SortField = "name" | "totalFollowers" | "avgEngagement" | "totalPostsPerWeek" | "lastPost"
type SortDir = "asc" | "desc"
type FeedbackKind = "error" | "success"

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

interface ActionFeedback {
  kind: FeedbackKind
  message: string
}

type CompetitorRow = Tables<"competitors">
type CompetitorSnapshotRow = Tables<"competitor_snapshots">
type CompetitorSnapshotInsert = TablesInsert<"competitor_snapshots">

interface UserBenchmark {
  followers: number
  engagementRate: number
  postsPerWeek: number
  source: "instagram" | "metricool" | "mock" | "none"
}

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

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function buildUserBenchmark(analytics: AnalyticsResponse | null): UserBenchmark {
  if (!analytics) {
    return { followers: 0, engagementRate: 0, postsPerWeek: 0, source: "none" }
  }

  const daily = analytics.daily ?? []
  const avgEngagement = daily.length > 0
    ? daily.reduce((sum, day) => sum + day.engagementRate, 0) / daily.length
    : 0
  const followers = analytics.source === "instagram"
    ? analytics.profile?.followers ?? daily[daily.length - 1]?.followers ?? 0
    : daily[daily.length - 1]?.followers ?? 0
  const postsPerWeek = Math.round(((analytics.topPosts?.length ?? 0) / 30) * 7)

  return {
    followers,
    engagementRate: parseFloat(avgEngagement.toFixed(1)),
    postsPerWeek,
    source: analytics.source,
  }
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

function FeedbackBanner({ feedback }: { feedback: ActionFeedback }) {
  const isError = feedback.kind === "error"

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {isError ? <AlertTriangle size={14} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
      <p>{feedback.message}</p>
    </div>
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
  engagementRate?: number | null,
  snapshot?: CompetitorSnapshotRow | null,
  previousSnapshot?: CompetitorSnapshotRow | null
): SocialAccount {
  const normalizedFollowers = Math.max(snapshot?.followers ?? followers ?? 0, 0)
  const normalizedEngagement = Math.max(snapshot?.engagement_rate ?? engagementRate ?? 0, 0)
  const followersDelta = snapshot?.followers_delta
    ?? (
      snapshot?.followers != null && previousSnapshot?.followers != null
        ? snapshot.followers - previousSnapshot.followers
        : 0
    )
  const snapshotTrend = snapshot && previousSnapshot
    ? [previousSnapshot.engagement_rate ?? 0, snapshot.engagement_rate ?? 0]
    : null

  return {
    platform,
    handle: normalizeHandle(platform, handle),
    followers: normalizedFollowers,
    followersDelta,
    engagementRate: normalizedEngagement,
    postsPerWeek: Math.max(snapshot?.posts_per_week ?? 0, 0),
    avgLikes: Math.max(snapshot?.avg_likes ?? 0, 0),
    avgComments: Math.max(snapshot?.avg_comments ?? 0, 0),
    lastPostHours: -1,
    trend: snapshotTrend ?? flatTrend(normalizedEngagement),
  }
}

function findLatestSnapshots(
  snapshots: CompetitorSnapshotRow[],
  platform: Platform
): [CompetitorSnapshotRow | null, CompetitorSnapshotRow | null] {
  const platformSnapshots = snapshots
    .filter((snapshot) => snapshot.platform === platform)
    .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())

  return [platformSnapshots[0] ?? null, platformSnapshots[1] ?? null]
}

function groupSnapshotsByCompetitor(
  snapshots: CompetitorSnapshotRow[]
): Map<string, CompetitorSnapshotRow[]> {
  const grouped = new Map<string, CompetitorSnapshotRow[]>()
  for (const snapshot of snapshots) {
    const list = grouped.get(snapshot.competitor_id) ?? []
    list.push(snapshot)
    grouped.set(snapshot.competitor_id, list)
  }
  return grouped
}

function dbRowToCompetitor(row: CompetitorRow, snapshots: CompetitorSnapshotRow[] = []): Competitor {
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
    const [latestSnapshot, previousSnapshot] = findLatestSnapshots(snapshots, p)

    accounts.push(
      createAccount(
        p,
        handle,
        p === "instagram" ? row.followers : null,
        p === "instagram" ? row.avg_engagement : null,
        latestSnapshot,
        previousSnapshot
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

function buildSnapshotInserts(
  userId: string,
  competitor: Competitor,
  capturedAt = new Date()
): CompetitorSnapshotInsert[] {
  return competitor.accounts.map((account) => ({
    user_id: userId,
    competitor_id: competitor.id,
    platform: account.platform,
    handle: account.handle,
    followers: account.followers,
    followers_delta: account.followersDelta,
    engagement_rate: account.engagementRate,
    posts_per_week: account.postsPerWeek,
    avg_likes: account.avgLikes,
    avg_comments: account.avgComments,
    captured_at: capturedAt.toISOString(),
  }))
}

function buildCompetitorReport(
  competitors: Competitor[],
  userBenchmark: UserBenchmark,
  sourceLabel: string
): string {
  const lines = [
    "# Relatório de Concorrentes",
    "",
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    `Fonte do seu benchmark: ${sourceLabel}`,
    "",
    "## Seu perfil",
    "",
    `- Seguidores: ${fmtNum(userBenchmark.followers)}`,
    `- Engajamento médio: ${userBenchmark.engagementRate.toFixed(1)}%`,
    `- Posts/semana: ${userBenchmark.postsPerWeek}`,
    "",
    "## Concorrentes",
    "",
  ]

  if (competitors.length === 0) {
    lines.push("Nenhum concorrente ativo cadastrado.")
    return lines.join("\n")
  }

  for (const competitor of competitors) {
    lines.push(`### ${competitor.name}`)
    lines.push(`- Seguidores totais: ${fmtNum(totalFollowers(competitor))}`)
    lines.push(`- Engajamento médio: ${avgEngagement(competitor).toFixed(1)}%`)
    lines.push(`- Posts/semana: ${totalPostsPerWeek(competitor)}`)
    lines.push(`- Delta seguidores: ${fmtDelta(totalDelta(competitor))}`)
    for (const account of competitor.accounts) {
      lines.push(
        `  - ${PLATFORM_CONFIG[account.platform].label} ${account.handle}: ${fmtNum(account.followers)} seguidores, ${account.engagementRate.toFixed(1)}% engajamento`
      )
    }
    lines.push("")
  }

  return lines.join("\n")
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
  feedback,
}: {
  onAdd: (c: Competitor) => Promise<void>
  onClose: () => void
  feedback: ActionFeedback | null
}) {
  const [name, setName] = useState("")
  const [handles, setHandles] = useState<Partial<Record<Platform, string>>>({})
  const [colorIdx, setColorIdx] = useState(0)
  const [instagramFollowers, setInstagramFollowers] = useState("")
  const [instagramEngagement, setInstagramEngagement] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const platforms: Platform[] = ["instagram", "tiktok", "twitter", "youtube"]

  async function handleSubmit(e: React.FormEvent) {
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

    setIsSubmitting(true)
    try {
      await onAdd({ id: Date.now().toString(), name: name.trim(), color: COLORS[colorIdx], accounts })
      onClose()
    } catch {
      // O erro já é exibido no banner da página/modal.
    } finally {
      setIsSubmitting(false)
    }
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
          {feedback && (
            <FeedbackBanner feedback={feedback} />
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Nome do concorrente *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Rocketseat, OpenAI, Código Fonte TV"
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
                    placeholder={p === "youtube" ? "nome do canal" : "@perfil"}
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
              disabled={isSubmitting}
              className="flex-1 bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--border)]"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {isSubmitting ? "Salvando..." : "Adicionar"}
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
  const [analytics, setAnalytics]     = useState<AnalyticsResponse | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [userId, setUserId]           = useState<string | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [sortField, setSortField]     = useState<SortField>("totalFollowers")
  const [sortDir, setSortDir]         = useState<SortDir>("desc")
  const [search, setSearch]           = useState("")
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all")
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())
  const [feedback, setFeedback]       = useState<ActionFeedback | null>(null)
  const [reportCopied, setReportCopied] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => {
      setFeedback(null)
    }, 4500)

    return () => window.clearTimeout(timeout)
  }, [feedback])

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
        const competitorIds = data.map((row) => row.id)
        let snapshotsByCompetitor = new Map<string, CompetitorSnapshotRow[]>()

        if (competitorIds.length > 0) {
          const { data: snapshots, error: snapshotsError } = await supabase
            .from("competitor_snapshots")
            .select("*")
            .eq("user_id", user.id)
            .in("competitor_id", competitorIds)
            .order("captured_at", { ascending: false })

          if (snapshotsError) {
            setFeedback({
              kind: "error",
              message: "Snapshots indisponíveis até aplicar a migration `competitor_snapshots`.",
            })
          } else {
            snapshotsByCompetitor = groupSnapshotsByCompetitor((snapshots ?? []) as CompetitorSnapshotRow[])
          }
        }

        setCompetitors(data.map((row) => dbRowToCompetitor(row, snapshotsByCompetitor.get(row.id) ?? [])))
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadCompetitors()
  }, [loadCompetitors])

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const end = new Date()
      const start = new Date(end)
      start.setDate(end.getDate() - 29)
      const res = await fetch(`/api/analytics?from=${toInputDate(start)}&to=${toInputDate(end)}`, {
        cache: "no-store",
      })
      if (!res.ok) return
      const json = (await res.json()) as AnalyticsResponse
      setAnalytics(json)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const alerts = useMemo(() => generateAlerts(competitors), [competitors])
  const userBenchmark = useMemo(() => buildUserBenchmark(analytics), [analytics])

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
    if (!userId) {
      setFeedback({
        kind: "error",
        message: "Não foi possível salvar o concorrente agora. Usuário não autenticado.",
      })
      throw new Error("Usuário não autenticado")
    }

    // Monta handles a partir das accounts
    const byPlatform = Object.fromEntries(c.accounts.map((a) => [a.platform, a.handle]))

    try {
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

      if (error || !data) {
        const message = error?.message ?? "Não foi possível persistir o concorrente no banco."
        setFeedback({ kind: "error", message })
        throw new Error(message)
      }

      // Usa o ID real do banco
      const savedCompetitor = { ...c, id: data.id }
      const { error: snapshotError } = await supabase
        .from("competitor_snapshots")
        .insert(buildSnapshotInserts(userId, savedCompetitor))

      if (snapshotError) {
        setFeedback({
          kind: "error",
          message: "Concorrente salvo, mas o snapshot inicial falhou. Aplique a migration `competitor_snapshots`.",
        })
      }

      setCompetitors((prev) => [savedCompetitor, ...prev])
      setFeedback({
        kind: "success",
        message: snapshotError
          ? "Concorrente adicionado. Snapshot pendente até aplicar a migration."
          : "Concorrente adicionado com snapshot inicial.",
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível persistir o concorrente no banco."
      setFeedback({ kind: "error", message })
      throw error
    }
  }

  async function removeCompetitor(id: string) {
    if (!userId) {
      setFeedback({
        kind: "error",
        message: "Não foi possível remover o concorrente agora. Usuário não autenticado.",
      })
      return
    }

    const { error } = await supabase
      .from("competitors")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single()

    if (error) {
      setFeedback({
        kind: "error",
        message: error.message ?? "Não foi possível remover o concorrente no banco.",
      })
      return
    }

    setCompetitors((prev) => prev.filter((c) => c.id !== id))
    setExpanded((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setFeedback({
      kind: "success",
      message: "Concorrente removido com sucesso.",
    })
  }

  async function captureSnapshotsForCompetitor(competitor: Competitor) {
    if (!userId) {
      setFeedback({
        kind: "error",
        message: "Não foi possível registrar snapshot agora. Usuário não autenticado.",
      })
      return
    }

    const { error } = await supabase
      .from("competitor_snapshots")
      .insert(buildSnapshotInserts(userId, competitor))

    if (error) {
      setFeedback({
        kind: "error",
        message: "Não foi possível registrar snapshot. Aplique a migration `competitor_snapshots`.",
      })
      return
    }

    await loadCompetitors()
    setFeedback({
      kind: "success",
      message: `Snapshot registrado para ${competitor.name}.`,
    })
  }

  async function copyCompetitorReport() {
    await navigator.clipboard.writeText(buildCompetitorReport(filtered, userBenchmark, userSourceLabel))
    setReportCopied(true)
    window.setTimeout(() => setReportCopied(false), 1800)
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
  const userSourceLabel = userBenchmark.source === "instagram"
    ? "Instagram conectado"
    : userBenchmark.source === "metricool"
      ? "Metricool"
      : userBenchmark.source === "mock"
        ? "dados demo"
        : "aguardando dados"

  return (
    <div className="space-y-5">
      {feedback && <FeedbackBanner feedback={feedback} />}

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
                plataformas · comparação com seus dados do Analytics
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  void loadCompetitors()
                  void loadAnalytics()
                }}
                className="bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <RefreshCw size={13} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { void copyCompetitorReport() }}
              >
                <Copy size={13} />
                {reportCopied ? "Copiado" : "Relatório"}
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
            <div className="mx-auto max-w-md py-16 text-center text-sm text-[var(--muted-foreground)]">
              <p className="font-medium text-[var(--foreground)]">Nenhum concorrente encontrado</p>
              <p className="mt-1 text-xs leading-relaxed">
                Adicione perfis de IA, desenvolvimento, QA ou criadores técnicos para comparar seguidores,
                engajamento e presença por rede.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-[var(--primary)] underline"
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
                          onClick={() => { void captureSnapshotsForCompetitor(comp) }}
                          className="rounded p-1 text-[var(--muted-foreground)] opacity-0 transition-all hover:text-[var(--primary)] group-hover:opacity-100"
                          title="Registrar snapshot"
                        >
                          <BarChart3 size={13} />
                        </button>
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
            you: userBenchmark.followers,
            avg: avgFollowersValue,
            icon: Users,
            fmt: (v: number) => fmtNum(v),
            higherIsBetter: true,
          },
          {
            label: "Engajamento médio",
            you: userBenchmark.engagementRate,
            avg: avgEngagementValue,
            icon: Heart,
            fmt: (v: number) => `${v.toFixed(1)}%`,
            higherIsBetter: true,
          },
          {
            label: "Posts/semana",
            you: userBenchmark.postsPerWeek,
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
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {analyticsLoading ? "Carregando..." : `Você · ${userSourceLabel}`}
                    </p>
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
          feedback={feedback}
        />
      )}
    </div>
  )
}
