import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

import {
  buildSeedNotifications,
  listUserNotifications,
} from "./_shared"
import {
  jsonError,
  resolveNotificationsError,
} from "./_errors"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError(401, "Não autenticado")
  }

  try {
    const notifications = await listUserNotifications(supabase, user.id)
    return NextResponse.json({ notifications })
  } catch (error) {
    const resolved = resolveNotificationsError(error, "Falha ao listar notificações")
    return jsonError(resolved.status, resolved.body.error, resolved.body.code)
  }
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError(401, "Não autenticado")
  }

  try {
    const { count, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      throw countError
    }

    if ((count ?? 0) === 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(buildSeedNotifications(user.id))

      if (insertError) {
        throw insertError
      }
    }

    const notifications = await listUserNotifications(supabase, user.id)
    return NextResponse.json({ notifications })
  } catch (error) {
    const resolved = resolveNotificationsError(error, "Falha ao inicializar notificações")
    return jsonError(resolved.status, resolved.body.error, resolved.body.code)
  }
}
