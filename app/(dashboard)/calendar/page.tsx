"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image,
  Film,
  Layers,
  Play,
  Camera,
  AtSign,
  Briefcase,
  Music,
  Filter,
  CheckCircle2,
  CalendarClock,
  FileEdit,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "instagram" | "youtube" | "tiktok" | "twitter" | "linkedin"
type ContentType = "Post" | "Reels" | "Story" | "Video" | "Short" | "Thread" | "Article"
type Status = "posted" | "scheduled" | "draft"

interface ContentItem {
  id: number
  day: number
  platform: Platform
  type: ContentType
  title: string
  time: string
  status: Status
}

// ─── Configuração de plataformas ──────────────────────────────────────────────

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; color: string; chipBg: string; chipText: string; Icon: React.ElementType }
> = {
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

const STATUS_CONFIG: Record<Status, { label: string; Icon: React.ElementType; cls: string }> = {
  posted: { label: "Publicado", Icon: CheckCircle2, cls: "text-emerald-400" },
  scheduled: { label: "Agendado", Icon: CalendarClock, cls: "text-indigo-400" },
  draft: { label: "Rascunho", Icon: FileEdit, cls: "text-amber-400" },
}

const TYPE_ICON: Record<ContentType, React.ElementType> = {
  Post: Image,
  Reels: Film,
  Story: Layers,
  Video: Play,
  Short: Music,
  Thread: AtSign,
  Article: Briefcase,
}

// ─── Dados mockados — Março 2026 ──────────────────────────────────────────────

const CONTENT_ITEMS: ContentItem[] = [
  // Semana 1
  { id: 1,  day: 2,  platform: "instagram", type: "Post",    title: "Coleção de Verão 🌊",         time: "09:00", status: "posted" },
  { id: 2,  day: 2,  platform: "linkedin",  type: "Article", title: "Tendências de moda 2026",     time: "10:30", status: "posted" },
  { id: 3,  day: 3,  platform: "youtube",   type: "Video",   title: "Lookbook Verão — Episódio 1", time: "17:00", status: "posted" },
  { id: 4,  day: 4,  platform: "instagram", type: "Story",   title: "Bastidores da produção",      time: "12:00", status: "posted" },
  { id: 5,  day: 4,  platform: "tiktok",    type: "Short",   title: "GRWM Verão ✨",               time: "19:00", status: "posted" },
  { id: 6,  day: 5,  platform: "instagram", type: "Reels",   title: "3 looks para a praia 🏄",     time: "18:00", status: "posted" },
  { id: 7,  day: 5,  platform: "twitter",   type: "Thread",  title: "Thread: guia de cores",       time: "11:00", status: "posted" },
  // Semana 2
  { id: 8,  day: 8,  platform: "instagram", type: "Post",    title: "Produto em destaque",         time: "09:00", status: "posted" },
  { id: 9,  day: 9,  platform: "tiktok",    type: "Short",   title: "Transição de looks 🎬",       time: "20:00", status: "posted" },
  { id: 10, day: 10, platform: "youtube",   type: "Video",   title: "Haul de compras — Março",     time: "16:00", status: "posted" },
  { id: 11, day: 10, platform: "instagram", type: "Story",   title: "Enquete: look A ou B?",       time: "13:00", status: "posted" },
  { id: 12, day: 11, platform: "linkedin",  type: "Article", title: "Sustentabilidade na moda",    time: "09:30", status: "posted" },
  { id: 13, day: 12, platform: "instagram", type: "Reels",   title: "Tutorial de acessórios",      time: "17:30", status: "posted" },
  { id: 14, day: 12, platform: "twitter",   type: "Thread",  title: "Os melhores looks da semana", time: "12:00", status: "posted" },
  { id: 15, day: 13, platform: "tiktok",    type: "Short",   title: "Duet com @influencer",        time: "21:00", status: "posted" },
  // Semana 3
  { id: 16, day: 15, platform: "instagram", type: "Post",    title: "Mid-month promo 🛍️",          time: "10:00", status: "posted" },
  { id: 17, day: 15, platform: "instagram", type: "Reels",   title: "Behind the scenes",           time: "18:00", status: "posted" },
  { id: 18, day: 16, platform: "youtube",   type: "Video",   title: "Q&A mensal com assinantes",   time: "17:00", status: "posted" },
  { id: 19, day: 17, platform: "instagram", type: "Story",   title: "Nova coleção — teaser",       time: "09:00", status: "posted" },
  { id: 20, day: 17, platform: "tiktok",    type: "Short",   title: "POV: dia de shooting",        time: "22:00", status: "posted" },
  { id: 21, day: 18, platform: "twitter",   type: "Thread",  title: "Relançamento da linha SS26",  time: "10:00", status: "posted" },
  { id: 22, day: 19, platform: "linkedin",  type: "Article", title: "Relatório de impacto Q1",     time: "09:00", status: "posted" },
  { id: 23, day: 20, platform: "instagram", type: "Post",    title: "Lookbook outono otoño 🍂",    time: "09:00", status: "posted" },
  { id: 24, day: 20, platform: "youtube",   type: "Video",   title: "Lookbook Verão — Episódio 2", time: "17:00", status: "posted" },
  // Semana 4 — hoje e futuro (23 = hoje)
  { id: 25, day: 22, platform: "instagram", type: "Reels",   title: "GRWM – festa de Páscoa",      time: "19:00", status: "posted" },
  { id: 26, day: 23, platform: "instagram", type: "Post",    title: "Coleção especial Páscoa 🐣",  time: "10:00", status: "scheduled" },
  { id: 27, day: 23, platform: "tiktok",    type: "Short",   title: "Unboxing nova coleção",       time: "15:00", status: "draft" },
  { id: 28, day: 24, platform: "youtube",   type: "Video",   title: "Vlog de Easter shopping",     time: "17:00", status: "scheduled" },
  { id: 29, day: 24, platform: "instagram", type: "Story",   title: "Countdown promoção",          time: "18:00", status: "scheduled" },
  { id: 30, day: 25, platform: "instagram", type: "Reels",   title: "Tutorial maquiagem festa",    time: "18:00", status: "scheduled" },
  { id: 31, day: 25, platform: "twitter",   type: "Thread",  title: "Top 5 looks da coleção",      time: "11:00", status: "draft" },
  { id: 32, day: 26, platform: "linkedin",  type: "Article", title: "Colaboração com artistas",    time: "09:00", status: "scheduled" },
  { id: 33, day: 27, platform: "tiktok",    type: "Short",   title: "Day in my life — Sabrina",    time: "20:00", status: "scheduled" },
  { id: 34, day: 28, platform: "instagram", type: "Post",    title: "Encerramento do mês 🎉",      time: "09:00", status: "scheduled" },
  { id: 35, day: 28, platform: "youtube",   type: "Video",   title: "Best of Março 2026",          time: "17:00", status: "draft" },
  { id: 36, day: 30, platform: "instagram", type: "Story",   title: "Preview de Abril",            time: "20:00", status: "scheduled" },
  { id: 37, day: 31, platform: "linkedin",  type: "Article", title: "Balanço mensal da marca",     time: "08:00", status: "scheduled" },
  { id: 38, day: 31, platform: "tiktok",    type: "Short",   title: "Teaser Coleção de Inverno ❄️", time: "21:00", status: "scheduled" },
]

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

// Mês onde os dados mockados vivem (Março 2026)
const CONTENT_MONTH = 2
const CONTENT_YEAR  = 2026

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  // Data real de hoje
  const realToday  = new Date()
  const realDay    = realToday.getDate()
  const realMonth  = realToday.getMonth()
  const realYear   = realToday.getFullYear()

  const [activePlatforms, setActivePlatforms] = React.useState<Set<Platform>>(
    new Set(["instagram", "youtube", "tiktok", "twitter", "linkedin"] as Platform[])
  )

  // Mês/ano sendo visualizado no calendário
  const [viewYear,  setViewYear]  = React.useState(realYear)
  const [viewMonth, setViewMonth] = React.useState(realMonth)
  const [selectedDay, setSelectedDay] = React.useState<number | null>(
    realMonth === CONTENT_MONTH && realYear === CONTENT_YEAR ? realDay : null
  )

  // Derivadas do mês visualizado
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate()
  const isCurrentMonth = viewYear === realYear && viewMonth === realMonth
  const isContentMonth = viewYear === CONTENT_YEAR && viewMonth === CONTENT_MONTH

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  // Filtro de plataforma
  const togglePlatform = (p: Platform) => {
    setActivePlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) {
        if (next.size === 1) return prev // mantém ao menos uma plataforma ativa
        next.delete(p)
      } else {
        next.add(p)
      }
      return next
    })
  }

  // Itens filtrados por plataforma ativa (só exibe se estiver visualizando o mês de conteúdo)
  const filteredItems = React.useMemo(
    () =>
      isContentMonth
        ? CONTENT_ITEMS.filter((item) => activePlatforms.has(item.platform))
        : [],
    [activePlatforms, isContentMonth]
  )

  // Agrupa itens por dia
  const itemsByDay = React.useMemo(() => {
    const map: Record<number, ContentItem[]> = {}
    filteredItems.forEach((item) => {
      if (!map[item.day]) map[item.day] = []
      map[item.day].push(item)
    })
    return map
  }, [filteredItems])

  // Células do calendário — usa variáveis dinâmicas
  const cells: (number | null)[] = Array.from(
    { length: firstDayIndex + daysInMonth },
    (_, i) => (i < firstDayIndex ? null : i - firstDayIndex + 1)
  )
  while (cells.length % 7 !== 0) cells.push(null)

  // Itens do dia selecionado
  const selectedItems = selectedDay ? (itemsByDay[selectedDay] ?? []) : []

  // Próximos itens agendados — só no mês de conteúdo
  const contentTodayRef = isContentMonth ? realDay : 0
  const upcomingItems = filteredItems
    .filter((i) => i.day >= contentTodayRef && i.status !== "posted")
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
    .slice(0, 6)

  // Estatísticas rápidas
  const totalPosted   = CONTENT_ITEMS.filter((i) => i.status === "posted").length
  const totalScheduled = CONTENT_ITEMS.filter((i) => i.status === "scheduled").length
  const totalDraft    = CONTENT_ITEMS.filter((i) => i.status === "draft").length

  return (
    <div className="space-y-5">

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        {[
          { label: "Publicados",  value: totalPosted,    Icon: CheckCircle2, cls: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Agendados",   value: totalScheduled, Icon: CalendarClock, cls: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Rascunhos",   value: totalDraft,     Icon: FileEdit,      cls: "text-amber-400",  bg: "bg-amber-500/10"  },
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

      {/* ── Filtros de plataforma ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Filter size={12} />
          Plataformas:
        </span>
        {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((p) => {
          const cfg = PLATFORM_CONFIG[p]
          const active = activePlatforms.has(p)
          return (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
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
              <CardTitle>{MONTHS[viewMonth]} {viewYear}</CardTitle>
              <CardDescription>
                {isCurrentMonth ? "Mês atual — " : ""}Clique num dia para ver o detalhe
              </CardDescription>
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
            {/* Cabeçalho da semana */}
            <div className="mb-1 grid grid-cols-7">
              {DAYS_OF_WEEK.map((d) => (
                <div
                  key={d}
                  className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-px bg-[var(--border)] rounded-lg overflow-hidden">
              {cells.map((day, idx) => {
                const dayItems = day ? (itemsByDay[day] ?? []) : []
                const isToday   = isCurrentMonth && day === realDay
                const isPast    = day !== null && (
                  viewYear < realYear ||
                  (viewYear === realYear && viewMonth < realMonth) ||
                  (isCurrentMonth && day < realDay)
                )
                const isSelected = day === selectedDay
                const overflow  = dayItems.length > 3

                return (
                  <div
                    key={idx}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    className={cn(
                      "min-h-[72px] bg-[var(--card)] p-1.5 transition-colors",
                      day ? "cursor-pointer" : "opacity-0 pointer-events-none",
                      day && !isSelected && "hover:bg-[var(--secondary)]",
                      isSelected && "bg-[var(--primary)]/10 ring-1 ring-inset ring-[var(--primary)]",
                      isToday && !isSelected && "bg-[var(--primary)]/5 ring-1 ring-inset ring-[var(--primary)]/50"
                    )}
                  >
                    {day && (
                      <>
                        {/* Número do dia */}
                        <p
                          className={cn(
                            "mb-1 text-right text-[11px] font-semibold leading-none",
                            isToday     ? "text-[var(--primary)]"          :
                            isPast      ? "text-[var(--muted-foreground)]" :
                            "text-[var(--foreground)]"
                          )}
                        >
                          {isToday ? (
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[9px] text-white">
                              {day}
                            </span>
                          ) : day}
                        </p>

                        {/* Chips */}
                        <div className="space-y-0.5">
                          {dayItems.slice(0, 3).map((item) => {
                            const cfg = PLATFORM_CONFIG[item.platform]
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[9px] font-medium",
                                  cfg.chipBg,
                                  cfg.chipText,
                                  item.status === "draft" && "opacity-60 ring-1 ring-white/30 ring-inset"
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
                  </div>
                )
              })}
            </div>

            {/* Legenda de plataformas */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {(Object.keys(PLATFORM_CONFIG) as Platform[])
                .filter((p) => activePlatforms.has(p))
                .map((p) => {
                  const cfg = PLATFORM_CONFIG[p]
                  return (
                    <span key={p} className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
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

          {/* Detalhe do dia selecionado */}
          {selectedDay && (
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
                      const pCfg   = PLATFORM_CONFIG[item.platform]
                      const sCfg   = STATUS_CONFIG[item.status]
                      const TypeIcon = TYPE_ICON[item.type]
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-2.5 rounded-lg bg-[var(--secondary)] p-2.5"
                        >
                          <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md", pCfg.chipBg)}>
                            <TypeIcon size={13} className="text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-[var(--foreground)]">
                              {item.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", pCfg.color.split(" ")[1])}>
                                <pCfg.Icon size={9} />
                                {pCfg.label}
                              </span>
                              <span className="text-[10px] text-[var(--muted-foreground)]">·</span>
                              <span className={cn("flex items-center gap-0.5 text-[10px]", sCfg.cls)}>
                                <sCfg.Icon size={9} />
                                {sCfg.label}
                              </span>
                              <span className="text-[10px] text-[var(--muted-foreground)]">·</span>
                              <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                                <Clock size={9} />
                                {item.time}
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

          {/* Próximos conteúdos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Próximos Conteúdos</CardTitle>
              <CardDescription>Agendados e rascunhos</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingItems.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">Nenhum conteúdo agendado.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingItems.map((item, i) => {
                    const pCfg = PLATFORM_CONFIG[item.platform]
                    const sCfg = STATUS_CONFIG[item.status]
                    return (
                      <div key={item.id} className="flex gap-2.5">
                        {/* timeline */}
                        <div className="flex flex-col items-center">
                          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", pCfg.chipBg)}>
                            <pCfg.Icon size={13} className="text-white" />
                          </div>
                          {i < upcomingItems.length - 1 && (
                            <div className="mt-0.5 w-px flex-1 bg-[var(--border)]" style={{ minHeight: 10 }} />
                          )}
                        </div>
                        <div className="pb-2 min-w-0">
                          <p className="truncate text-xs font-medium text-[var(--foreground)]">{item.title}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className={cn("flex items-center gap-0.5 text-[10px]", sCfg.cls)}>
                              <sCfg.Icon size={9} />
                              {sCfg.label}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                              <Clock size={9} />
                              {item.day} Mar · {item.time}
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
