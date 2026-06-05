"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Settings2,
  Camera,
  Swords,
  Zap,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifCategory = "all" | "instagram" | "competitors" | "system"
type NotifType = "like" | "comment" | "follow" | "mention" | "competitor" | "alert" | "success"

interface Notification {
  id: string
  type: NotifType
  category: Exclude<NotifCategory, "all">
  title: string
  body: string
  time: string
  read: boolean
  avatar?: string
}

type NotificationPrefs = {
  newFollowers: boolean
  comments: boolean
  mentions: boolean
  competitorPost: boolean
  competitorGrow: boolean
  systemSync: boolean
  weeklyReport: boolean
  emailDigest: boolean
}

interface NotificationApiRow {
  id: string
  type: NotifType
  category: Exclude<NotifCategory, "all">
  title: string
  body: string
  time_label?: string | null
  read_at?: string | null
  dismissed_at?: string | null
  created_at?: string | null
}

interface ApiErrorPayload {
  error?: string
  code?: string
}

interface NotificationsHealthPayload {
  ok?: boolean
  status?: "ready" | "missing_table" | "unauthenticated" | "error"
  message?: string
  code?: string
}

interface NotificationsHealthState {
  status: "ready" | "missing_table" | "unauthenticated" | "error"
  message: string
  code?: string
}

interface SyncIssue {
  message: string
  code?: string
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  newFollowers: true,
  comments: true,
  mentions: true,
  competitorPost: true,
  competitorGrow: false,
  systemSync: true,
  weeklyReport: true,
  emailDigest: false,
}

function normalizePrefs(input: unknown): NotificationPrefs {
  if (!input || typeof input !== "object") return DEFAULT_NOTIFICATION_PREFS
  const source = input as Record<string, unknown>
  return {
    newFollowers: typeof source.newFollowers === "boolean"
      ? source.newFollowers
      : DEFAULT_NOTIFICATION_PREFS.newFollowers,
    comments: typeof source.comments === "boolean"
      ? source.comments
      : DEFAULT_NOTIFICATION_PREFS.comments,
    mentions: typeof source.mentions === "boolean"
      ? source.mentions
      : DEFAULT_NOTIFICATION_PREFS.mentions,
    competitorPost: typeof source.competitorPost === "boolean"
      ? source.competitorPost
      : DEFAULT_NOTIFICATION_PREFS.competitorPost,
    competitorGrow: typeof source.competitorGrow === "boolean"
      ? source.competitorGrow
      : DEFAULT_NOTIFICATION_PREFS.competitorGrow,
    systemSync: typeof source.systemSync === "boolean"
      ? source.systemSync
      : DEFAULT_NOTIFICATION_PREFS.systemSync,
    weeklyReport: typeof source.weeklyReport === "boolean"
      ? source.weeklyReport
      : DEFAULT_NOTIFICATION_PREFS.weeklyReport,
    emailDigest: typeof source.emailDigest === "boolean"
      ? source.emailDigest
      : DEFAULT_NOTIFICATION_PREFS.emailDigest,
  }
}

function isGrowthNotification(notification: Notification): boolean {
  const text = `${notification.title} ${notification.body}`.toLowerCase()
  return (
    text.includes("cresceu") ||
    text.includes("crescimento") ||
    text.includes("queda") ||
    text.includes("perdeu")
  )
}

function isReportNotification(notification: Notification): boolean {
  const text = `${notification.title} ${notification.body}`.toLowerCase()
  return text.includes("relatório")
}

function isNotificationEnabled(notification: Notification, prefs: NotificationPrefs): boolean {
  switch (notification.type) {
    case "follow":
      return prefs.newFollowers
    case "comment":
    case "like":
      return prefs.comments
    case "mention":
      return prefs.mentions
    case "competitor":
      return isGrowthNotification(notification) ? prefs.competitorGrow : prefs.competitorPost
    case "alert":
      if (notification.category === "competitors") return prefs.competitorGrow
      return prefs.systemSync
    case "success":
      return isReportNotification(notification) ? prefs.weeklyReport : prefs.systemSync
    default:
      return true
  }
}

