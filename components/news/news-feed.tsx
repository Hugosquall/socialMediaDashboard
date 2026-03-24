"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Newspaper,
  ExternalLink,
  TrendingUp,
  Clock,
  RefreshCw,
  Building2,
  Wrench,
  FlaskConical,
  Briefcase,
  LayoutGrid,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react"
import type { NewsItem } from "@/app/api/news/route"

// ─── Tipos e constantes ───────────────────────────────────────────────────────

type TopicFilter = "all" | "tools" | "research" | "business" | "general"

const TOPIC_CONFIG: Record<
  TopicFilter,
  { label: string; icon: React.ElementType; color: string; badgeClass: string }
> = {
  all: {
    label: "Todas",
    icon: LayoutGrid,
    color: "text-[var(--primary)]",
    badgeClass: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20",
  },
  tools: {
    label: "Ferramentas",
    icon: Wrench,
    color: "text-blue-400",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  research: {
    label: "Pesquisa",
    icon: FlaskConical,
    color: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  business: {
    label: "Negócios",
    icon: Briefcase,
    color: "text-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  general: {
    label: "Geral",
    icon: Building2,
    color: "text-[var(--muted-foreground)]",
    badgeClass:
      "bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]",
  },
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TopicBadge({ topic }: { topic: NewsItem["topic"] }) {
  const cfg = TOPIC_CONFIG[topic]
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.badgeClass}`}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  )
}

function SourceDot({ source }: { source: string }) {
  // Cor determinística baseada no nome da fonte
  const colors = [
    "bg-purple-400",
    "bg-blue-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-rose-400",
    "bg-cyan-400",
  ]
  const idx = source.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${colors[idx]}`} />
}

function TrendingCard({ item }: { item: NewsItem }) {
  return (
    <Card className="group relative overflow-hidden border-[var(--primary)]/25 bg-gradient-to-br from-[var(--primary)]/8 to-transparent transition-all hover:border-[var(--primary)]/50 hover:shadow-lg hover:shadow-[var(--primary)]/5">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/3 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="gap-1 text-[10px]">
            <TrendingUp size={9} />
            Em alta
          </Badge>
          <TopicBadge topic={item.topic} />
        </div>
        <CardTitle className="mt-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)] line-clamp-3">
          {item.summary}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
            <SourceDot source={item.source} />
            <span className="font-medium">{item.source}</span>
            <span className="opacity-40">·</span>
            <Clock size={9} />
            <span>{item.publishDate}</span>
          </div>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            Ler
            <ExternalLink size={9} />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

function FeedRow({ item }: { item: NewsItem }) {
  return (
    <div className="group flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <TopicBadge topic={item.topic} />
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
            <SourceDot source={item.source} />
            <span className="font-medium">{item.source}</span>
            <span className="opacity-40">·</span>
            <Clock size={9} />
            <span>{item.publishDate}</span>
          </div>
        </div>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium leading-snug text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
        >
          {item.title}
        </a>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {item.summary}
        </p>
      </div>
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-start pt-0.5"
      >
        <span className="rounded p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]">
          <ExternalLink size={13} />
        </span>
      </a>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [source, setSource] = useState<"live" | "mock" | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTopic, setActiveTopic] = useState<TopicFilter>("all")
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/news", { cache: "no-store" })
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()
      setItems(data.items || [])
      setSource(data.source)
      setLastUpdated(
        new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      )
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Filtragem
  const filtered =
    activeTopic === "all" ? items : items.filter((i) => i.topic === activeTopic)

  const trending = filtered.filter((i) => i.trending)
  const feed = filtered.filter((i) => !i.trending)

  // Contagem por tópico
  const counts = items.reduce(
    (acc, item) => {
      acc[item.topic] = (acc[item.topic] || 0) + 1
      acc.all++
      return acc
    },
    { all: 0, tools: 0, research: 0, business: 0, general: 0 } as Record<TopicFilter, number>
  )

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Arquitetura &amp; Construção
            </h2>
            {source === "live" ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <Wifi size={9} />
                Ao vivo
              </span>
            ) : source === "mock" ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                <WifiOff size={9} />
                Demonstração
              </span>
            ) : null}
          </div>
          {lastUpdated && (
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Atualizado às {lastUpdated} · {items.length} notícias
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchNews}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {loading ? "Carregando…" : "Atualizar"}
        </Button>
      </div>

      {/* ── Filtros por tópico ── */}
      <div className="flex flex-wrap gap-2">
        {(["all", "tools", "research", "business", "general"] as TopicFilter[]).map((t) => {
          const cfg = TOPIC_CONFIG[t]
          const Icon = cfg.icon
          const isActive = activeTopic === t
          return (
            <button
              key={t}
              onClick={() => setActiveTopic(t)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={11} />
              {cfg.label}
              {counts[t] > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    isActive ? "bg-white/20 text-white" : "bg-[var(--border)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {counts[t]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Estado de carregamento ── */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-3 w-24 rounded-full bg-[var(--secondary)]" />
                <div className="mt-2 h-4 w-full rounded bg-[var(--secondary)]" />
                <div className="h-4 w-3/4 rounded bg-[var(--secondary)]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full rounded bg-[var(--secondary)]" />
                  <div className="h-2.5 w-5/6 rounded bg-[var(--secondary)]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Erro ── */}
      {!loading && error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle size={18} className="text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium">Não foi possível carregar as notícias</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchNews} className="ml-auto shrink-0">
              Tentar de novo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Conteúdo ── */}
      {!loading && !error && (
        <>
          {/* Trending */}
          {trending.length > 0 && (
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                <TrendingUp size={11} className="text-[var(--primary)]" />
                Em alta agora
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {trending.map((item) => (
                  <TrendingCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Feed principal */}
          {feed.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Newspaper size={14} className="text-[var(--primary)]" />
                  Feed de Notícias
                </CardTitle>
                <CardDescription className="text-xs">
                  {filtered.length} {filtered.length === 1 ? "artigo encontrado" : "artigos encontrados"}
                  {activeTopic !== "all" && ` em "${TOPIC_CONFIG[activeTopic].label}"`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-[var(--border)]">
                  {feed.map((item) => (
                    <FeedRow key={item.id} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Sem resultados */}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2
                  size={32}
                  className="mx-auto mb-3 text-[var(--muted-foreground)] opacity-30"
                />
                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                  Nenhuma notícia neste tópico
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)] opacity-60">
                  Tente selecionar outro filtro ou atualizar o feed
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTopic("all")}>
                  Ver todas
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
