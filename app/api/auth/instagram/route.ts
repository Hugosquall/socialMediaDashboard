/**
 * GET /api/auth/instagram
 * Redireciona o usuário para o fluxo OAuth do Instagram (Meta).
 *
 * Escopos solicitados:
 *  - instagram_business_basic           -> username e mídia de contas profissionais
 *  - instagram_business_manage_insights -> métricas de alcance/impressões
 */
import { NextResponse } from "next/server"
import { INSTAGRAM_SCOPES } from "@/lib/instagram"

export async function GET() {
  const appId       = process.env.INSTAGRAM_APP_ID
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const redirectUri = `${siteUrl}/api/auth/instagram/callback`

  if (!appId) {
    return NextResponse.json(
      { error: "INSTAGRAM_APP_ID não configurado em .env.local" },
      { status: 500 }
    )
  }

  const params = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  redirectUri,
    scope:         INSTAGRAM_SCOPES,
    response_type: "code",
  })

  const authUrl = `https://api.instagram.com/oauth/authorize?${params}`
  return NextResponse.redirect(authUrl)
}
