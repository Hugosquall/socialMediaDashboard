import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

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

export const seedNotifications: NotificationSeedItem[] = [
  {
    type: "follow",
    category: "instagram",
    title: "Novo seguidor",
    body: "@arquitetura.sp começou a seguir você - 142K seguidores",
    timeLabel: "2min",
    minutesAgo: 2,
    read: false,
  },
  {
    type: "comment",
    category: "instagram",
    title: "Novo comentário",
    body: "@joao_design: \"Esse projeto ficou incrível! Qual software você usou?\"",
    timeLabel: "15min",
    minutesAgo: 15,
    read: false,
  },
  {
    type: "like",
    category: "instagram",
    title: "Post em alta",
    body: "\"BIM ganha adoção global\" recebeu 847 curtidas nas últimas 2 horas",
    timeLabel: "32min",
    minutesAgo: 32,
    read: false,
  },
  {
    type: "competitor",
    category: "competitors",
    title: "Concorrente publicou",
    body: "@dezeen publicou 3 posts hoje - acima da media semanal deles",
    timeLabel: "1h",
    minutesAgo: 60,
    read: false,
  },
  {
    type: "mention",
    category: "instagram",
    title: "Você foi marcado",
    body: "@studiomarcio marcou você em um post sobre tendências de fachadas 2026",
    timeLabel: "2h",
    minutesAgo: 120,
    read: true,
  },
  {
    type: "alert",
    category: "competitors",
    title: "Alerta de concorrente",
    body: "@archdaily.br cresceu 2.4K seguidores hoje - verifique a estratégia deles",
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
    body: "@archinect teve queda de 18% no engajamento essa semana - oportunidade para você",
    timeLabel: "1d",
    minutesAgo: 1440,
    read: true,
  },
  {
    type: "comment",
    category: "instagram",
    title: "Novo comentário",
    body: "@ana_arquitetura: \"Adorei o conteúdo sobre Revit 2026! Pode fazer mais?\"",
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
