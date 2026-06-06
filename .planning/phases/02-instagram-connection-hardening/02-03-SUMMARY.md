# Phase 2 Plan 02-03 Summary: Token Helper Extraction

## Outcome

Extracted Instagram token state classification into a pure library helper.

## Changes

- Added `lib/instagram-token-status.ts`.
- `/api/analytics/sources` uses the helper to return consistent token status.
- Notification sync uses the same helper for expiry/expired alert decisions.

## Follow-Up

- Add automated unit coverage if/when the project adopts a unit test runner beyond the current lint/build/Playwright gates.
