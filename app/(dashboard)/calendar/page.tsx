"use client"

import * as React from "react"
import {
  AlertTriangle,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileEdit,
  FileText,
  Filter,
  Film,
  Image,
  Inbox,
  Layers,
  Loader2,
  Music,
  Plus,
  Play,
  AtSign,
  Briefcase,
  Camera,
  CircleDashed,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Tables } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Platform = "instagram" | "youtube" | "tiktok" | "twitter" | "linkedin"
type FilterPlatform = Platform

type CalendarStatus = "posted" | "scheduled" | "draft" | "other"

type CalendarPlatform = Platform | "other"

interface CalendarPost {
  id: string
  title: string
  platform: CalendarPlatform
  platformLabel: string
  type: string
  statusKey: CalendarStatus
  statusLabel: string
  calendarDate: Date
  day: number
  month: number
  year: number
  timeLabel: string
  sortValue: number
}

type PostRow = Tables<"posts">

type CalendarPostRow = Pick<
  PostRow,
  "id" | "title" | "caption" | "platform" | "type" | "status" | "scheduled_at" | "published_at" | "created_at"
>

type StatusConfig = {
  label: string
  Icon: React.ElementType
  cls: string
}

type PlatformConfig = {
  label: string
  color: string
  chipBg: string
  chipText: string
  Icon: React.ElementType
}

// ─── Configuração visual ─────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  instagram: {
    label: "Instagram",
    color: "border-pink-500/60 text-pink-400",
    chipBg: "bg-pink-500",
    chipText: "text-white",
    Icon: Camera,
  },
  youtube: {
    label: "YouTube",
    color: "border-red-500/60 text-red-400",
    chipBg: "bg-red-500",
    chipText: "text-white",
    Icon: Play,
  },
  tiktok: {
    label: "TikTok",
    color: "border-cyan-500/60 text-cyan-400",
    chipBg: "bg-cyan-500",
    chipText: "text-white",
    Icon: Music,
  },
  twitter: {
    label: "Twitter / X",
    color: "border-sky-500/60 text-sky-400",
    chipBg: "bg-sky-500",
    chipText: "text-white",
    Icon: AtSign,
  },
  linkedin: {
    label: "LinkedIn",
    color: "border-blue-600/60 text-blue-400",
    chipBg: "bg-blue-600",
    chipText: "text-white",
    Icon: Briefcase,
  },
}

const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  label: "Outro",
  color: "border-[var(--border)] text-[var(--muted-foreground)]",
  chipBg: "bg-[var(--muted)]",
  chipText: "text-[var(--foreground)]",
  Icon: Briefcase,
}

const STATUS_CONFIG: Record<CalendarStatus, StatusConfig> = {
  posted: { label: "Publicado", Icon: CheckCircle2, cls: "text-emerald-400" },
  scheduled: { label: "Agendado", Icon: CalendarClock, cls: "text-indigo-400" },
  draft: { label: "Rascunho", Icon: FileEdit, cls: "text-amber-400" },
  other: { label: "Outro", Icon: CircleDashed, cls: "text-[var(--muted-foreground)]" },
}

