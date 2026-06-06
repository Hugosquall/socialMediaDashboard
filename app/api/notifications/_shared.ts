import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"
import { getInstagramTokenStatus } from "@/lib/instagram-token-status"

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"]
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]

export interface NotificationResponseItem {
  id: string
  type: NotificationRow["type"]
  category: NotificationRow["category"]
  title: string
  body: string
  time_label: string | null
  read_at: string | null
  dismissed_at: string | null
  created_at: string | null
  updated_at: string | null
}

type NotificationSeedItem = {
  type: NotificationRow["type"]
  category: NotificationRow["category"]
  title: string
  body: string
  timeLabel: string
  minutesAgo: number
  read: boolean
}

export const notificationColumns =
  "id,user_id,type,category,title,body,time_label,read_at,dismissed_at,created_at,updated_at" as const

const instagramTokenNotificationTitles = [
  "Token do Instagram expira em breve",
  "Token do Instagram expirou",
] as const

export const seedNotifications: NotificationSeedItem[] = [
  {
    type: "follow",
    category: "instagram",
    title: "Novo seguidor",
    body: "@dev_ia_br começou a seguir você - 42K seguidores",
    timeLabel: "2min",
    minutesAgo: 2,
    read: false,
  },
  {
    type: "comment",
    category: "instagram",
    title: "Novo comentário",
    body: "@qa_lead: \"Esse fluxo de evals com Playwright ficou muito bom. Pode detalhar?\"",
    timeLabel: "15min",
    minutesAgo: 15,
    read: false,
  },
  {
    type: "like",
    category: "instagram",
    title: "Post em alta",
    body: "\"Como testar features com IA\" recebeu 847 curtidas nas últimas 2 horas",
    timeLabel: "32min",
    minutesAgo: 32,
    read: false,
  },
  {
    type: "competitor",
    category: "competitors",
    title: "Concorrente publicou",
    body: "@rocketseat publicou 3 posts hoje - acima da media semanal deles",
    timeLabel: "1h",
    minutesAgo: 60,
    read: false,
  },
  {
    type: "mention",
    category: "instagram",
    title: "Você foi marcado",
    body: "@devrel_br marcou você em um post sobre agentes de IA em produção",
    timeLabel: "2h",
    minutesAgo: 120,
    read: true,
  },
  {
    type: "alert",
    category: "competitors",
    title: "Alerta de concorrente",
    body: "@openai cresceu 2.4K seguidores hoje - verifique a estratégia deles",
    timeLabel: "3h",
    minutesAgo: 180,
    read: true,
  },
  {
    type: "success",
    category: "system",
    title: "Feed sincronizado",
    body: "AI Dev Radar atualizou com novos artigos de OpenAI, GitHub e Hugging Face",
    timeLabel: "4h",
    minutesAgo: 240,
    read: true,
  },
  {
    type: "follow",
    category: "instagram",
    title: "Marco atingido",
    body: "Você ultrapassou 48.000 seguidores! +1.200 novos este mês",
    timeLabel: "6h",
    minutesAgo: 360,
    read: true,
  },
  {
    type: "alert",
    category: "system",
    title: "Agendamento próximo",
    body: "\"Coleção especial Páscoa\" está agendado para hoje às 10:00",
    timeLabel: "8h",
    minutesAgo: 480,
    read: true,
  },
  {
    type: "competitor",
    category: "competitors",
    title: "Queda de engajamento detectada",
    body: "@cursor_ai teve queda de 18% no engajamento essa semana - oportunidade para você",
    timeLabel: "1d",
    minutesAgo: 1440,
    read: true,
  },
  {
    type: "comment",
    category: "instagram",
    title: "Novo comentário",
    body: "@ana_qa: \"Adorei o conteúdo sobre testes de agentes. Pode fazer mais?\"",
    timeLabel: "1d",
    minutesAgo: 1500,
    read: true,
  },
  {
    type: "success",
    category: "system",
    title: "Relatório mensal gerado",
    body: "Analytics de Fevereiro 2026 disponível - engajamento médio de 4.8%",
    timeLabel: "2d",
    minutesAgo: 2880,
    read: true,
  },
]

