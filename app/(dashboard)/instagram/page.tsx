"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Camera,
  Plus,
  Image as ImageIcon,
  Film,
  Layers,
  Heart,
  MessageCircle,
  Clock,
  CheckCircle2,
  Edit3,
  Inbox,
  BookOpen,
  BarChart2,
  X,
  CalendarDays,
  Trash2,
  Send,
  AlignLeft,
  Loader2,
  Sparkles,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { AnalyticsResponse } from "@/app/api/analytics/route"

// ─── Types ────────────────────────────────────────────────────────────────────
type PostType = "Post" | "Reels" | "Story" | "Carrossel"
type PostStatus = "backlog" | "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed"

interface Post {
  id: string
  type: PostType
  caption: string
  date: string
  status: PostStatus
  likes?: number
  comments?: number
  shares?: number
  mediaUrl?: string | null
}

type SupabasePostRow = {
  id: string
  type?: string | null
  caption?: string | null
  title?: string | null
  scheduled_at?: string | null
  published_at?: string | null
  status?: string | null
  media_url?: string | null
  metrics?: unknown
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const typeIcons: Record<PostType, React.ElementType> = {
  Post: ImageIcon,
  Reels: Film,
  Story: Layers,
  Carrossel: BookOpen,
}

const typeColors: Record<PostType, string> = {
  Post: "text-pink-400",
  Reels: "text-purple-400",
  Story: "text-amber-400",
  Carrossel: "text-sky-400",
}

const typeBgColors: Record<PostType, string> = {
  Post: "bg-pink-500/10",
  Reels: "bg-purple-500/10",
  Story: "bg-amber-500/10",
  Carrossel: "bg-sky-500/10",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function toPostType(value: string | null | undefined): PostType {
  const normalized = value?.trim().toLowerCase()
  if (normalized === "reels" || normalized === "reel") return "Reels"
  if (normalized === "story" || normalized === "stories") return "Story"
  if (normalized === "carrossel" || normalized === "carousel" || normalized === "carousel_album") {
    return "Carrossel"
  }
  return "Post"
}

function toPostStatus(value: string | null | undefined): PostStatus {
  return value === "backlog" ||
    value === "draft" ||
    value === "approved" ||
    value === "scheduled" ||
    value === "publishing" ||
    value === "published" ||
    value === "failed"
    ? value
    : "draft"
}

function getMetricValue(metrics: unknown, key: string): number | undefined {
  if (!isRecord(metrics)) {
    return undefined
  }

  const value = metrics[key]
  return typeof value === "number" ? value : undefined
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: dateStr.includes("T") ? "2-digit" : undefined,
    minute: dateStr.includes("T") ? "2-digit" : undefined,
  })
}