function formatRelativeTime(createdAt: string | null | undefined): string {
  if (!createdAt) return "—"
  const diffMs = Date.now() - new Date(createdAt).getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return "agora"
  const diffMinutes = Math.floor(diffMs / 60_000)
  if (diffMinutes < 1) return "agora"
  if (diffMinutes < 60) return `${diffMinutes}min`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}

function mapApiRowToNotification(row: NotificationApiRow): Notification {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    title: row.title,
    body: row.body,
    time: row.time_label?.trim() || formatRelativeTime(row.created_at),
    read: Boolean(row.read_at),
  }
}

function parseNotificationsResponse(payload: unknown): NotificationApiRow[] {
  const isActiveRow = (item: unknown): item is NotificationApiRow =>
    Boolean(
      item &&
      typeof item === "object" &&
      "id" in item &&
      !(item as { dismissed_at?: string | null }).dismissed_at
    )

  if (Array.isArray(payload)) {
    return payload.filter(isActiveRow)
  }
  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>
    if (Array.isArray(source.notifications)) {
      return source.notifications.filter(isActiveRow)
    }
    if (Array.isArray(source.data)) {
      return source.data.filter(isActiveRow)
    }
  }
  return []
}

async function readApiError(response: Response, fallback: string): Promise<SyncIssue> {
  try {
    const payload = (await response.json()) as ApiErrorPayload
    return {
      message: payload.error?.trim() || fallback,
      code: payload.code,
    }
  } catch {
    return { message: fallback }
  }
}

async function readHealthIssue(response: Response, fallback: string): Promise<NotificationsHealthState> {
  try {
    const payload = (await response.json()) as NotificationsHealthPayload
    return {
      status: payload.status ?? "error",
      message: payload.message?.trim() || fallback,
      code: payload.code,
    }
  } catch {
    return { status: "error", message: fallback }
  }
}

// ─── Dados ────────────────────────────────────────────────────────────────────

const INITIAL_NOTIFS: Notification[] = [
  {
    id: "notif-1",
    type: "follow",
    category: "instagram",
    title: "Novo seguidor",
    body: "@arquitetura.sp começou a seguir você — 142K seguidores",
    time: "2min",
    read: false,
  },
  {
    id: "notif-2",
    type: "comment",
    category: "instagram",
    title: "Novo comentário",
    body: "@joao_design: \"Esse projeto ficou incrível! Qual software você usou?\"",
    time: "15min",
    read: false,
  },
  {
    id: "notif-3",
    type: "like",
    category: "instagram",
    title: "Post em alta 🔥",
    body: "\"BIM ganha adoção global\" recebeu 847 curtidas nas últimas 2 horas",
    time: "32min",
    read: false,
  },
  {
    id: "notif-4",
    type: "competitor",
    category: "competitors",
    title: "Concorrente publicou",
    body: "@dezeen publicou 3 posts hoje — acima da média semanal deles",
    time: "1h",
    read: false,
  },
  {
    id: "notif-5",
    type: "mention",
    category: "instagram",
    title: "Você foi marcado",
    body: "@studiomarcio marcou você em um post sobre tendências de fachadas 2026",
    time: "2h",
    read: true,
  },
  {
    id: "notif-6",
    type: "alert",
    category: "competitors",
    title: "Alerta de concorrente",
    body: "@archdaily.br cresceu 2.4K seguidores hoje — verifique a estratégia deles",
    time: "3h",
    read: true,
  },
  {
    id: "notif-7",
    type: "success",
    category: "system",
    title: "Feed sincronizado",
    body: "AI Dev Radar atualizou com novos artigos de OpenAI, GitHub e Hugging Face",
    time: "4h",
    read: true,
  },
  {
    id: "notif-8",
    type: "follow",
    category: "instagram",
    title: "Marco atingido 🎉",
    body: "Você ultrapassou 48.000 seguidores! +1.200 novos este mês",
    time: "6h",
    read: true,
  },
  {
    id: "notif-9",
    type: "alert",
    category: "system",
    title: "Agendamento próximo",
    body: "\"Coleção especial Páscoa 🐣\" está agendado para hoje às 10:00",
    time: "8h",
    read: true,
  },
  {
    id: "notif-10",
    type: "competitor",
    category: "competitors",
    title: "Queda de engajamento detectada",
    body: "@archinect teve queda de 18% no engajamento essa semana — oportunidade para você",
    time: "1d",
    read: true,
  },
  {
    id: "notif-11",
    type: "comment",
    category: "instagram",
    title: "Novo comentário",
    body: "@ana_arquitetura: \"Adorei o conteúdo sobre Revit 2026! Pode fazer mais?\"",
    time: "1d",
    read: true,
  },
  {
    id: "notif-12",
    type: "success",
    category: "system",
    title: "Relatório mensal gerado",
    body: "Analytics de Fevereiro 2026 disponível — engajamento médio de 4.8%",
    time: "2d",
    read: true,
  },
]

