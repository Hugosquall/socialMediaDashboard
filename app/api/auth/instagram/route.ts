/**
 * GET /api/auth/instagram
 * Redireciona o usuário para Facebook Login.
 *
 * O Instagram Graph API via Facebook Login resolve a conta profissional a partir
 * de uma Página do Facebook vinculada ao perfil do Instagram.
 */
import { NextResponse } from "next/server"
import {
  FACEBOOK_INSTAGRAM_SCOPES,
  META_GRAPH_API_VERSION,
  getMetaAppCredentials,
} from "@/lib/instagram"

export async function GET() {
  const { appId } = getMetaAppCredentials()
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const redirectUri = `${siteUrl}/api/auth/instagram/callback`

  if (!appId) {
    console.error("[Instagram OAuth] missing META_APP_ID/INSTAGRAM_APP_ID")

    return NextResponse.json(
      { error: "META_APP_ID não configurado em .env.local" },
      { status: 500 }
    )
  }

  const state = crypto.randomUUID()
  const params = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  redirectUri,
    scope:         FACEBOOK_INSTAGRAM_SCOPES,
    response_type: "code",
    auth_type:     "rerequest",
    state,
  })

  const authUrl = `https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth?${params}`
  console.info("[Instagram OAuth] redirecting to Facebook Login", {
    redirectUri,
    scope: FACEBOOK_INSTAGRAM_SCOPES,
  })

  const response = NextResponse.redirect(authUrl)
  response.cookies.set("instagram_oauth_state", state, {
    httpOnly: true,
    maxAge:   600,
    path:     "/",
    sameSite: "lax",
    secure:   siteUrl.startsWith("https://"),
  })

  return response
}
