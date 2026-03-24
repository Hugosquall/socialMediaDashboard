/**
 * GET /api/auth/instagram/callback
 * Recebe o código OAuth do Instagram, troca por access token de longa duração
 * e salva no banco Supabase na tabela instagram_tokens.
 *
 * Fluxo:
 *  1. Instagram redireciona aqui com ?code=XXX
 *  2. Trocamos o code por short-lived token (POST /oauth/access_token)
 *  3. Trocamos short-lived por long-lived token (GET /access_token)
 *  4. Buscamos username do usuário Instagram
 *  5. Salvamos/atualizamos em instagram_tokens
 *  6. Redirecionamos para /settings com mensagem de sucesso
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code    = searchParams.get("code")
  const error   = searchParams.get("error")
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  // ── Erro retornado pelo Instagram ──────────────────────────────────────────
  if (error) {
    console.error("[Instagram OAuth] Erro:", searchParams.get("error_description"))
    return NextResponse.redirect(`${siteUrl}/settings?instagram_error=cancelled`)
  }

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/settings?instagram_error=no_code`)
  }

  const appId       = process.env.INSTAGRAM_APP_ID!
  const appSecret   = process.env.INSTAGRAM_APP_SECRET!
  const redirectUri = `${siteUrl}/api/auth/instagram/callback`

  try {
    // ── 1. Trocar code por short-lived token ──────────────────────────────────
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     appId,
        client_secret: appSecret,
        grant_type:    "authorization_code",
        redirect_uri:  redirectUri,
        code,
      }),
    })

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${await tokenRes.text()}`)
    }

    const { access_token: shortToken, user_id: instagramUserId } =
      (await tokenRes.json()) as { access_token: string; user_id: string }

    // ── 2. Trocar por long-lived token (válido 60 dias) ───────────────────────
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?` +
        new URLSearchParams({
          grant_type:    "ig_exchange_token",
          client_id:     appId,
          client_secret: appSecret,
          access_token:  shortToken,
        })
    )

    if (!longTokenRes.ok) {
      throw new Error(`Long token exchange failed: ${await longTokenRes.text()}`)
    }

    const { access_token: longToken, expires_in } =
      (await longTokenRes.json()) as { access_token: string; expires_in: number }

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // ── 3. Buscar username do Instagram ───────────────────────────────────────
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${longToken}`
    )
    const { username: instagramUsername } =
      (await profileRes.json()) as { id: string; username: string }

    // ── 4. Salvar no Supabase ─────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${siteUrl}/login?next=/settings`)
    }

    const { error: dbError } = await supabase
      .from("instagram_tokens")
      .upsert(
        {
          user_id:             user.id,
          instagram_user_id:   instagramUserId.toString(),
          instagram_username:  instagramUsername,
          access_token:        longToken,
          expires_at:          expiresAt,
          scope:               "user_profile,user_media",
        },
        { onConflict: "user_id" }
      )

    if (dbError) {
      throw new Error(`DB error: ${dbError.message}`)
    }

    // ── 5. Redirecionar com sucesso ───────────────────────────────────────────
    return NextResponse.redirect(`${siteUrl}/settings?instagram_connected=true`)

  } catch (err) {
    console.error("[Instagram OAuth] Erro inesperado:", err)
    return NextResponse.redirect(`${siteUrl}/settings?instagram_error=server_error`)
  }
}