const TYPE_ICON: Record<string, React.ElementType> = {
  post: Image,
  reel: Film,
  reels: Film,
  story: Layers,
  video: Play,
  short: Music,
  thread: AtSign,
  article: Briefcase,
}

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const FILTER_PLATFORMS: Platform[] = ["instagram", "youtube", "tiktok", "twitter", "linkedin"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function humanizeLabel(value: string): string {
  const normalized = value.trim().replace(/[_-]+/g, " ")
  if (!normalized) return "Outro"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function normalizePlatform(platform: string): CalendarPlatform {
  const normalized = platform.toLowerCase().trim()
  return FILTER_PLATFORMS.includes(normalized as Platform)
    ? (normalized as Platform)
    : "other"
}

function getPlatformConfig(platform: CalendarPlatform): PlatformConfig {
  return platform === "other" ? DEFAULT_PLATFORM_CONFIG : PLATFORM_CONFIG[platform]
}

function normalizeStatus(status: string): CalendarStatus {
  const normalized = status.toLowerCase().trim()

  if (normalized === "posted" || normalized === "published") return "posted"
  if (normalized === "scheduled") return "scheduled"
  if (normalized === "draft") return "draft"

  return "other"
}

function getStatusLabel(status: string, statusKey: CalendarStatus): string {
  if (statusKey !== "other") {
    return STATUS_CONFIG[statusKey].label
  }

  return humanizeLabel(status)
}

function resolveCalendarDate(row: CalendarPostRow): Date | null {
  const statusKey = normalizeStatus(row.status)
  const sources =
    statusKey === "posted"
      ? [row.published_at, row.scheduled_at, row.created_at]
      : statusKey === "scheduled"
        ? [row.scheduled_at, row.published_at, row.created_at]
        : [row.created_at, row.scheduled_at, row.published_at]

  const source = sources.find((value): value is string => Boolean(value))
  if (!source) return null

  const date = new Date(source)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function formatMonthAbbrev(date: Date): string {
  return MONTHS[date.getMonth()].slice(0, 3)
}

function mapRowToCalendarPost(row: CalendarPostRow): CalendarPost | null {
  const calendarDate = resolveCalendarDate(row)
  if (!calendarDate) return null

  const platform = normalizePlatform(row.platform)
  const statusKey = normalizeStatus(row.status)
  const title = row.title.trim() || row.caption.trim() || "Conteúdo sem título"
  const type = row.type.trim().toLowerCase()

  return {
    id: row.id,
    title,
    platform,
    platformLabel: getPlatformConfig(platform).label,
    type,
    statusKey,
    statusLabel: getStatusLabel(row.status, statusKey),
    calendarDate,
    day: calendarDate.getDate(),
    month: calendarDate.getMonth(),
    year: calendarDate.getFullYear(),
    timeLabel: formatTime(calendarDate),
    sortValue: calendarDate.getTime(),
  }
}

function getTypeIcon(type: string): React.ElementType {
  return TYPE_ICON[type] ?? FileText
}

function monthTitle(month: number, year: number): string {
  return `${MONTHS[month]} ${year}`
}

// ─── Componentes de estado ────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={24} className="animate-spin text-[var(--muted-foreground)]" />
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-10">
      <Card className="max-w-xl border-red-500/30">
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--foreground)]">Falha ao carregar o calendário</p>
            <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
          </div>
          <Button onClick={onRetry}>Tentar novamente</Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const supabase = React.useMemo(() => createClient(), [])
  const today = React.useMemo(() => new Date(), [])
  const todayStart = React.useMemo(() => {
    const value = new Date(today)
    value.setHours(0, 0, 0, 0)
    return value.getTime()
  }, [today])

  const [posts, setPosts] = React.useState<CalendarPost[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [activePlatforms, setActivePlatforms] = React.useState<Set<FilterPlatform>>(
    new Set(FILTER_PLATFORMS)
  )
  const [viewYear, setViewYear] = React.useState(today.getFullYear())
  const [viewMonth, setViewMonth] = React.useState(today.getMonth())
  const [selectedDay, setSelectedDay] = React.useState<number | null>(today.getDate())

  const loadPosts = React.useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) throw new Error("Você precisa entrar para visualizar o calendário.")

      const { data, error } = await supabase
        .from("posts")
        .select("id, title, caption, platform, type, status, scheduled_at, published_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const nextPosts = (data ?? [])
        .map(mapRowToCalendarPost)
        .filter((item): item is CalendarPost => item !== null)

      setPosts(nextPosts)
    } catch (error) {
      setPosts([])
      setLoadError(error instanceof Error ? error.message : "Falha inesperada ao carregar posts.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  const filteredPosts = React.useMemo(() => {
    return posts.filter((item) => item.platform === "other" || activePlatforms.has(item.platform))
  }, [activePlatforms, posts])

  const monthPosts = React.useMemo(() => {
    return filteredPosts.filter((item) => item.year === viewYear && item.month === viewMonth)
  }, [filteredPosts, viewMonth, viewYear])

  const postsByDay = React.useMemo(() => {
    const map: Record<number, CalendarPost[]> = {}

    monthPosts.forEach((item) => {
      if (!map[item.day]) map[item.day] = []
      map[item.day].push(item)
    })

    return map
  }, [monthPosts])

  const selectedItems = selectedDay ? (postsByDay[selectedDay] ?? []) : []

  const upcomingItems = React.useMemo(() => {
    return [...filteredPosts]
      .filter((item) => item.statusKey !== "posted")
      .sort((a, b) => a.sortValue - b.sortValue || a.title.localeCompare(b.title))
      .slice(0, 6)
  }, [filteredPosts])

  const totalPosted = React.useMemo(
    () => posts.filter((item) => item.statusKey === "posted").length,
    [posts]
  )
  const totalScheduled = React.useMemo(
    () => posts.filter((item) => item.statusKey === "scheduled").length,
    [posts]
  )
  const totalDraft = React.useMemo(
    () => posts.filter((item) => item.statusKey === "draft").length,
    [posts]
  )

  const cells = React.useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const nextCells: (number | null)[] = Array.from(
      { length: firstDayIndex + daysInMonth },
      (_, index) => (index < firstDayIndex ? null : index - firstDayIndex + 1)
    )

    while (nextCells.length % 7 !== 0) nextCells.push(null)

    return nextCells
  }, [viewMonth, viewYear])

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((year) => year - 1)
      setViewMonth(11)
    } else {
      setViewMonth((month) => month - 1)
    }

    setSelectedDay(null)
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((year) => year + 1)
      setViewMonth(0)
    } else {
      setViewMonth((month) => month + 1)
    }

    setSelectedDay(null)
  }

  const togglePlatform = React.useCallback((platform: FilterPlatform) => {
    setActivePlatforms((current) => {
      const next = new Set(current)

      if (next.has(platform)) {
        if (next.size === 1) return current
        next.delete(platform)
      } else {
        next.add(platform)
      }

      return next
    })
  }, [])

  if (loading) {
    return <LoadingState />
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={() => void loadPosts()} />
  }

  const hasAnyPosts = posts.length > 0
  const monthDescription = monthPosts.length > 0
    ? "Clique num dia para ver o detalhe"
    : "Nenhum item neste mês com os filtros atuais"

  return (
    <div className="space-y-5">
      {!hasAnyPosts && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--secondary)]">
              <CalendarX size={18} className="text-[var(--muted-foreground)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)]">Nenhum post encontrado</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                O calendário será preenchido assim que houver posts salvos no Supabase.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        {[
          { label: "Publicados", value: totalPosted, Icon: CheckCircle2, cls: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Agendados", value: totalScheduled, Icon: CalendarClock, cls: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Rascunhos", value: totalDraft, Icon: FileEdit, cls: "text-amber-400", bg: "bg-amber-500/10" },
        ].map(({ label, value, Icon, cls, bg }) => (
          <Card key={label} className="flex items-center gap-3 p-4">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", bg)}>
              <Icon size={16} className={cls} />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--foreground)]">{value}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Filtros de plataforma ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Filter size={12} />
          Plataformas:
        </span>
        {FILTER_PLATFORMS.map((platform) => {
          const cfg = PLATFORM_CONFIG[platform]
          const active = activePlatforms.has(platform)

          return (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                active
                  ? cn(cfg.color, "bg-[var(--secondary)]")
                  : "border-[var(--border)] text-[var(--muted-foreground)] opacity-40 hover:opacity-60"
              )}
            >
              <cfg.Icon size={11} />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* ── Calendário + Painel lateral ─────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Calendário principal */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>{monthTitle(viewMonth, viewYear)}</CardTitle>
              <CardDescription>{isCurrentMonth ? "Mês atual — " : ""}{monthDescription}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight size={14} />
              </Button>
              <Button size="sm" className="ml-2 gap-1">
                <Plus size={13} />
                Novo
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-1 grid grid-cols-7">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-lg bg-[var(--border)]">
              <div className="grid grid-cols-7 gap-px">
                {cells.map((day, index) => {
                  const dayItems = day ? (postsByDay[day] ?? []) : []
                  const cellDate = day ? new Date(viewYear, viewMonth, day) : null
                  const isToday = isCurrentMonth && day === today.getDate()
                  const isPast = cellDate ? cellDate.getTime() < todayStart : false
                  const isSelected = day === selectedDay
                  const overflow = dayItems.length > 3

                  return (
                    <button
                      key={`${viewYear}-${viewMonth}-${index}`}
                      type="button"
                      onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                      className={cn(
                        "min-h-[72px] bg-[var(--card)] p-1.5 text-left transition-colors",
                        day ? "cursor-pointer" : "pointer-events-none opacity-0",
                        day && !isSelected && "hover:bg-[var(--secondary)]",
                        isSelected && "bg-[var(--primary)]/10 ring-1 ring-inset ring-[var(--primary)]",
                        isToday && !isSelected && "bg-[var(--primary)]/5 ring-1 ring-inset ring-[var(--primary)]/50"
                      )}
                    >
                      {day && (
                        <>
                          <p
                            className={cn(
                              "mb-1 text-right text-[11px] font-semibold leading-none",
                              isToday
                                ? "text-[var(--primary)]"
                                : isPast
                                  ? "text-[var(--muted-foreground)]"
                                  : "text-[var(--foreground)]"
                            )}
                          >
                            {isToday ? (
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[9px] text-white">
                                {day}
                              </span>
                            ) : (
                              day
                            )}
                          </p>

                          <div className="space-y-0.5">
                            {dayItems.slice(0, 3).map((item) => {
                              const cfg = getPlatformConfig(item.platform)

                              return (
                                <div
                                  key={item.id}
                                  className={cn(
                                    "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[9px] font-medium",
                                    cfg.chipBg,
                                    cfg.chipText,
                                    item.statusKey === "draft" && "opacity-60 ring-1 ring-white/30 ring-inset"
                                  )}
                                  title={`${cfg.label} · ${item.type} · ${item.title}`}
                                >
                                  <cfg.Icon size={8} className="shrink-0" />
                                  <span className="truncate">{item.title}</span>
                                </div>
                              )
                            })}
                            {overflow && (
                              <p className="px-1 text-[9px] text-[var(--muted-foreground)]">
                                +{dayItems.length - 3} mais
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {FILTER_PLATFORMS.filter((platform) => activePlatforms.has(platform)).map((platform) => {
                const cfg = PLATFORM_CONFIG[platform]

                return (
                  <span key={platform} className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                    <span className={cn("h-2 w-2 rounded-sm", cfg.chipBg)} />
                    {cfg.label}
                  </span>
                )
              })}
              <span className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                <span className="h-2 w-2 rounded-sm bg-white/20 ring-1 ring-white/30" />
                Rascunho
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Painel lateral */}
        <div className="space-y-4">
          {selectedDay !== null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {selectedDay} de {MONTHS[viewMonth]}
                </CardTitle>
                <CardDescription>
                  {selectedItems.length === 0
                    ? "Nenhum conteúdo neste dia"
                    : `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}`}
                </CardDescription>
              </CardHeader>
              {selectedItems.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {selectedItems.map((item) => {
                      const platformCfg = getPlatformConfig(item.platform)
                      const statusCfg = STATUS_CONFIG[item.statusKey]
                      const TypeIcon = getTypeIcon(item.type)

                      return (
                        <div key={item.id} className="flex items-start gap-2.5 rounded-lg bg-[var(--secondary)] p-2.5">
                          <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md", platformCfg.chipBg)}>
                            <TypeIcon size={13} className="text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-[var(--foreground)]">{item.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", platformCfg.color.split(" ")[1])}>
                                <platformCfg.Icon size={9} />
                                {platformCfg.label}
                              </span>
                              <span className="text-[10px] text-[var(--muted-foreground)]">·</span>
                              <span className={cn("flex items-center gap-0.5 text-[10px]", statusCfg.cls)}>
                                <statusCfg.Icon size={9} />
                                {item.statusLabel}
                              </span>
                              <span className="text-[10px] text-[var(--muted-foreground)]">·</span>
                              <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                                <Clock size={9} />
                                {item.timeLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Próximos Conteúdos</CardTitle>
              <CardDescription>Agendados e rascunhos</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingItems.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-4">
                  <Inbox size={16} className="shrink-0 text-[var(--muted-foreground)]" />
                  <p className="text-xs text-[var(--muted-foreground)]">Nenhum conteúdo agendado nos filtros atuais.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingItems.map((item, index) => {
                    const platformCfg = getPlatformConfig(item.platform)
                    const statusCfg = STATUS_CONFIG[item.statusKey]

                    return (
                      <div key={item.id} className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", platformCfg.chipBg)}>
                            <platformCfg.Icon size={13} className="text-white" />
                          </div>
                          {index < upcomingItems.length - 1 && (
                            <div className="mt-0.5 w-px flex-1 bg-[var(--border)]" style={{ minHeight: 10 }} />
                          )}
                        </div>

                        <div className="min-w-0 pb-2">
                          <p className="truncate text-xs font-medium text-[var(--foreground)]">{item.title}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className={cn("flex items-center gap-0.5 text-[10px]", statusCfg.cls)}>
                              <statusCfg.Icon size={9} />
                              {item.statusLabel}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                              <Clock size={9} />
                              {item.day} {formatMonthAbbrev(item.calendarDate)} · {item.timeLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