// ─── Configurações de tipo ─────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotifType,
  { Icon: React.ElementType; bg: string; color: string }
> = {
  like:       { Icon: Heart,         bg: "bg-pink-500/10",    color: "text-pink-400"    },
  comment:    { Icon: MessageCircle, bg: "bg-blue-500/10",    color: "text-blue-400"    },
  follow:     { Icon: UserPlus,      bg: "bg-emerald-500/10", color: "text-emerald-400" },
  mention:    { Icon: Camera,        bg: "bg-indigo-500/10",  color: "text-indigo-400"  },
  competitor: { Icon: Swords,        bg: "bg-amber-500/10",   color: "text-amber-400"   },
  alert:      { Icon: AlertTriangle, bg: "bg-orange-500/10",  color: "text-orange-400"  },
  success:    { Icon: CheckCircle2,  bg: "bg-emerald-500/10", color: "text-emerald-400" },
}

const CATEGORY_CONFIG: Record<
  Exclude<NotifCategory, "all">,
  { label: string; Icon: React.ElementType; color: string }
> = {
  instagram:   { label: "Instagram",   Icon: Camera, color: "text-pink-400"  },
  competitors: { label: "Concorrentes", Icon: Swords, color: "text-amber-400" },
  system:      { label: "Sistema",      Icon: Zap,    color: "text-indigo-400"},
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS)
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS)
  const [activeCategory, setCategory] = useState<NotifCategory>("all")
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<SyncIssue | null>(null)
  const [healthState, setHealthState] = useState<NotificationsHealthState | null>(null)

  const loadNotificationContext = useCallback(async () => {
    setLoading(true)
    setSyncError(null)
    setHealthState(null)
    let nextPrefs = DEFAULT_NOTIFICATION_PREFS
    let loadError: SyncIssue | null = null

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error

      const metadata = user?.user_metadata as Record<string, unknown> | undefined
      nextPrefs = normalizePrefs(metadata?.notification_prefs)
    } catch (error) {
      loadError = {
        message: error instanceof Error ? error.message : "Falha ao carregar preferências",
      }
    }

    setPrefs(nextPrefs)

    try {
      const healthResponse = await fetch("/api/notifications/health", { cache: "no-store" })
      const healthIssue = await readHealthIssue(
        healthResponse,
        `Falha ao verificar saúde das notificações (HTTP ${healthResponse.status})`
      )
      setHealthState(healthIssue)

      if (!healthResponse.ok) {
        if (healthIssue.code === "NOTIFICATIONS_TABLE_MISSING") {
          throw healthIssue
        }
      } else if (healthIssue.status === "missing_table") {
        throw healthIssue
      }

      const response = await fetch("/api/notifications", { cache: "no-store" })
      if (!response.ok) {
        const apiError = await readApiError(
          response,
          `Falha ao carregar notificações (HTTP ${response.status})`
        )
        throw apiError
      }

      const rows = parseNotificationsResponse(await response.json())
      if (rows.length === 0) {
        const seedResponse = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        if (!seedResponse.ok) {
          throw await readApiError(
            seedResponse,
            `Falha ao inicializar notificações (HTTP ${seedResponse.status})`
          )
        }

        const seededRows = parseNotificationsResponse(await seedResponse.json())
        setNotifs(
          seededRows.length > 0
            ? seededRows.map(mapApiRowToNotification)
            : INITIAL_NOTIFS
        )
        return
      }

      setNotifs(rows.map(mapApiRowToNotification))
    } catch (error) {
      const issue =
        error && typeof error === "object" && "message" in error
          ? (error as SyncIssue)
          : { message: error instanceof Error ? error.message : "Falha ao carregar notificações" }
      if (issue.code === "NOTIFICATIONS_TABLE_MISSING") {
        loadError = issue
        setNotifs([])
      } else {
        loadError = loadError ?? issue
        setNotifs(INITIAL_NOTIFS)
      }
    } finally {
      if (loadError) {
        setSyncError(loadError)
      }
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadNotificationContext()
  }, [loadNotificationContext])

  const visibleNotifs = useMemo(
    () => notifs.filter((notification) => isNotificationEnabled(notification, prefs)),
    [notifs, prefs]
  )

  const filtered = activeCategory === "all"
    ? visibleNotifs
    : visibleNotifs.filter((notification) => notification.category === activeCategory)

  const unreadCount = visibleNotifs.filter((notification) => !notification.read).length
  const counts = visibleNotifs.reduce(
    (acc, n) => { acc[n.category]++; return acc },
    { instagram: 0, competitors: 0, system: 0 } as Record<Exclude<NotifCategory, "all">, number>
  )

  const healthBlock = healthState && healthState.status !== "missing_table" ? (
    healthState.status === "ready" ? (
      <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Saúde das notificações: ok</p>
          <p className="mt-0.5 leading-relaxed">{healthState.message}</p>
        </div>
      </div>
    ) : (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
        <p className="font-semibold text-[var(--foreground)]">Saúde das notificações</p>
        <p className="mt-0.5 leading-relaxed">{healthState.message}</p>
      </div>
    )
  ) : null

  const persistAction = useCallback(async (action: "mark_read" | "dismiss" | "mark_all_read", id?: string) => {
    setSyncing(true)
    setSyncError(null)
    try {
      const response = await fetch("/api/notifications/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      })

      if (!response.ok) {
        throw await readApiError(
          response,
          `Falha ao atualizar notificações (HTTP ${response.status})`
        )
      }
    } catch (error) {
      const issue =
        error && typeof error === "object" && "message" in error
          ? (error as SyncIssue)
          : { message: "Falha ao sincronizar estado de notificações" }
      setSyncError(issue)
    } finally {
      setSyncing(false)
    }
  }, [])

  function updateNotifsAndPersist(
    action: "mark_read" | "dismiss" | "mark_all_read",
    updater: (current: Notification[]) => Notification[],
    id?: string
  ) {
    setNotifs((current) => updater(current))
    void persistAction(action, id)
  }

  function markAllRead() {
    updateNotifsAndPersist("mark_all_read", (current) =>
      current.map((notification) => ({ ...notification, read: true }))
    )
  }

  function markRead(id: string) {
    updateNotifsAndPersist("mark_read", (current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      ),
      id
    )
  }

  function dismiss(id: string) {
    updateNotifsAndPersist("dismiss", (current) =>
      current.filter((notification) => notification.id !== id),
      id
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-[var(--muted-foreground)]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10">
            <Bell size={16} className="text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Notificações</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {unreadCount > 0 ? `${unreadCount} não lidas` : "Tudo em dia ✓"}
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1.5" disabled={syncing}>
              <CheckCircle2 size={13} />
              Marcar todas como lidas
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => { window.location.href = "/settings" }}
            disabled={syncing}
          >
            <Settings2 size={13} />
            Preferências
          </Button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-2">
        {(["all", "instagram", "competitors", "system"] as NotifCategory[]).map((cat) => {
          const isActive = activeCategory === cat
          const isAll = cat === "all"
          const cfg = !isAll ? CATEGORY_CONFIG[cat] : null
          const Icon = !isAll && cfg ? cfg.Icon : Bell
          const count = isAll
            ? visibleNotifs.filter((n) => !n.read).length
            : visibleNotifs.filter((n) => n.category === cat && !n.read).length

          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
              )}
            >
              <Icon size={11} />
              {isAll ? "Todas" : cfg!.label}
              {!isAll && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                  isActive ? "bg-white/20 text-white" : "bg-[var(--border)] text-[var(--muted-foreground)]"
                )}>
                  {counts[cat as Exclude<NotifCategory,"all">]}
                </span>
              )}
              {isAll && count > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] leading-none">
                  {count}
                </span>
              )}
            </button>
          )
        })}
        <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-xs" onClick={loadNotificationContext} disabled={syncing}>
          <RefreshCw size={11} />
          {syncing ? "Sincronizando..." : "Atualizar"}
        </Button>
      </div>

      {healthBlock}

      {syncError?.code === "NOTIFICATIONS_TABLE_MISSING" ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
          <p className="font-semibold">Tabela de notificações ausente</p>
          <p className="mt-1 leading-relaxed">{syncError.message}</p>
          <p className="mt-1 leading-relaxed">
            Execute a migration de notificações no Supabase SQL Editor antes de continuar.
          </p>
        </div>
      ) : syncError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {syncError.message}
        </div>
      ) : null}

      {/* ── Lista de notificações ── */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <Bell size={28} className="mx-auto mb-3 text-[var(--muted-foreground)] opacity-30" />
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Nenhuma notificação aqui
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)] opacity-60">
              Você está em dia com tudo!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Não lidas */}
          {filtered.some((n) => !n.read) && (
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Não lidas
            </p>
          )}
          {filtered.filter((n) => !n.read).map((n) => (
            <NotifCard key={n.id} notif={n} onRead={markRead} onDismiss={dismiss} />
          ))}

          {/* Lidas */}
          {filtered.some((n) => n.read) && filtered.some((n) => !n.read) && (
            <p className="mt-4 px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Anteriores
            </p>
          )}
          {filtered.filter((n) => n.read).map((n) => (
            <NotifCard key={n.id} notif={n} onRead={markRead} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Card individual ──────────────────────────────────────────────────────────

function NotifCard({
  notif,
  onRead,
  onDismiss,
}: {
  notif: Notification
  onRead: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const { Icon, bg, color } = TYPE_CONFIG[notif.type]
  const catCfg = CATEGORY_CONFIG[notif.category]

  return (
    <div
      onClick={() => !notif.read && onRead(notif.id)}
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-3.5 transition-all",
        notif.read
          ? "border-[var(--border)] bg-[var(--card)] opacity-70 hover:opacity-100"
          : "cursor-pointer border-[var(--primary)]/20 bg-[var(--primary)]/5 hover:border-[var(--primary)]/40"
      )}
    >
      {/* Ícone */}
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", bg)}>
        <Icon size={15} className={color} />
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-xs font-semibold", notif.read ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]")}>
            {notif.title}
          </p>
          <span className={cn("flex items-center gap-0.5 text-[10px]", catCfg.color)}>
            <catCfg.Icon size={9} />
            {catCfg.label}
          </span>
          {!notif.read && (
            <span className="ml-auto h-2 w-2 rounded-full bg-[var(--primary)]" />
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {notif.body}
        </p>
        <p className="mt-1 text-[10px] text-[var(--muted-foreground)] opacity-60">
          {notif.time} atrás
        </p>
      </div>

      {/* Ação de remover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(notif.id) }}
        className="shrink-0 rounded p-1 text-[var(--muted-foreground)] opacity-0 transition-all hover:bg-[var(--secondary)] group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
