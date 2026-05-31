# Codebase Architecture Map

Generated: 2026-05-31

## Application Shape

- The project is a Next.js App Router dashboard.
- Routes are colocated under `app/`.
- Dashboard pages are grouped under `app/(dashboard)/` to share shell layout without adding a URL prefix.
- Server APIs are implemented as App Router route handlers under `app/api/**/route.ts`.
- Client-heavy dashboard pages use `"use client"` and fetch directly from Supabase or local API routes.

## Entry Points

- Root HTML shell: `app/layout.tsx`
- Root URL redirect: `app/page.tsx`
- Dashboard group layout: `app/(dashboard)/layout.tsx`
- Login page: `app/login/page.tsx`
- Route protection/session refresh: `proxy.ts`
- Primary authenticated destination after login: `/instagram`

## Layout Flow

- `app/(dashboard)/layout.tsx` renders `DashboardShell`.
- `components/layout/dashboard-shell.tsx` composes:
  - `Sidebar`
  - `Topbar`
  - scrollable `<main>`
- `components/layout/sidebar.tsx` owns navigation, active route styling, mobile drawer state callbacks, and logout.
- `components/layout/topbar.tsx` maps current pathname to page title/description.

## Auth Flow

- `proxy.ts` runs for nearly all routes except static assets.
- Public routes are currently `/login` and `/api/auth/instagram/callback`.
- If Supabase env vars are missing, protected routes redirect to `/login?supabase_error=missing_env`.
- If a user session is absent on a protected route, request redirects to `/login`.
- Login/signup is entirely client-side in `app/login/page.tsx`.

## Data Flow Pattern

- Some pages call Supabase directly from client components:
  - `app/(dashboard)/instagram/page.tsx`
  - `app/(dashboard)/calendar/page.tsx`
  - `app/(dashboard)/competitors/page.tsx`
  - `app/(dashboard)/settings/page.tsx`
- Some pages consume internal API routes:
  - `app/(dashboard)/analytics/page.tsx` fetches `/api/analytics`
  - `components/news/news-feed.tsx` fetches `/api/news`
  - `app/(dashboard)/notifications/page.tsx` fetches `/api/notifications/**`
- API routes use the server Supabase client to access auth cookies and private env vars.

## Domain Boundaries

- Instagram content planning:
  - UI and CRUD: `app/(dashboard)/instagram/page.tsx`
  - Shared calendar view: `app/(dashboard)/calendar/page.tsx`
  - Data table: `posts`
- Analytics:
  - UI charts: `app/(dashboard)/analytics/page.tsx`
  - Data source cascade: `app/api/analytics/route.ts`
  - Source config: `app/api/analytics/sources/route.ts`
- Competitors:
  - UI and persistence: `app/(dashboard)/competitors/page.tsx`
  - Data table: `competitors`
- Notifications:
  - UI: `app/(dashboard)/notifications/page.tsx`
  - API: `app/api/notifications/**`
  - Data table: `notifications`
- Settings:
  - Profile, integrations, notification preferences, exports, API token in `app/(dashboard)/settings/page.tsx`

## Database Ownership

- Tables are user-owned through `user_id` or `id` matching `auth.users`.
- RLS policies enforce user isolation.
- The app is currently single-tenant by user, not workspace/brand based.
- This supports the user's current goal of managing one Instagram profile.
- Future white-label/workspace support would require a new ownership boundary, but it is intentionally out of current scope.

## Rendering And Caching

- Dashboard layout exports `dynamic = "force-dynamic"` to avoid static prerendering authenticated pages.
- `/api/news` exports `revalidate = 1800`, but the client fetch uses `cache: "no-store"`, so the browser component requests fresh data.
- Most dashboard data is loaded client-side after initial render.

## Current Architectural Risks

- `app/page.tsx` and `app/(dashboard)/page.tsx` both target the `/` route. This should be resolved before significant feature work.
- Business logic is mostly embedded in page components, especially `instagram/page.tsx`, `competitors/page.tsx`, and `settings/page.tsx`.
- Instagram API version and permission model are hardcoded in route handlers rather than isolated behind a service layer.
- There is no central app/brand config, which makes Phase 1 personalization more scattered than necessary.

