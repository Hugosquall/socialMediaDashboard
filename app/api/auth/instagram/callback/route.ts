/**
 * GET /api/auth/instagram/callback
 *
 * Recebe o code do Facebook Login, troca por token do Graph API, localiza uma
 * Pagina do Facebook vinculada a uma conta profissional do Instagram e salva o
 * token no Supabase para uso no Instagram Graph API.
 */
import { NextRequest, NextResponse } from "next/server"
import {
  FACEBOOK_INSTAGRAM_SCOPES,
  META_GRAPH_API_VERSION,
  getMetaAppCredentials,
} from "@/lib/instagram"
import { createClient } from "@/lib/supabase/server"

type FacebookTokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
}

type InstagramBusinessAccount = {
  id: string
  username?: string
}

type FacebookPage = {
  id: string
  name?: string
  access_token?: string
  instagram_business_account?: InstagramBusinessAccount
}

type FacebookPagesResponse = {
  data?: FacebookPage[]
}

function buildSettingsRedirect(siteUrl: string, error: string) {
  return NextResponse.redirect(`${siteUrl}/settings?instagram_error=${error}`)
}

async function fetchFacebookJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<T>
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error") ?? searchParams.get("error_reason")
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  if (error) {
    console.error(
      "[Instagram OAuth] authorization error:",
      searchParams.get("error_description") ?? searchParams.get("error_message") ?? error
    )
    return buildSettingsRedirect(siteUrl, "cancelled")
  }

  if (!code) {
    return buildSettingsRedirect(siteUrl, "no_code")
  }

  const receivedState = searchParams.get("state")
  const storedState = request.cookies.get("instagram_oauth_state")?.value

  if (!receivedState || !storedState || receivedState !== storedState) {
    return buildSettingsRedirect(siteUrl, "state_mismatch")
  }

  const { appId, appSecret } = getMetaAppCredentials()
  const redirectUri = `${siteUrl}/api/auth/instagram/callback`

  if (!appId || !appSecret) {
    console.error("[Instagram OAuth] missing META_APP_ID/META_APP_SECRET")
    return buildSettingsRedirect(siteUrl, "missing_credentials")
  }

  try {
    const tokenUrl =
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/oauth/access_token?` +
      new URLSearchParams({
        client_id:     appId,
        client_secret: appSecret,
        redirect_uri:  redirectUri,
        code,
      })

    const shortTokenData = await fetchFacebookJson<FacebookTokenResponse>(tokenUrl)
    if (!shortTokenData.access_token) {
      throw new Error("Facebook token exchange did not return access_token")
    }

    const longTokenUrl =
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/oauth/access_token?` +
      new URLSearchParams({
        grant_type:        "fb_exchange_token",
        client_id:         appId,
        client_secret:     appSecret,
        fb_exchange_token: shortTokenData.access_token,
      })

    const longTokenData = await fetchFacebookJson<FacebookTokenResponse>(longTokenUrl)
    const userAccessToken = longTokenData.access_token ?? shortTokenData.access_token
    const expiresIn = longTokenData.expires_in ?? shortTokenData.expires_in
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null

    const pagesUrl =
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/me/accounts?` +
      new URLSearchParams({
        fields:       "id,name,access_token,instagram_business_account{id,username}",
        limit:        "100",
        access_token: userAccessToken,
      })

    const pagesData = await fetchFacebookJson<FacebookPagesResponse>(pagesUrl)
    const pageWithInstagram = pagesData.data?.find(
      (page) => page.instagram_business_account?.id && page.access_token
    )

    if (!pageWithInstagram?.instagram_business_account?.id || !pageWithInstagram.access_token) {
      console.error("[Instagram OAuth] no page with instagram_business_account returned")
      return buildSettingsRedirect(siteUrl, "no_page")
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${siteUrl}/login?next=/settings`)
    }

    const instagramAccount = pageWithInstagram.instagram_business_account
    const { error: dbError } = await supabase
      .from("instagram_tokens")
      .upsert(
        {
          user_id:            user.id,
          instagram_user_id:  instagramAccount.id,
          instagram_username: instagramAccount.username ?? pageWithInstagram.name ?? null,
          access_token:       pageWithInstagram.access_token,
          expires_at:         expiresAt,
          scope:              FACEBOOK_INSTAGRAM_SCOPES,
        },
        { onConflict: "user_id" }
      )

    if (dbError) {
      throw new Error(`DB error: ${dbError.message}`)
    }

    const response = NextResponse.redirect(`${siteUrl}/settings?instagram_connected=true`)
    response.cookies.delete("instagram_oauth_state")

    return response
  } catch (err) {
    console.error("[Instagram OAuth] unexpected error:", err)
    return buildSettingsRedirect(siteUrl, "server_error")
  }
}
