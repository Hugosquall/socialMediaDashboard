# Codebase Stack Map

Generated: 2026-05-31

## Runtime

- Project root: `/Users/hugogoncalves/PRJ/hugo/dashboardMedia/socialMediaDashboard`
- Package manager: npm, with lockfile at `package-lock.json`
- Node target in CI: Node.js 20 via `.github/workflows/ci.yml`
- Main scripts in `package.json`:
  - `npm run dev`: starts Next.js dev server
  - `npm run build`: production Next.js build
  - `npm run start`: starts built app
  - `npm run lint`: runs ESLint
  - `npm run e2e`: runs Playwright tests

## Frameworks

- Next.js `16.2.1` with App Router under `app/`
- React `19.2.4` and React DOM `19.2.4`
- TypeScript `5.x`, strict mode enabled in `tsconfig.json`
- Tailwind CSS v4 via `@tailwindcss/postcss` and CSS variables in `app/globals.css`
- Turbopack root is pinned in `next.config.ts`

## UI Dependencies

- `lucide-react` provides most icons in dashboard pages and layout.
- `recharts` powers analytics charts in `app/(dashboard)/analytics/page.tsx`.
- `@radix-ui/react-slot`, `@radix-ui/react-separator`, and `@radix-ui/react-tooltip` are available, though UI primitives are mostly hand-rolled.
- `clsx` and `tailwind-merge` are wrapped by `cn()` in `lib/utils.ts`.
- Local shadcn-style primitives live in:
  - `components/ui/button.tsx`
  - `components/ui/badge.tsx`
  - `components/ui/card.tsx`

## Data And Auth Dependencies

- Supabase client libraries:
  - `@supabase/supabase-js`
  - `@supabase/ssr`
- Browser client factory: `lib/supabase/client.ts`
- Server client factory: `lib/supabase/server.ts`
- Database types: `lib/database.types.ts`
- Route protection/session refresh: `proxy.ts`

## Content And Feed Dependencies

- `rss-parser` is used by `app/api/news/route.ts` to aggregate architecture/construction feeds.
- News responses are normalized into `NewsItem` records and consumed by `components/news/news-feed.tsx`.

## Tooling

- ESLint 9 with Next core web vitals and TypeScript configs in `eslint.config.mjs`.
- Playwright `@playwright/test` for browser E2E tests in `tests/e2e/`.
- `playwright.config.ts` starts `npm run dev` automatically on `http://localhost:3000`.

## Environment Variables

- Required:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional/current integrations:
  - `INSTAGRAM_APP_ID`
  - `INSTAGRAM_APP_SECRET`
  - `METRICOOL_API_KEY`
  - `NEXT_PUBLIC_SITE_URL`
- Example env file: `.env.example`

## Styling System

- Global theme and design tokens are declared in `app/globals.css`.
- Root layout forces dark mode via `className="dark"` in `app/layout.tsx`.
- Tailwind classes reference CSS variables directly, for example `bg-[var(--background)]`.

