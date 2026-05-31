# Phase 1: Personal Profile Foundation - Discussion Log

**Gathered:** 2026-05-31
**Mode:** Auto-captured from `/gsd-next` routing and prior user decisions.

## Inputs

- User goal: focus on Phase 1 and Phase 2 for their own Instagram profile.
- User explicitly deferred white-label to history/backlog for later.
- Prior work completed before this context:
  - `gsd-map-codebase`
  - backlog item `999.1`
  - initial branding cleanup and push

## Areas Resolved

### Branding and profile identity

Options considered:
- Central env-backed config
- Hardcoded replacement strings
- White-label/workspace abstraction

Decision:
- Use central env-backed config in `lib/brand.ts`.
- Avoid white-label abstractions in Phase 1.

### Demo data and empty states

Options considered:
- Keep fake KPI numbers until live data exists
- Replace fake KPIs with neutral pending states
- Block the UI until Instagram is connected

Decision:
- Replace fake KPIs with neutral pending/connect states.
- Keep mock fallbacks only where explicitly labeled.

### Setup and safety

Options considered:
- Keep existing `.env.example`
- Sanitize secrets and expand setup variables

Decision:
- Sanitize all example secrets.
- Include branding env vars and clear integration placeholders.

### Routing and validation

Options considered:
- Keep `app/page.tsx` redirect
- Use only route group home at `app/(dashboard)/page.tsx`

Decision:
- Remove duplicate root route.
- Verify with lint, build and smoke E2E.

## Deferred

- Instagram connection hardening to Phase 2.
- Real content workflow to Phase 3.
- Real metrics/reporting to Phase 4.
- White-label to backlog `999.1`.

