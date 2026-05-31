# Codebase Integrations Map

Generated: 2026-05-31

## Supabase

- Supabase is the primary auth and persistence provider.
- Client component access uses `createClient()` from `lib/supabase/client.ts`.
- Server/API access uses async `createClient()` from `lib/supabase/server.ts`.
- Session refresh and route protection are centralized in `proxy.ts`.
- Required env vars are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Supabase Auth

- Login/signup UI is implemented in `app/login/page.tsx`.
- Login uses `supabase.auth.signInWithPassword`.
- Signup uses `supabase.auth.signUp` and stores a basic `name` in auth metadata.
- Logout is handled in `components/layout/sidebar.tsx` via `supabase.auth.signOut`.
- API routes generally call `supabase.auth.getUser()` before accessing user data.

## Supabase Database

- Migrations live in `supabase/migrations/`.
- Core tables are created in `supabase/migrations/20260324180000_create_core_tables.sql`:
  - `profiles`
  - `posts`
  - `instagram_tokens`
  - `competitors`
- Notifications table is created in `supabase/migrations/20260324000000_create_notifications.sql`.
- RLS is enabled for user-owned tables, using `auth.uid()` checks.

## Supabase Storage

- Avatar upload uses the `avatars` bucket in `app/(dashboard)/settings/page.tsx`.
- Upload path format is `${userId}/avatar.${extension}`.
- The app expects public URLs from `supabase.storage.from("avatars").getPublicUrl(...)`.
- The bucket creation is not represented in the SQL migrations, so environment setup must include it.

## Instagram OAuth

- Start route: `app/api/auth/instagram/route.ts`
- Callback route: `app/api/auth/instagram/callback/route.ts`
- Current flow:
  - redirects to `https://api.instagram.com/oauth/authorize`
  - exchanges `code` for short-lived token
  - exchanges short-lived token for long-lived token
  - fetches username from `https://graph.instagram.com/me`
  - upserts token into `instagram_tokens`
- Token table stores `instagram_user_id`, `instagram_username`, `access_token`, `expires_at`, and `scope`.

## Instagram Analytics

- Analytics endpoint: `app/api/analytics/route.ts`
- Priority order:
  - Instagram token from `instagram_tokens`
  - Metricool key from auth metadata or env
  - deterministic mock data
- Instagram API calls currently use `graph.instagram.com/v19.0`.
- The endpoint attempts account insights, profile followers, media list, and media insights.

## Metricool

- Source management endpoint: `app/api/analytics/sources/route.ts`
- User-provided Metricool key is stored in Supabase Auth `user_metadata.metricool_api_key`.
- Env fallback is `METRICOOL_API_KEY`.
- Validation calls `https://app.metricool.com/api/v2/user`.
- Analytics calls use `https://app.metricool.com/api/v2/stats/evolution` and `https://app.metricool.com/api/v2/posts/best`.

## RSS News Feeds

- RSS integration lives in `app/api/news/route.ts`.
- Current feeds:
  - ArchDaily
  - ArchDaily Brasil
  - Dezeen
  - Archinect
  - Bustler
- The route deduplicates by title, classifies topics by keywords, marks the newest two items as trending, and falls back to mock news when all feeds fail.

## Export APIs

- Posts JSON export: `app/api/export/posts/route.ts`
- Analytics CSV export: `app/api/export/analytics/route.ts`
- Both depend on the authenticated Supabase session.
- Analytics export forwards cookies to `/api/analytics`.

## API Token

- Token endpoint: `app/api/settings/api-token/route.ts`
- Generated token is stored in Supabase Auth `user_metadata.api_token`.
- Token format is `sk_live_...`; it is not a Stripe token, only an app-generated credential.

## Missing Or Incomplete Integration Pieces

- No production publishing route exists for Instagram Content Publishing API yet.
- No media upload/storage model exists for posts beyond optional `media_url` in the database.
- No token refresh scheduler exists for Instagram long-lived tokens.
- No webhook handlers exist for Instagram comments, mentions, deauthorization, or data deletion.
- `.env.example` contains non-empty Instagram app values and should be sanitized before sharing.

