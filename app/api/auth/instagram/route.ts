/**
 * GET /api/auth/instagram
 * Redireciona o usuário para o fluxo OAuth do Instagram (Meta).
 *
 * Escopos solicitados:
 *  - instagram_business_basic           -> username e mídia de contas profissionais
 *  - instagram_business_manage_messages -> mensagens de contas profissionais
 *  - instagram_business_manage_comments -> comentários de contas profissionais
 *  - instagram_business_content_publish -> publicação de conteúdo
 *  - instagram_business_manage_insights -> métricas de alcance/impressões
 */
import { NextResponse } from "next/server"
import { INSTAGRAM_SCOPES } from "@/lib/instagram"

export async function GET() {
  const appId       = process.env.INSTAGRAM_APP_ID
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const redirectUri = `${siteUrl}/api/auth/instagram/callback`

  if (!appId) {
    console.error("[Instagram OAuth] missing INSTAGRAM_APP_ID")

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
    force_reauth:  "true",
  })

  const authUrl = `https://www.instagram.com/oauth/authorize?${params}`
  console.info("[Instagram OAuth] redirecting to Instagram", {
    redirectUri,
    scope: INSTAGRAM_SCOPES,
  })

  return NextResponse.redirect(authUrl)
}
