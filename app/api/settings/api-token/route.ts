import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

type ApiTokenResponse = {
  hasToken: boolean
  maskedToken: string | null
  token: string | null
}

function maskToken(token: string): string {
  if (token.length <= 8) {
    return "********"
  }

  const prefix = token.slice(0, 6)
  const suffix = token.slice(-4)
  const middleLength = Math.max(8, token.length - prefix.length - suffix.length)

  return `${prefix}${"*".repeat(middleLength)}${suffix}`
}

function generateApiToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const randomPart = Buffer.from(bytes).toString("base64url")
  return `sk_live_${randomPart}`
}

export async function GET(): Promise<NextResponse<ApiTokenResponse | { error: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const metadata = user.user_metadata as Record<string, unknown> | null | undefined
    const apiToken = typeof metadata?.api_token === "string" ? metadata.api_token : null

    return NextResponse.json({
      hasToken: apiToken !== null,
      maskedToken: apiToken ? maskToken(apiToken) : null,
      token: apiToken,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar token"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(): Promise<NextResponse<ApiTokenResponse | { error: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const apiToken = generateApiToken()
    const { error: updateError } = await supabase.auth.updateUser({
      data: { api_token: apiToken },
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      hasToken: true,
      maskedToken: maskToken(apiToken),
      token: apiToken,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao regenerar token"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
