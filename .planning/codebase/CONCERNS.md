# Codebase Concerns Map

Generated: 2026-05-31

## High Priority Concerns

- `app/page.tsx` and `app/(dashboard)/page.tsx` both map to `/`. This route conflict should be resolved before larger changes.
- `.env.example` contains non-empty Instagram app credential values. Treat them as exposed, rotate them in Meta, and replace with empty placeholders.
- Branding is hardcoded in `app/layout.tsx`, `app/login/page.tsx`, `components/layout/sidebar.tsx`, `README.md`, `CLAUDE.md`, `INSTAGRAM_SETUP.md`, and tests.
- Instagram OAuth scopes/API paths may not match the current production permission model needed for insights and publishing. Verify against Meta before relying on it.
- There is no Instagram publishing implementation yet, so the current app is a content planner/analytics dashboard, not a full publishing manager.

## Data Model Concerns

- `posts` has `media_url`, metrics columns, and `instagram_post_id`, but the UI does not yet handle media upload or publication state from Instagram.
- `instagram_tokens` stores access tokens but there is no scheduled refresh or expiry warning flow.
- Notification preferences are stored in auth metadata rather than a dedicated table.
- App API tokens are stored in auth metadata and returned in clear text by `GET /api/settings/api-token`.

## Security Concerns

- Keep Supabase env vars out of client code except the public URL and anon key.
- OAuth callback relies on an authenticated Supabase session at callback time; this may fail if cookies are not preserved through the Instagram auth flow.
- Missing Instagram deauthorization and data deletion callbacks are referenced in setup docs but not implemented.
- Any future media publishing endpoint must validate user ownership, media URL safety, and post status transitions.
- Generated app tokens should be hashed if they become real API credentials.

## Product Concerns For User Goal

- The UI is still branded for "Sabrina" rather than the user's Instagram.
- KPI values such as "48.2K" are placeholders and need replacement with real profile/account metrics.
- Competitor tracker persists handles but does not fetch official competitor metrics from Instagram, which is limited by Meta APIs.
- The app lacks a media library, preview, approval workflow, and publish/schedule pipeline.
- The current app does not clearly distinguish "planned in dashboard" from "published on Instagram".

## Maintainability Concerns

- `app/(dashboard)/settings/page.tsx` is very large and mixes profile, integrations, notification preferences, data export, and token UI.
- `app/(dashboard)/competitors/page.tsx` contains UI, mapping, sorting, SVG icons, modal logic, and persistence in one file.
- `app/api/analytics/route.ts` mixes mock generation, Instagram calls, Metricool calls, and response orchestration.
- Extracting `lib/instagram/*`, `lib/analytics/*`, and `lib/brand/*` would reduce risk for Phase 1 and Phase 2.

## Performance Concerns

- Client pages fetch data after render, which is acceptable for now but creates loading states on every visit.
- Analytics top posts fetch media insights sequentially inside a loop.
- News route attempts several RSS feeds in parallel and silently ignores failures, which is acceptable but limits observability.

## Suggested Early Fix Order

1. Remove exposed example credentials and rotate the Meta app secret.
2. Resolve root route conflict.
3. Add centralized brand/profile config.
4. Replace hardcoded user/profile/KPI display with Supabase profile and Instagram source data.
5. Extract Instagram integration service before adding publishing.
6. Add media upload/storage and post lifecycle fields needed for real publishing.

## Deferred Historical Note

- White-label/workspace support is explicitly deferred. Current work should focus on the user's own Instagram profile first, while avoiding choices that make a future workspace model impossible.

