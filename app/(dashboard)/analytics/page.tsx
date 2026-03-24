"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Heart,
  Image as ImageIcon,
  Video,
  RefreshCw,
  Camera,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import type { AnalyticsResponse, DailyDataPoint } from "@/app/api/analytics/route"

// ─── Source badge config ──────────────────────────────────────────────────────

const SOURCE_CONFIG = {
  instagram: {
    label:   "Instagram Graph API",
    icon:    Camera,
    classes: "border-pink-500/30 bg-pink-500/10 text-pink-400",
  },
  metricool: {
    label:   "Metricool",
    icon:    BarChart3,
    classes: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  mock: {
    label:   "Dados de demonstração",
    icon:    AlertCircle,
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
} as const

// Network badge colors
const NETWORK_COLORS: Record<string, { dot: string; text: string }> = {
  Instagram: { dot: "bg-indigo-400", text: "text-indigo-400" },
  Facebook:  { dot: "bg-blue-400",   text: "text-blue-400"   },
  Twitter:   { dot: "bg-cyan-400",   text: "text-cyan-400"   },
}

// ─── Custom dark tooltip ──────────────────────────────────────────────────────

interface TooltipPayload { color: string; name: string; value: number | string }

function DarkTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  valueFormatter?: (v: number | string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[#1a1a2e] p-3 shadow-xl text-xs">
      <p className="mb-1.5 font-semibold text-[var(--foreground)]">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span>{entry.name}:</span>
          <span className="font-medium text-[var(--foreground)]">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toInputDate(d: Date) { return d.toISOString().slice(0, 10) }
function fromInputDate(s: string) { return new Date(s + "T00:00:00") }
function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

const PRESETS = [
  { label: "7 dias",  days: 7  },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
]

const NETWORKS = [
  { id: "all",       label: "Todas",       dot: ""              },
  { id: "instagram", label: "Instagram",   dot: "bg-indigo-400" },
  { id: "facebook",  label: "Facebook",    dot: "bg-blue-400"   },
  { id: "twitter",   label: "Twitter / X", dot: "bg-cyan-400"   },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const today     = new Date()
  const thirtyAgo = new Date(today)
  thirtyAgo.setDate(today.getDate() - 29)

  const [startDate,    setStartDate]    = useState(toInputDate(thirtyAgo))
  const [endDate,      setEndDate]      = useState(toInputDate(today))
  const [activePreset, setActivePreset] = useState<number | null>(30)
  const [network,      setNetwork]      = useState("all")

  // ── Analytics data state ────────────────────────────────────────────────
  const [data,     setData]     = useState<AnalyticsResponse | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0) // incrementado para forçar refetch

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics?from=${startDate}&to=${endDate}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: AnalyticsResponse = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, fetchKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived values ──────────────────────────────────────────────────────
  const dailyData = useMemo(() => data?.daily ?? [], [data?.daily])
  const topPostsAll    = data?.topPosts        ?? []
  const engByType      = data?.engagementByType ?? []
  const source         = data?.source
  const srcAvailable   = data?.sourcesAvailable ?? { instagram: false, metricool: false }

  const totalImpressions = dailyData.reduce((s, d) => s + d.impressions, 0)
  const avgEngagement    = dailyData.length > 0
    ? (dailyData.reduce((s, d) => s + d.engagementRate, 0) / dailyData.length).toFixed(2)
    : "0.00"
  const followerStart  = dailyData[0]?.followers ?? 0
  const followerEnd    = dailyData[dailyData.length - 1]?.followers ?? 0
  const followerGrowth = followerEnd - followerStart
  const totalReach     = dailyData.reduce((s, d) => s + d.reach, 0)

  const kpis = [
    {
      label: "Total de Impressões",
      value: totalImpressions >= 1_000_000
        ? `${(totalImpressions / 1_000_000).toFixed(1)}M`
        : `${(totalImpressions / 1000).toFixed(1)}K`,
      icon: Eye, color: "text-indigo-400", bg: "bg-indigo-400/10",
      change: "+24%", trend: "up" as const,
    },
    {
      label: "Taxa de Engajamento",
      value: `${avgEngagement}%`,
      icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10",
      change: "+0.3pp", trend: "up" as const,
    },
    {
      label: "Crescimento de Seguidores",
      value: followerGrowth >= 0
        ? `+${followerGrowth.toLocaleString("pt-BR")}`
        : followerGrowth.toLocaleString("pt-BR"),
      icon: Users, color: "text-emerald-400", bg: "bg-emerald-400/10",
      change: "+12%", trend: (followerGrowth >= 0 ? "up" : "down") as "up" | "down",
    },
    {
      label: "Alcance Total",
      value: totalReach >= 1_000_000
        ? `${(totalReach / 1_000_000).toFixed(1)}M`
        : `${(totalReach / 1000).toFixed(1)}K`,
      icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-400/10",
      change: "+8.1%", trend: "up" as const,
    },
  ]

  // Subsampling para legibilidade em ranges longos
  const chartData = useMemo<DailyDataPoint[]>(() => {
    if (dailyData.length <= 30) return dailyData
    const step = Math.ceil(dailyData.length / 30)
    return dailyData.filter((_, i) => i % step === 0)
  }, [dailyData])

  // Filtra top posts por rede
  const filteredPosts = network === "all"
    ? topPostsAll
    : topPostsAll.filter((p) => p.network.toLowerCase() === network)

  // ── Handlers ────────────────────────────────────────────────────────────
  function handlePreset(days: number) {
    const end   = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (days - 1))
    setEndDate(toInputDate(end))
    setStartDate(toInputDate(start))
    setActivePreset(days)
  }

  function handleRefresh() {
    setFetchKey((k) => k + 1)
  }

  const from = fromInputDate(startDate)
  const to   = fromInputDate(endDate)

  // ── Source badge ─────────────────────────────────────────────────────────
  const srcCfg = source ? SOURCE_CONFIG[source] : null

  return (
    <div className="space-y-6">

      {/* ── Banner de fonte de dados ─────────────────────────────────────── */}
      {srcCfg && !loading && (
        <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs ${srcCfg.classes}`}>
          <srcCfg.icon size={13} className="shrink-0" />
          <span>
            <span className="font-semibold">Fonte de dados: {srcCfg.label}</span>
            {source === "mock" && (
              <span className="ml-1 opacity-80">
                — Conecte o Instagram ou configure a Metricool em{" "}
                <a href="/settings" className="underline underline-offset-2">Configurações</a>{" "}
                para ver dados reais.
              </span>
            )}
            {source === "instagram" && srcAvailable.metricool && (
              <span className="ml-1 opacity-80">
                — Metricool também disponível (usado como fallback para Facebook/Twitter).
              </span>
            )}
          </span>
          {source !== "mock" && (
            <CheckCircle2 size={13} className="ml-auto shrink-0 opacity-70" />
          )}
        </div>
      )}

      {/* ── Erro de carregamento ─────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
          <AlertCircle size={13} className="shrink-0" />
          Erro ao carregar Analytics: {error}
          <button onClick={handleRefresh} className="ml-auto underline">Tentar novamente</button>
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Presets + Date Range */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.days}
              variant={activePreset === p.days ? "default" : "outline"}
              size="sm"
              onClick={() => handlePreset(p.days)}
            >
              {p.label}
            </Button>
          ))}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => { setStartDate(e.target.value); setActivePreset(null) }}
              className="h-8 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            <span className="text-xs text-[var(--muted-foreground)]">→</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => { setEndDate(e.target.value); setActivePreset(null) }}
              className="h-8 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">
            {daysBetween(from, to) + 1} dias
          </span>
        </div>

        {/* Network filter + Refresh */}
        <div className="flex items-center gap-2">
          {NETWORKS.map((n) => (
            <Button
              key={n.id}
              variant={network === n.id ? "default" : "outline"}
              size="sm"
              onClick={() => setNetwork(n.id)}
              className="gap-1.5"
            >
              {n.dot && <span className={`h-2 w-2 rounded-full ${n.dot}`} />}
              {n.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {loading ? "Carregando…" : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-[var(--muted-foreground)]" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <p className="text-xs text-[var(--muted-foreground)]">{kpi.label}</p>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${kpi.bg}`}>
                        <Icon size={15} className={kpi.color} />
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">{kpi.value}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {kpi.trend === "up"
                        ? <TrendingUp  size={11} className="text-emerald-400" />
                        : <TrendingDown size={11} className="text-red-400" />}
                      <span className={`text-xs font-medium ${kpi.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                        {kpi.change}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">vs período ant.</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Gráficos de linha ────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye size={15} className="text-indigo-400" />
              Impressões ao longo do tempo
            </CardTitle>
            <CardDescription>Total diário de impressões nas redes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center" style={{ height: 220 }}>
                <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<DarkTooltip valueFormatter={(v) => `${Number(v).toLocaleString("pt-BR")}`} />} />
                  <Line type="monotone" dataKey="impressions" name="Impressões" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#6366f1" }} />
                  <Line type="monotone" dataKey="reach"       name="Alcance"   stroke="#a78bfa" strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4, fill: "#a78bfa" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart size={15} className="text-pink-400" />
              Taxa de Engajamento
            </CardTitle>
            <CardDescription>Engajamento médio diário (%)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center" style={{ height: 220 }}>
                <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 10]} />
                  <Tooltip content={<DarkTooltip valueFormatter={(v) => `${v}%`} />} />
                  <Line type="monotone" dataKey="engagementRate" name="Engajamento" stroke="#f472b6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#f472b6" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Gráficos de barra ────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={15} className="text-emerald-400" />
              Crescimento de Seguidores
            </CardTitle>
            <CardDescription>Total acumulado de seguidores no período</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center" style={{ height: 220 }}>
                <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} domain={["auto", "auto"]} />
                  <Tooltip content={<DarkTooltip valueFormatter={(v) => Number(v).toLocaleString("pt-BR")} />} />
                  <Bar dataKey="followers" name="Seguidores" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={15} className="text-amber-400" />
              Engajamento por Tipo de Conteúdo
            </CardTitle>
            <CardDescription>Taxa média (%) por formato e rede</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center" style={{ height: 220 }}>
                <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={engByType} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%" barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="type" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<DarkTooltip valueFormatter={(v) => `${v}%`} />} />
                  <Legend wrapperStyle={{ fontSize: "10px", color: "#71717a", paddingTop: "8px" }} />
                  <Bar dataKey="instagram" name="Instagram" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="facebook"  name="Facebook"  fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="twitter"   name="Twitter"   fill="#06b6d4" radius={[3, 3, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Posts ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Posts do Período</CardTitle>
              <CardDescription>
                Posts com melhor performance
                {source === "instagram" ? " — dados via Instagram Graph API" : ""}
                {source === "metricool" ? " — dados via Metricool" : ""}
                {source === "mock"      ? " — dados de demonstração" : ""}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              {filteredPosts.length} posts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["#", "Conteúdo", "Rede", "Tipo", "Impressões", "Alcance", "Eng.", "Likes", "Comentários", "Salvos"].map((h) => (
                      <th key={h} className="pb-2.5 pr-4 text-left text-xs font-medium text-[var(--muted-foreground)] first:pr-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post, i) => (
                    <tr
                      key={post.id}
                      className="border-b border-[var(--border)]/40 transition-colors hover:bg-[var(--secondary)]/40 last:border-0"
                    >
                      <td className="py-3 pr-2 text-xs font-bold text-[var(--muted-foreground)]">{i + 1}</td>
                      <td className="max-w-[220px] py-3 pr-4">
                        <p className="truncate text-sm text-[var(--foreground)]">{post.caption}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`h-2 w-2 rounded-full ${NETWORK_COLORS[post.network]?.dot ?? "bg-gray-400"}`} />
                          <span className={NETWORK_COLORS[post.network]?.text ?? "text-[var(--muted-foreground)]"}>
                            {post.network}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={post.type === "Reels" ? "default" : "secondary"} className="gap-1">
                          {post.type === "Reels" ? <Video size={10} /> : <ImageIcon size={10} />}
                          {post.type}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs text-[var(--foreground)]">
                        {post.impressions >= 1000
                          ? `${(post.impressions / 1000).toFixed(1)}K`
                          : post.impressions}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[var(--foreground)]">
                        {post.reach >= 1000
                          ? `${(post.reach / 1000).toFixed(1)}K`
                          : post.reach}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs font-semibold text-emerald-400">{post.engagement}%</span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-[var(--muted-foreground)]">
                        {post.likes.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[var(--muted-foreground)]">{post.comments}</td>
                      <td className="py-3 text-xs text-[var(--muted-foreground)]">{post.saves}</td>
                    </tr>
                  ))}
                  {filteredPosts.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                        Nenhum post encontrado para a rede selecionada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
