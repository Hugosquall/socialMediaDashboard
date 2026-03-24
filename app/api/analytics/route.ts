/**
 * GET /api/analytics
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
 *
 * Estratégia de fonte de dados (em ordem de prioridade):
 *  1. Instagram Graph API — se houver access_token salvo no Supabase para o usuário
 *  2. Metricool API       — se houver chave no user_metadata do usuário ou no env global
 *  3. Dados mockados      — fallback sempre disponível (não quebra nada em dev)
 *
 * O campo `source` na resposta indica qual fonte foi usada.
 * O campo `sourcesAvailable` informa quais fontes estão configuradas.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyDataPoint {
  date: string
  impressions: number
  reach: number
  engagementRate: number
  followers: number
}

export interface TopPost {
  id: string | number
  caption: string
  type: string
  network: string
  impressions: number
  reach: number
  engagement: number
  likes: number
  comments: number
  saves: number
}

export interface EngagementByType {
  type: string
  instagram: number
  facebook: number
  twitter: number
}

export interface AnalyticsResponse {
  source: "instagram" | "metricool" | "mock"
  sourcesAvailable: {
    instagram: boolean
    metricool: boolean
  }
  daily: DailyDataPoint[]
  topPosts: TopPost[]
  engagementByType: EngagementByType[]
}

interface InsightMetricValue {
  end_time?: string
  value?: number
}

interface InsightMetric {
  name: string
  values?: InsightMetricValue[]
}

interface InstagramInsightsResponse {
  data?: InsightMetric[]
}

interface InstagramProfileResponse {
  followers_count?: number
}

interface InstagramMediaItem {
  id: string
  caption?: string
  media_type?: string
  like_count?: number
  comments_count?: number
}

interface InstagramMediaResponse {
  data?: InstagramMediaItem[]
}

interface MetricoolNetworkValues {
  impressions?: number
  reach?: number
  engagementRate?: number
  followers?: number
}

interface MetricoolEvolutionDay {
  date: string
  networks?: {
    instagram?: MetricoolNetworkValues
    facebook?: MetricoolNetworkValues
    twitter?: MetricoolNetworkValues
  }
}

interface MetricoolEvolutionResponse {
  data?: MetricoolEvolutionDay[]
}

interface MetricoolPostItem {
  id?: string | number
  text?: string
  caption?: string
  type?: string
  network?: string
  impressions?: number
  reach?: number
  engagementRate?: number
  likes?: number
  comments?: number
  saves?: number
}

interface MetricoolPostsResponse {
  data?: MetricoolPostItem[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getMetricoolApiKey(metadata: unknown): string | null {
  if (!isRecord(metadata)) {
    return null
  }

  const value = metadata.metricool_api_key
  if (typeof value !== "string") {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

function parseJsonObject<T>(value: unknown): T {
  if (!isRecord(value)) {
    return {} as T
  }

  return value as T
}

// ─── Mock data (fallback) ─────────────────────────────────────────────────────

function generateMockDailyData(from: Date, to: Date): DailyDataPoint[] {
  const days: DailyDataPoint[] = []
  const cursor = new Date(from)
  let baseFollowers = 24800
  // Seed deterministico baseado na data para evitar hidratação diferente no cliente
  let seed = from.getTime() % 9999
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646
  }
  while (cursor <= to) {
    baseFollowers += Math.floor(rand() * 60 - 5)
    days.push({
      date: cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      impressions: Math.floor(8000 + rand() * 14000),
      engagementRate: parseFloat((3.5 + rand() * 3.5).toFixed(2)),
      followers: baseFollowers,
      reach: Math.floor(5000 + rand() * 9000),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

const MOCK_TOP_POSTS: TopPost[] = [
  { id: 1, caption: "Lançamento coleção outono/inverno 🍂",    type: "Post",     network: "Instagram", impressions: 41800, reach: 18400, engagement: 8.2, likes: 1920, comments: 148, saves: 312 },
  { id: 2, caption: "Novo produto chegando! Fique ligado 👀",  type: "Post",     network: "Instagram", impressions: 33600, reach: 14200, engagement: 7.9, likes: 1540, comments:  97, saves: 210 },
  { id: 3, caption: "Behind the scenes #bastidores",           type: "Reels",    network: "Instagram", impressions: 29200, reach: 12800, engagement: 6.1, likes: 1140, comments:  74, saves: 185 },
  { id: 4, caption: "Dicas de estilo para o final de semana ☀️", type: "Post",  network: "Facebook",  impressions: 22100, reach:  9100, engagement: 5.4, likes:  820, comments:  61, saves:  98 },
  { id: 5, caption: "Tutorial de look completo ✨",             type: "Reels",   network: "Instagram", impressions: 18400, reach:  7600, engagement: 5.1, likes:  710, comments:  53, saves: 144 },
]

const MOCK_ENGAGEMENT_BY_TYPE: EngagementByType[] = [
  { type: "Post",      instagram: 5.8, facebook: 3.2, twitter: 1.4 },
  { type: "Reels",     instagram: 8.4, facebook: 0,   twitter: 0   },
  { type: "Stories",   instagram: 4.1, facebook: 2.6, twitter: 0   },
  { type: "Carrossel", instagram: 7.2, facebook: 4.1, twitter: 0   },
  { type: "Vídeo",     instagram: 6.3, facebook: 5.8, twitter: 2.1 },
]

// ─── Instagram Graph API ──────────────────────────────────────────────────────

async function fetchInstagramAnalytics(
  accessToken: string,
  igUserId: string,
  from: Date,
  to: Date
): Promise<{ daily: DailyDataPoint[]; topPosts: TopPost[] }> {
  const since = Math.floor(from.getTime() / 1000)
  // until é exclusivo na API — adiciona 1 dia
  const untilDate = new Date(to)
  untilDate.setDate(untilDate.getDate() + 1)
  const until = Math.floor(untilDate.getTime() / 1000)

  // ── Insights de conta (impressões + alcance por dia) ──────────────────────
  const insightsUrl =
    `https://graph.instagram.com/v19.0/${igUserId}/insights?` +
    new URLSearchParams({
      metric:       "impressions,reach",
      period:       "day",
      since:        since.toString(),
      until:        until.toString(),
      access_token: accessToken,
    })

  const insightsRes = await fetch(insightsUrl)
  if (!insightsRes.ok) {
    throw new Error(`Instagram insights error: ${await insightsRes.text()}`)
  }
  const insightsData = parseJsonObject<InstagramInsightsResponse>(await insightsRes.json())

  // ── Seguidores atuais ─────────────────────────────────────────────────────
  const profileRes = await fetch(
    `https://graph.instagram.com/v19.0/${igUserId}?fields=followers_count&access_token=${accessToken}`
  )
  const profileData = profileRes.ok
    ? parseJsonObject<InstagramProfileResponse>(await profileRes.json())
    : {}
  const followersNow: number = profileData.followers_count ?? 0

  // ── Montar dicionários data→valor ─────────────────────────────────────────
  const impressionsMetric = insightsData.data?.find((metric) => metric.name === "impressions")
  const reachMetric = insightsData.data?.find((metric) => metric.name === "reach")

  const impressionsByDate: Record<string, number> = {}
  const reachByDate: Record<string, number> = {}

  for (const val of impressionsMetric?.values ?? []) {
    const d = val.end_time?.slice(0, 10) ?? ""
    if (d) impressionsByDate[d] = val.value ?? 0
  }
  for (const val of reachMetric?.values ?? []) {
    const d = val.end_time?.slice(0, 10) ?? ""
    if (d) reachByDate[d] = val.value ?? 0
  }

  // ── Construir array diário ────────────────────────────────────────────────
  // O end_time do Instagram é o dia seguinte (UTC) — tentamos as duas datas
  const daily: DailyDataPoint[] = []
  const cursor = new Date(from)
  while (cursor <= to) {
    const isoDate = cursor.toISOString().slice(0, 10)
    const nextDay = new Date(cursor)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextIso = nextDay.toISOString().slice(0, 10)

    const impressions = impressionsByDate[nextIso] ?? impressionsByDate[isoDate] ?? 0
    const reach = reachByDate[nextIso] ?? reachByDate[isoDate] ?? 0
    // Estimativa de engajamento baseada em impressões/alcance quando não há dado direto
    const engagementRate = reach > 0
      ? parseFloat(((impressions / reach - 1) * 5).toFixed(2))
      : 0

    daily.push({
      date: cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      impressions,
      reach,
      engagementRate: Math.max(0, engagementRate),
      followers: followersNow,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  // ── Top posts do período ──────────────────────────────────────────────────
  const mediaRes = await fetch(
    `https://graph.instagram.com/v19.0/${igUserId}/media?` +
      new URLSearchParams({
        fields:       "id,caption,media_type,timestamp,like_count,comments_count",
        limit:        "10",
        access_token: accessToken,
      })
  )
  const mediaData = mediaRes.ok
    ? parseJsonObject<InstagramMediaResponse>(await mediaRes.json())
    : { data: [] }
  const topPosts: TopPost[] = []

  for (const media of (mediaData.data ?? []).slice(0, 10)) {
    const postInsightsRes = await fetch(
      `https://graph.instagram.com/v19.0/${media.id}/insights?` +
        new URLSearchParams({
          metric:       "impressions,reach,saved",
          access_token: accessToken,
        })
    )
    const postInsights: { data?: InsightMetric[] } = postInsightsRes.ok
      ? parseJsonObject<{ data?: InsightMetric[] }>(await postInsightsRes.json())
      : { data: [] }
    const getMetric = (name: string) =>
      postInsights.data?.find((metric) => metric.name === name)?.values?.[0]?.value ?? 0

    const imp = getMetric("impressions")
    const rch = getMetric("reach")
    const svd = getMetric("saved")
    const lks = media.like_count ?? 0
    const cmts = media.comments_count ?? 0
    const eng = rch > 0
      ? parseFloat((((lks + cmts + svd) / rch) * 100).toFixed(1))
      : 0

    const typeMap: Record<string, string> = {
      IMAGE:          "Post",
      VIDEO:          "Reels",
      CAROUSEL_ALBUM: "Carrossel",
    }

    topPosts.push({
      id:          media.id,
      caption:     media.caption ?? "(sem legenda)",
      type:        typeMap[media.media_type ?? ""] ?? media.media_type ?? "Post",
      network:     "Instagram",
      impressions: imp,
      reach:       rch,
      engagement:  eng,
      likes:       lks,
      comments:    cmts,
      saves:       svd,
    })
  }

  topPosts.sort((a, b) => b.impressions - a.impressions)
  return { daily, topPosts }
}

// ─── Metricool API ────────────────────────────────────────────────────────────
// Docs: https://metricool.com/developers
// Autenticação: Authorization: Bearer {API_KEY}
// Formato de data: YYYYMMDD

async function fetchMetricoolAnalytics(
  apiKey: string,
  from: Date,
  to: Date
): Promise<{ daily: DailyDataPoint[]; topPosts: TopPost[]; engagementByType: EngagementByType[] }> {
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "") // YYYYMMDD

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }

  // ── Evolução diária de métricas ───────────────────────────────────────────
  const statsRes = await fetch(
    `https://app.metricool.com/api/v2/stats/evolution?` +
      new URLSearchParams({ initDate: fmt(from), endDate: fmt(to) }),
    { headers }
  )
  if (!statsRes.ok) {
    throw new Error(`Metricool stats error: ${await statsRes.text()}`)
  }
  const statsData = parseJsonObject<MetricoolEvolutionResponse>(await statsRes.json())

  const daily: DailyDataPoint[] = (statsData.data ?? []).map((day) => {
    const ig = day.networks?.instagram ?? {}
    const fb = day.networks?.facebook ?? {}
    const tw = day.networks?.twitter ?? {}
    return {
      date: new Date(day.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      impressions:    (ig.impressions ?? 0) + (fb.impressions ?? 0) + (tw.impressions ?? 0),
      reach:          (ig.reach ?? 0) + (fb.reach ?? 0) + (tw.reach ?? 0),
      engagementRate: parseFloat((ig.engagementRate ?? 0).toFixed(2)),
      followers:      ig.followers ?? fb.followers ?? 0,
    }
  })

  // ── Top posts do período ──────────────────────────────────────────────────
  const postsRes = await fetch(
    `https://app.metricool.com/api/v2/posts/best?` +
      new URLSearchParams({ initDate: fmt(from), endDate: fmt(to), limit: "10" }),
    { headers }
  )
  const postsData = postsRes.ok
    ? parseJsonObject<MetricoolPostsResponse>(await postsRes.json())
    : { data: [] }

  const topPosts: TopPost[] = (postsData.data ?? []).map((p, i) => ({
    id:          p.id ?? i,
    caption:     p.text ?? p.caption ?? "(sem legenda)",
    type:        p.type ?? "Post",
    network:     p.network ?? "Instagram",
    impressions: p.impressions ?? 0,
    reach:       p.reach ?? 0,
    engagement:  p.engagementRate ?? 0,
    likes:       p.likes ?? 0,
    comments:    p.comments ?? 0,
    saves:       p.saves ?? 0,
  }))

  // engagementByType não está exposto diretamente pela Metricool — usamos mock
  return { daily, topPosts, engagementByType: MOCK_ENGAGEMENT_BY_TYPE }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fromParam = searchParams.get("from")
  const toParam   = searchParams.get("to")

  const to   = toParam   ? new Date(toParam   + "T23:59:59") : new Date()
  const from = fromParam ? new Date(fromParam + "T00:00:00") : (() => {
    const d = new Date(to)
    d.setDate(d.getDate() - 29)
    return d
  })()

  let instagramToken:  string | null = null
  let instagramUserId: string | null = null
  let metricoolApiKey: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error("[Analytics] Falha ao carregar usuário:", error)
    }

    if (user) {
      const { data: tokenRow } = await supabase
        .from("instagram_tokens")
        .select("access_token, instagram_user_id")
        .eq("user_id", user.id)
        .single()
      if (tokenRow) {
        instagramToken  = tokenRow.access_token
        instagramUserId = tokenRow.instagram_user_id
      }

      metricoolApiKey = getMetricoolApiKey(user.user_metadata)
    }
  } catch {
    // Falha de autenticação — segue para fallback
  }

  if (!metricoolApiKey) {
    metricoolApiKey = process.env.METRICOOL_API_KEY?.trim() ?? null
  }

  const sourcesAvailable = {
    instagram: instagramToken  !== null,
    metricool: metricoolApiKey !== null,
  }

  // ── 1. Tentar Instagram Graph API ─────────────────────────────────────────
  if (instagramToken && instagramUserId) {
    try {
      const { daily, topPosts } = await fetchInstagramAnalytics(
        instagramToken, instagramUserId, from, to
      )
      return NextResponse.json({
        source: "instagram",
        sourcesAvailable,
        daily,
        topPosts,
        engagementByType: MOCK_ENGAGEMENT_BY_TYPE,
      } satisfies AnalyticsResponse)
    } catch (err) {
      console.error("[Analytics] Instagram API error — tentando Metricool:", err)
    }
  }

  // ── 2. Tentar Metricool ───────────────────────────────────────────────────
  if (metricoolApiKey) {
    try {
      const { daily, topPosts, engagementByType } = await fetchMetricoolAnalytics(
        metricoolApiKey, from, to
      )
      return NextResponse.json({
        source: "metricool",
        sourcesAvailable,
        daily,
        topPosts,
        engagementByType,
      } satisfies AnalyticsResponse)
    } catch (err) {
      console.error("[Analytics] Metricool API error — usando mock:", err)
    }
  }

  // ── 3. Fallback: dados mockados ───────────────────────────────────────────
  return NextResponse.json({
    source: "mock",
    sourcesAvailable,
    daily:             generateMockDailyData(from, to),
    topPosts:          MOCK_TOP_POSTS,
    engagementByType:  MOCK_ENGAGEMENT_BY_TYPE,
  } satisfies AnalyticsResponse)
}