export function buildSeedNotifications(userId: string, now = new Date()): NotificationInsert[] {
  return seedNotifications.map((item) => {
    const createdAt = new Date(now.getTime() - item.minutesAgo * 60_000).toISOString()
    return {
      user_id: userId,
      type: item.type,
      category: item.category,
      title: item.title,
      body: item.body,
      time_label: item.timeLabel,
      created_at: createdAt,
      updated_at: createdAt,
      read_at: item.read ? createdAt : null,
      dismissed_at: null,
    }
  })
}

export function mapNotificationRow(row: NotificationRow): NotificationResponseItem {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    title: row.title,
    body: row.body,
    time_label: row.time_label,
    read_at: row.read_at,
    dismissed_at: row.dismissed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function mapNotificationRows(rows: NotificationRow[]): NotificationResponseItem[] {
  return rows.map(mapNotificationRow)
}

export async function listUserNotifications(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<NotificationResponseItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(notificationColumns)
    .eq("user_id", userId)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return mapNotificationRows((data ?? []) as NotificationRow[])
}

function buildInstagramTokenNotification(
  userId: string,
  instagramUsername: string | null,
  expiresAt: string | null,
  now = new Date()
): NotificationInsert | null {
  const status = getInstagramTokenStatus(expiresAt, now.getTime())
  const username = instagramUsername ? `@${instagramUsername}` : "Sua conta do Instagram"
  const timestamp = now.toISOString()

  if (status.tokenState === "expired") {
    return {
      user_id: userId,
      type: "alert",
      category: "system",
      title: "Token do Instagram expirou",
      body: `${username} precisa ser reconectada para voltar a atualizar dados reais no dashboard.`,
      time_label: "agora",
      read_at: null,
      dismissed_at: null,
      created_at: timestamp,
      updated_at: timestamp,
    }
  }

  if (status.tokenState === "expiring") {
    const days = status.expiresInDays ?? 0
    return {
      user_id: userId,
      type: "alert",
      category: "system",
      title: "Token do Instagram expira em breve",
      body: `${username} deve ser reconectada em ${days} dia${days === 1 ? "" : "s"} para manter os dados reais atualizados.`,
      time_label: "agora",
      read_at: null,
      dismissed_at: null,
      created_at: timestamp,
      updated_at: timestamp,
    }
  }

  return null
}

export async function syncInstagramTokenExpiryNotification(
  supabase: SupabaseClient<Database>,
  userId: string,
  now = new Date()
): Promise<void> {
  const { data: token, error: tokenError } = await supabase
    .from("instagram_tokens")
    .select("instagram_username, expires_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (tokenError) {
    throw new Error(tokenError.message)
  }

  const { data: existing, error: existingError } = await supabase
    .from("notifications")
    .select(notificationColumns)
    .eq("user_id", userId)
    .eq("category", "system")
    .eq("type", "alert")
    .in("title", [...instagramTokenNotificationTitles])
    .is("dismissed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  const notification = token
    ? buildInstagramTokenNotification(userId, token.instagram_username, token.expires_at, now)
    : null

  if (!notification) {
    if (existing) {
      const { error } = await supabase
        .from("notifications")
        .update({
          dismissed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", existing.id)
        .eq("user_id", userId)

      if (error) {
        throw new Error(error.message)
      }
    }
    return
  }

  if (existing) {
    const { error } = await supabase
      .from("notifications")
      .update({
        title: notification.title,
        body: notification.body,
        time_label: notification.time_label,
        read_at: null,
        dismissed_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", existing.id)
      .eq("user_id", userId)

    if (error) {
      throw new Error(error.message)
    }
    return
  }

  const { error } = await supabase
    .from("notifications")
    .insert(notification)

  if (error) {
    throw new Error(error.message)
  }
}
