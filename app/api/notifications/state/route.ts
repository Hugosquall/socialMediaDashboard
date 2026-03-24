import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

import {
  listUserNotifications,
} from "../_shared"
import {
  jsonError,
  resolveNotificationsError,
} from "../_errors"

type NotificationStateAction = "mark_read" | "dismiss" | "mark_all_read"

interface NotificationStateBody {
  action?: NotificationStateAction
  id?: string
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError(401, "Não autenticado")
  }

  let body: NotificationStateBody
  try {
    body = (await request.json()) as NotificationStateBody
  } catch {
    return jsonError(400, "JSON inválido")
  }

  const now = new Date().toISOString()

  try {
    if (body.action === "mark_all_read") {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: now })
        .eq("user_id", user.id)
        .is("dismissed_at", null)
        .is("read_at", null)

      if (error) {
        throw error
      }

      const notifications = await listUserNotifications(supabase, user.id)
      return NextResponse.json({ notifications })
    }

    if (!body.id) {
      return jsonError(400, "id é obrigatório")
    }

    if (body.action === "mark_read") {
      const { data, error } = await supabase
        .from("notifications")
        .update({ read_at: now })
        .eq("id", body.id)
        .eq("user_id", user.id)
        .is("dismissed_at", null)
        .select("id")
        .maybeSingle()

      if (error) {
        throw error
      }
      if (!data) {
        return jsonError(404, "Notificação não encontrada")
      }
    } else if (body.action === "dismiss") {
      const { data, error } = await supabase
        .from("notifications")
        .update({ dismissed_at: now })
        .eq("id", body.id)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle()

      if (error) {
        throw error
      }
      if (!data) {
        return jsonError(404, "Notificação não encontrada")
      }
    } else {
      return jsonError(400, "Ação inválida")
    }

    const notifications = await listUserNotifications(supabase, user.id)
    return NextResponse.json({ notifications })
  } catch (error) {
    const resolved = resolveNotificationsError(error, "Falha ao atualizar notificações")
    return jsonError(resolved.status, resolved.body.error, resolved.body.code)
  }
}
