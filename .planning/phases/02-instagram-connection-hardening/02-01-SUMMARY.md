# Phase 2 Plan 02-01 Summary: Instagram Token Status

## Outcome

Implemented a production-facing token status path for Instagram.

## Changes

- `/api/analytics/sources` now returns `instagramStatus` with connection, username, expiry date, days until expiry and classified token state.
- Settings uses that source endpoint to render the Instagram username and whether the token is active, expiring, expired, unknown or disconnected.
- Expiring or expired tokens now surface an "Atenção" badge and reconnect guidance instead of appearing simply connected.
- Playwright now runs this project on port `3210` and does not reuse an arbitrary existing server on `localhost:3000`.

## Validation

- `npm run lint` passed.
- `npm run build` passed.
- `npm run e2e` passed: 5 passed, 1 authenticated test skipped because optional credentials were not provided.

## Follow-Up

- Plan 02-02 should create an idempotent notification when the token is expired or nearing expiry.
- Plan 02-03 should extract reusable Instagram integration helpers so the classification logic can be tested without live Meta calls.
