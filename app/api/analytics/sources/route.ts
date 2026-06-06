/**
 * /api/analytics/sources
 *
 * GET    → retorna quais fontes estão disponíveis (instagram, metricool)
 * POST   → salva a chave do Metricool no user_metadata do usuário autenticado
 * DELETE → remove a chave do Metricool do user_metadata do usuário autenticado
 */

import { NextRequest, NextResponse } from "next/server"
import { getInstagramTokenStatus, type InstagramTokenState } from "@/lib/instagram-token-status"
import { createClient } from "@/lib/supabase/server"

type MetricoolSourcesResponse = {
  instagram: boolean
  metricool: boolean
  instagramStatus: InstagramSourceStatus
}

type MetricoolSourceBody = {
  metricoolApiKey?: string | null
}

type InstagramSourceStatus = {
  connected: boolean
  username: string | null
  expiresAt: string | null
  expiresInDays: number | null
  tokenState: InstagramTokenState
}

function getMetricoolApiKey(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null
  }

  const value = (metadata as Record<string, unknown>).metricool_api_key
  if (typeof value !== "string") {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

// ─── GET — verifica fontes disponíveis ────────────────────────────────────────

export async function GET(): Promise<
  NextResponse<MetricoolSourcesResponse | { error: string }>
> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let instagramStatus: InstagramSourceStatus = {
      connected: false,
      username: null,
      expiresAt: null,
      expiresInDays: null,
      tokenState: "disconnected",
    }

    if (user) {
      const { data } = await supabase
        .from("instagram_tokens")
        .select("instagram_username, expires_at")
        .eq("user_id", user.id)
        .maybeSingle()

      if (data) {
        const tokenState = getInstagramTokenStatus(data.expires_at)
        instagramStatus = {
          connected: true,
          username: data.instagram_username,
          expiresAt: data.expires_at,
          expiresInDays: tokenState.expiresInDays,
          tokenState: tokenState.tokenState,
        }
      }
    }

    const userMetricoolApiKey = getMetricoolApiKey(user?.user_metadata)
    const metricool = userMetricoolApiKey !== null || !!process.env.METRICOOL_API_KEY?.trim()

    return NextResponse.json({
      instagram: instagramStatus.connected,
      metricool,
      instagramStatus,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar fontes"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── POST — salva Metricool API key ──────────────────────────────────────────

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ ok: boolean } | { error: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    let body: MetricoolSourceBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

    const key = typeof body.metricoolApiKey === "string" ? body.metricoolApiKey.trim() : ""
    if (!key) {
      return NextResponse.json({ error: "Chave inválida" }, { status: 400 })
    }

    try {
      const testRes = await fetch("https://app.metricool.com/api/v2/user", {
        headers: { Authorization: `Bearer ${key}` },
      })

      if (testRes.status === 401) {
        return NextResponse.json(
          { error: "Chave de API inválida — verifique no painel da Metricool" },
          { status: 401 }
        )
      }
    } catch {
      // Mantém a gravação quando a validação não consegue completar por rede/time-out.
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { metricool_api_key: key },
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar chave do Metricool"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── DELETE — remove Metricool API key ───────────────────────────────────────

export async function DELETE(): Promise<NextResponse<{ ok: boolean } | { error: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { metricool_api_key: null },
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao remover chave do Metricool"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