function formatNumber(value: number | null | undefined) {
  if (value == null) return "—"
  return value.toLocaleString("pt-BR")
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const tabs: { key: PostStatus; label: string; icon: React.ElementType }[] = [
  { key: "backlog",   label: "Ideias",     icon: Inbox        },
  { key: "draft",     label: "Rascunhos",  icon: Edit3        },
  { key: "approved",  label: "Aprovados",  icon: CheckCircle2 },
  { key: "scheduled", label: "Agendados",  icon: Clock        },
  { key: "publishing", label: "Publicando", icon: Send         },
  { key: "published", label: "Publicados", icon: CheckCircle2 },
  { key: "failed",    label: "Falhas",     icon: AlertTriangle },
]

// ─── Mapeamento Supabase → Post local ─────────────────────────────────────────
function dbRowToPost(row: SupabasePostRow): Post {
  const dateStr = row.scheduled_at ?? row.published_at ?? ""
  return {
    id: row.id,
    type: toPostType(row.type),
    caption: row.caption ?? row.title ?? "",
    date: dateStr ? new Date(dateStr).toISOString() : "",
    status: toPostStatus(row.status),
    likes: getMetricValue(row.metrics, "likes"),
    comments: getMetricValue(row.metrics, "comments"),
    shares: getMetricValue(row.metrics, "shares"),
    mediaUrl: row.media_url,
  }
}

// ─── New Post Modal ───────────────────────────────────────────────────────────
interface NewPostModalProps {
  onClose: () => void
  onAdd: (post: Omit<Post, "id">) => Promise<void>
}

function NewPostModal({ onClose, onAdd }: NewPostModalProps) {
  const [caption, setCaption] = useState("")
  const [type, setType] = useState<PostType>("Post")
  const [status, setStatus] = useState<PostStatus>("draft")
  const [date, setDate] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!caption.trim()) return
    setSaving(true)
    try {
      await onAdd({ caption, type, status, date, mediaUrl: mediaUrl.trim() || null })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/20">
              <Plus size={16} className="text-[var(--primary)]" />
            </div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Nova Ideia de Post</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
              <AlignLeft size={12} />
              Legenda / Ideia
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva a legenda ou descreva a ideia do post..."
              rows={3}
              required
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                <ImageIcon size={12} />
                Tipo de Post
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PostType)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30"
              >
                {(["Post", "Reels", "Story", "Carrossel"] as PostType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                <BarChart2 size={12} />
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PostStatus)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30"
              >
                <option value="scheduled">Agendado</option>
                <option value="draft">Rascunho</option>
                <option value="approved">Aprovado</option>
                <option value="published">Publicado</option>
                <option value="publishing">Publicando</option>
                <option value="backlog">Backlog</option>
                <option value="failed">Falhou</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
              <ImageIcon size={12} />
              URL da mídia
              <span className="ml-1 text-[10px] opacity-60">(opcional)</span>
            </label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30"
            />
            {mediaUrl.trim() && (
              <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
                <img
                  src={mediaUrl.trim()}
                  alt="Preview da mídia"
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
              <CalendarDays size={12} />
              Data e Horário
              <span className="ml-1 text-[10px] opacity-60">(opcional)</span>
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 [color-scheme:dark]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!caption.trim() || saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Salvando..." : "Adicionar Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onDelete }: { post: Post; onDelete: (id: string) => void }) {
  const TypeIcon = typeIcons[post.type]

  const statusConfig: Record<PostStatus, { label: string; badgeVariant: "success" | "warning" | "secondary" | "default" | "destructive" }> = {
    backlog:    { label: "Ideia",      badgeVariant: "secondary"   },
    draft:      { label: "Rascunho",   badgeVariant: "warning"     },
    approved:   { label: "Aprovado",   badgeVariant: "success"     },
    scheduled:  { label: "Agendado",   badgeVariant: "success"     },
    publishing: { label: "Publicando", badgeVariant: "warning"     },
    published:  { label: "Publicado",  badgeVariant: "default"     },
    failed:     { label: "Falhou",     badgeVariant: "destructive" },
  }

  const s = statusConfig[post.status]

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/5">
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", typeBgColors[post.type])}>
          <TypeIcon size={16} className={typeColors[post.type]} />
        </div>
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onDelete(post.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--foreground)]">{post.caption}</p>

      {post.mediaUrl && (
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
          <img
            src={post.mediaUrl}
            alt="Mídia planejada"
            className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        </div>
      )}

      {post.status === "published" && (
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Heart size={11} className="text-rose-400" />
            {(post.likes ?? 0).toLocaleString("pt-BR")}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={11} className="text-sky-400" />
            {(post.comments ?? 0).toLocaleString("pt-BR")}
          </span>
          <span className="flex items-center gap-1">
            <Send size={11} className="text-indigo-400" />
            {(post.shares ?? 0).toLocaleString("pt-BR")}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Badge variant={s.badgeVariant}>{s.label}</Badge>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", typeBgColors[post.type], typeColors[post.type])}>
            {post.type}
          </span>
          {post.date && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDate(post.date)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border)] py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--secondary)]">
        <Inbox size={20} className="text-[var(--muted-foreground)]" />
      </div>
      <p className="text-sm font-medium text-[var(--foreground)]">Nenhum post em {label}</p>
      <p className="text-xs text-[var(--muted-foreground)]">Clique em Novo post para adicionar conteúdo</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InstagramPage() {
  const [posts,      setPosts]      = useState<Post[]>([])
  const [loading,    setLoading]    = useState(true)
  const [analytics,  setAnalytics]  = useState<AnalyticsResponse | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [activeTab,  setActiveTab]  = useState<PostStatus>("scheduled")
  const [showModal,  setShowModal]  = useState(false)
  const [userId,     setUserId]     = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setPosts(data.map(dbRowToPost))
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

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

  async function handleAddPost(post: Omit<Post, "id">) {
    if (!userId) return
    const scheduledAt = post.status === "scheduled" && post.date ? new Date(post.date).toISOString() : null
    const publishedAt = post.status === "published"  && post.date ? new Date(post.date).toISOString() : null

    const { data, error } = await supabase.from("posts").insert({
      user_id:      userId,
      title:        post.caption.slice(0, 80),
      caption:      post.caption,
      platform:     "instagram",
      type:         post.type.toLowerCase(),
      status:       post.status,
      media_url:    post.mediaUrl ?? null,
      scheduled_at: scheduledAt,
      published_at: publishedAt,
    }).select().single()

    if (!error && data) {
      setPosts((prev) => [dbRowToPost(data), ...prev])
      setActiveTab(post.status)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("posts").delete().eq("id", id)
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const filtered = posts.filter((p) => p.status === activeTab)

  const counts: Record<PostStatus, number> = {
    backlog:   posts.filter((p) => p.status === "backlog").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    draft:     posts.filter((p) => p.status === "draft").length,
    approved:  posts.filter((p) => p.status === "approved").length,
    publishing: posts.filter((p) => p.status === "publishing").length,
    published: posts.filter((p) => p.status === "published").length,
    failed:    posts.filter((p) => p.status === "failed").length,
  }

  const publishedPosts = posts.filter((p) => p.status === "published")
  const instagramTopPosts = analytics?.source === "instagram" ? analytics.topPosts : []
  const totalLikes = instagramTopPosts.length > 0
    ? instagramTopPosts.reduce((sum, post) => sum + post.likes, 0)
    : publishedPosts.reduce((sum, post) => sum + (post.likes ?? 0), 0)
  const totalComments = instagramTopPosts.length > 0
    ? instagramTopPosts.reduce((sum, post) => sum + post.comments, 0)
    : publishedPosts.reduce((sum, post) => sum + (post.comments ?? 0), 0)
  const instagramConnected = analytics?.sourcesAvailable.instagram ?? false
  const followers = analytics?.source === "instagram" ? analytics.profile?.followers : null
  const mediaCount = analytics?.source === "instagram" ? analytics.profile?.mediaCount : null
  const profileLabel = analytics?.profile?.username ? `@${analytics.profile.username}` : "Instagram Graph API"

  return (
    <>
      {showModal && (
        <NewPostModal onClose={() => setShowModal(false)} onAdd={handleAddPost} />
      )}

      <div className="space-y-6">
        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Seguidores",
              value: analyticsLoading ? "..." : instagramConnected ? formatNumber(followers) : "Conectar",
              sub: instagramConnected ? profileLabel : "Instagram pendente",
              icon: Camera,
              color: "text-pink-400",
            },
            {
              label: "Posts agendados",
              value: counts.scheduled.toString(),
              sub: mediaCount != null ? `${formatNumber(mediaCount)} mídias no perfil` : "conteúdo local",
              icon: Clock,
              color: "text-indigo-400",
            },
            {
              label: "Curtidas (30d)",
              value: analyticsLoading ? "..." : formatNumber(totalLikes),
              sub: instagramTopPosts.length > 0 ? "dados do Instagram" : "dados locais",
              icon: Heart,
              color: "text-rose-400",
            },
            {
              label: "Comentários (30d)",
              value: analyticsLoading ? "..." : formatNumber(totalComments),
              sub: instagramTopPosts.length > 0 ? "dados do Instagram" : "dados locais",
              icon: MessageCircle,
              color: "text-sky-400",
            },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
                      <p className="mt-1.5 text-2xl font-bold text-[var(--foreground)]">{stat.value}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{stat.sub}</p>
                    </div>
                    <Icon size={18} className={stat.color} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ── Content Board ── */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Gerenciador de Conteúdo</CardTitle>
                <CardDescription>
                  {loading
                    ? "Carregando posts do Supabase..."
                    : `${posts.length} post${posts.length !== 1 ? "s" : ""} salvos no banco de dados`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/growth-lab">
                    <Sparkles size={14} />
                    Growth Lab
                  </Link>
                </Button>
                <Button size="sm" onClick={() => setShowModal(true)}>
                  <Plus size={14} />
                  Novo post
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                      isActive
                        ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                    <span className={cn(
                      "min-w-[18px] rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      isActive
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--border)] text-[var(--muted-foreground)]"
                    )}>
                      {counts[tab.key]}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState label={tabs.find((t) => t.key === activeTab)?.label ?? activeTab} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
