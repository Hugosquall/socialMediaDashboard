# Phase 1: Personal Profile Foundation - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Finish converting the cloned dashboard into a clean personal Instagram dashboard foundation. This phase covers branding, env/setup safety, removal of inherited demo values, root route cleanup and baseline verification only. Instagram publishing, token lifecycle hardening and media workflow belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### Branding and profile identity
- **D-01:** Keep one central brand config in `lib/brand.ts` rather than scattering literals across pages.
- **D-02:** Default values should be generic: `Instagram Dashboard`, `Meu Instagram`, `@seu_perfil`, and `Content Manager`.
- **D-03:** Branding should be overridable through `NEXT_PUBLIC_*` env vars so the user can personalize without code edits.
- **D-04:** Avoid introducing white-label/workspace abstractions in this phase.

### Demo data and empty states
- **D-05:** Replace fake follower numbers such as `48.2K` with honest "Conectar" / "Instagram pendente" states.
- **D-06:** Keep mock analytics/news fallbacks for dev resilience, but never present mock KPIs as the user's real account.
- **D-07:** Setup docs should explain when data is mock versus live.

### Setup and safety
- **D-08:** `.env.example` must not contain real-looking app IDs, app secrets, API keys or tokens.
- **D-09:** README/setup docs should explicitly call out Supabase env vars, branding env vars, Meta app values and bucket setup.
- **D-10:** Preserve the existing missing-Supabase-env behavior that routes to `/login?supabase_error=missing_env`.

### Routing and baseline verification
- **D-11:** The dashboard overview route should live only in `app/(dashboard)/page.tsx`; duplicate `app/page.tsx` should stay removed.
- **D-12:** Phase completion requires `npm run lint`, `npm run build`, and unauthenticated smoke E2E passing.
- **D-13:** Tests should assert configurable default branding (`Instagram Dashboard`) rather than old project branding.

### Claude's Discretion
- Exact Portuguese wording in setup docs.
- Whether to add a small "how to personalize" section to README or keep it in `.env.example`.
- Minor UI copy for "pending integration" states.

</decisions>

<specifics>
## Specific Ideas

- The current product direction is personal use first, not white-label.
- White-label/multi-client support is captured separately as backlog `999.1`.
- The first implementation pass already removed major "Sabrina" strings, sanitized `.env.example`, added `lib/brand.ts`, removed duplicate root route and updated smoke tests.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — Project goal, active requirements and out-of-scope boundaries.
- `.planning/REQUIREMENTS.md` — Phase 1 requirement IDs and traceability.
- `.planning/ROADMAP.md` — Phase 1 boundary and success criteria.

### Codebase map
- `.planning/codebase/STACK.md` — Runtime, framework and tooling.
- `.planning/codebase/STRUCTURE.md` — Route/component/file layout.
- `.planning/codebase/CONCERNS.md` — Existing risks, including branding scatter and env secret exposure.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/brand.ts`: central brand config and initials helper.
- `components/layout/sidebar.tsx`: main visible brand area in authenticated layout.
- `app/login/page.tsx`: public login brand entry point.
- `components/ui/card.tsx`, `button.tsx`, `badge.tsx`: existing UI primitives to preserve.

### Established Patterns
- App Router route groups under `app/(dashboard)/`.
- Client-side Supabase data access in interactive dashboard pages.
- API routes under `app/api/**/route.ts`.
- Tailwind v4 CSS-variable styling through `app/globals.css`.
- Playwright smoke tests in `tests/e2e/`.

### Integration Points
- `.env.example` and README setup instructions define local/prod configuration.
- `proxy.ts` controls unauthenticated redirects and missing Supabase env behavior.
- `app/layout.tsx` controls root metadata.
- `app/(dashboard)/page.tsx` and `app/(dashboard)/instagram/page.tsx` contain current KPI placeholders.

</code_context>

<deferred>
## Deferred Ideas

- Instagram token expiry/refresh UI — Phase 2.
- Media upload, preview and publish/sync lifecycle — Phase 3.
- Real analytics source hardening and report exports — Phase 4.
- White-label/workspace support — Backlog `999.1`.

</deferred>

---

*Phase: 01-personal-profile-foundation*
*Context gathered: 2026-05-31*

