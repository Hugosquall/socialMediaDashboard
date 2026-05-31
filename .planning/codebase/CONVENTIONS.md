# Codebase Conventions Map

Generated: 2026-05-31

## Language And Type Style

- TypeScript strict mode is enabled in `tsconfig.json`.
- Imports use the `@/*` path alias for project files.
- Components generally use named exports, especially in `components/ui/` and `components/layout/`.
- Page files default-export the route component, matching Next.js conventions.
- Local helper types are often declared in the same page/route file.

## React Style

- Interactive pages use `"use client"` at the top.
- State is page-local with `useState`, `useEffect`, `useMemo`, and `useCallback`.
- No global state library is currently used.
- Larger pages define helper components in the same file before the main page component.
- Modal components are local to the page that uses them.

## Styling Style

- Tailwind classes are used inline.
- Theme colors are referenced through CSS variables, for example `text-[var(--foreground)]`.
- Layout uses responsive Tailwind prefixes such as `sm:` and `lg:`.
- Icons are usually from `lucide-react`.
- Some platform icons in `app/(dashboard)/competitors/page.tsx` are inline SVGs.

## UI Primitive Style

- UI primitives are manually implemented shadcn-style components.
- `components/ui/button.tsx`, `components/ui/card.tsx`, and `components/ui/badge.tsx` accept `className` overrides.
- `cn()` from `lib/utils.ts` is used to merge class strings.
- Variants are implemented with object literals rather than `class-variance-authority`.

## Supabase Usage

- Client components instantiate Supabase via `createClient()` from `lib/supabase/client.ts`.
- Server handlers instantiate Supabase via `await createClient()` from `lib/supabase/server.ts`.
- User ownership checks normally rely on `supabase.auth.getUser()` and RLS.
- Client-side queries often filter by `user_id` explicitly.

## API Error Handling

- API routes generally return `NextResponse.json({ error }, { status })`.
- Notifications have more structured helpers in `app/api/notifications/_errors.ts`.
- Analytics intentionally catches integration failures and falls through to the next source.
- Several route handlers log integration failures with `console.error`.

## Mock And Fallback Conventions

- Analytics uses deterministic mock data in `app/api/analytics/route.ts`.
- News uses mock items only when all RSS feeds fail in `app/api/news/route.ts`.
- Notifications seed demo notifications idempotently if the user's table has no rows.
- Several dashboard KPIs remain hardcoded in pages, especially overview and Instagram Manager.

## Documentation Conventions

- The project maintains both `README.md` and `CLAUDE.md`.
- `CLAUDE.md` is detailed and includes architecture notes, current state, and known placeholders.
- Operational instructions for notifications are separated into `docs/NOTIFICATIONS_RUNBOOK.md`.

## Testing Conventions

- Playwright tests prefer user-visible behavior over implementation details.
- Authenticated E2E tests are optional and skipped when `E2E_AUTH_EMAIL` or `E2E_AUTH_PASSWORD` are missing.
- Tests currently assert hardcoded branding text such as "Dashboard Sabrina".

## Change Conventions To Preserve

- Keep edits scoped to existing route/component patterns unless a service boundary clearly reduces repeated logic.
- Preserve Supabase RLS assumptions and always include authenticated user ownership in writes.
- Keep mock fallback behavior until real Instagram/Metricool setup is verified.
- For Phase 1 personalization, centralize brand config before broad string replacement.

