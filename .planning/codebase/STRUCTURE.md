# Codebase Structure Map

Generated: 2026-05-31

## Top-Level Layout

- `app/`: Next.js App Router pages and API routes
- `components/`: reusable UI, layout, and news components
- `lib/`: Supabase clients, generated database types, utility helpers
- `supabase/migrations/`: SQL migrations and down migrations
- `tests/e2e/`: Playwright E2E tests
- `docs/`: operational docs, currently notifications runbook
- `public/`: static SVG assets
- `.github/workflows/`: CI configuration

## App Routes

- `app/layout.tsx`: root layout, metadata, fonts, forced dark mode
- `app/page.tsx`: redirects root URL to `/instagram`
- `app/login/page.tsx`: login/signup page
- `app/(dashboard)/layout.tsx`: authenticated dashboard shell wrapper
- `app/(dashboard)/page.tsx`: overview dashboard content
- `app/(dashboard)/instagram/page.tsx`: Instagram Manager
- `app/(dashboard)/analytics/page.tsx`: analytics dashboard
- `app/(dashboard)/calendar/page.tsx`: content calendar
- `app/(dashboard)/competitors/page.tsx`: competitor tracker
- `app/(dashboard)/news/page.tsx`: news page wrapper
- `app/(dashboard)/notifications/page.tsx`: notifications center
- `app/(dashboard)/settings/page.tsx`: settings tabs

## API Routes

- `app/api/auth/instagram/route.ts`: starts Instagram OAuth
- `app/api/auth/instagram/callback/route.ts`: handles OAuth callback and token persistence
- `app/api/analytics/route.ts`: analytics source cascade
- `app/api/analytics/sources/route.ts`: checks/saves/removes Metricool source
- `app/api/news/route.ts`: RSS aggregation
- `app/api/notifications/route.ts`: list and seed notifications
- `app/api/notifications/state/route.ts`: mark read, mark all read, dismiss
- `app/api/notifications/health/route.ts`: table readiness check
- `app/api/export/posts/route.ts`: JSON export
- `app/api/export/analytics/route.ts`: CSV export
- `app/api/settings/api-token/route.ts`: app API token management

## Component Structure

- `components/layout/dashboard-shell.tsx`: high-level dashboard frame
- `components/layout/sidebar.tsx`: navigation, mobile menu panel, logout
- `components/layout/topbar.tsx`: route title, search placeholder, notification button
- `components/news/news-feed.tsx`: client UI for news aggregation
- `components/ui/button.tsx`: local button primitive
- `components/ui/badge.tsx`: local badge primitive
- `components/ui/card.tsx`: local card primitive

## Library Structure

- `lib/supabase/client.ts`: browser Supabase client factory
- `lib/supabase/server.ts`: server Supabase client factory using Next cookies
- `lib/database.types.ts`: generated Supabase table typings
- `lib/utils.ts`: `cn()` helper

## Supabase Structure

- `supabase/migrations/20260324180000_create_core_tables.sql`: core schema, triggers, indexes, RLS
- `supabase/migrations/20260324000000_create_notifications.sql`: notifications schema and RLS
- `supabase/migrations/20260324171000_fix_handle_new_user_bio.sql`: profile trigger fix
- Matching `.down.sql` files exist for rollback.

## Test Structure

- `tests/e2e/smoke.spec.ts`: app smoke/login visibility behavior
- `tests/e2e/auth.spec.ts`: unauthenticated protection and login/signup UI
- `tests/e2e/api-sources.spec.ts`: unauthenticated API protection for analytics sources
- `tests/e2e/authenticated.spec.ts`: optional authenticated calendar navigation

## Documentation Structure

- `README.md`: developer overview
- `CLAUDE.md`: detailed technical project context
- `INSTAGRAM_SETUP.md`: Meta/Instagram setup notes
- `docs/NOTIFICATIONS_RUNBOOK.md`: notifications migration/health runbook
- `AGENTS.md`: agent-facing repo guidance

## Naming Conventions

- Next route files follow App Router names: `page.tsx`, `layout.tsx`, `route.ts`.
- UI components use lowercase filenames and named exports.
- API helper files under notifications use underscore prefix, for example `app/api/notifications/_shared.ts`.
- Database table names are plural lowercase: `posts`, `profiles`, `competitors`.

## Structure Issues To Fix Early

- Root route conflict: `app/page.tsx` and `app/(dashboard)/page.tsx` both correspond to `/`.
- Branding is scattered across page/layout/test/documentation files.
- Domain logic is embedded in page files rather than in reusable services under `lib/`.
- There is no `lib/instagram/` or `lib/analytics/` boundary yet.

