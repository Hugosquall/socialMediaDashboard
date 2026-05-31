# Codebase Testing Map

Generated: 2026-05-31

## Test Frameworks

- Linting uses ESLint via `npm run lint`.
- E2E testing uses Playwright via `npm run e2e`.
- There are no unit tests or component tests configured.
- There is no separate test database setup in the repo.

## Playwright Configuration

- Config file: `playwright.config.ts`
- Test directory: `tests/e2e`
- Base URL: `http://localhost:3000`
- Browser project: Desktop Chrome
- Web server command: `npm run dev`
- Web server timeout: `120_000`
- Retries: `2` in CI, `0` locally
- Reporter: GitHub in CI, list locally

## Existing E2E Tests

- `tests/e2e/smoke.spec.ts`
  - Checks that `/login` renders.
  - Checks email/password fields.
  - Checks protected root behavior redirects to login when unauthenticated.
- `tests/e2e/auth.spec.ts`
  - Checks protected routes redirect to `/login`.
  - Checks login/signup UI switching.
- `tests/e2e/api-sources.spec.ts`
  - Checks `/api/analytics/sources` is protected when unauthenticated.
- `tests/e2e/authenticated.spec.ts`
  - Optional login flow using `E2E_AUTH_EMAIL` and `E2E_AUTH_PASSWORD`.
  - Navigates to `/calendar` after authenticated login.

## CI

- CI file: `.github/workflows/ci.yml`
- Runs on `push` and `pull_request`.
- Steps:
  - checkout
  - setup Node.js 20
  - `npm ci`
  - `npm run lint`
  - `npm run build`
- CI does not currently run Playwright E2E tests.

## Coverage Gaps

- No automated tests for Instagram OAuth callback behavior.
- No tests for `/api/analytics` source fallback order.
- No tests for posts CRUD in `/instagram`.
- No tests for calendar date mapping.
- No tests for competitor add/remove persistence.
- No tests for notifications seed/state routes.
- No tests for settings profile/avatar/integration flows.
- No tests for export route output format.

## Testing Risks For Planned Work

- Phase 1 branding changes will break tests that expect "Dashboard Sabrina".
- Changing root routing may affect smoke/auth tests.
- Instagram API changes are hard to test without mockable service boundaries.
- Current direct Supabase calls from client pages make isolated unit tests difficult.
- Publishing flow will need mocked Graph API calls and integration-level tests before real account use.

## Recommended Test Direction

- Keep Playwright for route/auth smoke coverage.
- Add API route tests or integration tests around analytics fallback and notifications.
- Add service-layer unit tests when extracting Instagram publishing/sync logic.
- Update existing tests to use configurable app name after brand config is introduced.
- Add a "no real credentials in examples/docs" check before public sharing.

