import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

import {
  resolveNotificationsHealthError,
} from "../_errors"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        status: "unauthenticated",
        message: "Não autenticado",
      },
      { status: 401 }
    )
  }

  try {
    const { error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .limit(1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
      status: "ready",
      message: "A tabela de notificações está pronta para uso.",
    })
  } catch (error) {
    const resolved = resolveNotificationsHealthError(error, "Falha ao verificar notificações")
    return NextResponse.json(resolved.body, { status: resolved.status })
  }
}
