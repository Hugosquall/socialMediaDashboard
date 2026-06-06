# Roadmap: Instagram Dashboard

**Created:** 2026-05-31
**Granularity:** Coarse
**Current milestone:** Personal Instagram Manager v1

## Active Phases

### Phase 1: Personal Profile Foundation

**Goal:** Finish converting the cloned dashboard into a clean personal Instagram dashboard with configurable branding, safe environment examples and reliable baseline tests.

**Requirements:** BRAND-01, BRAND-02, BRAND-03, SETUP-01, SETUP-02, SETUP-03, QUAL-01, QUAL-02, QUAL-03
**UI hint:** yes
**Plans:** 3 plans

Success criteria:
1. No visible inherited "Sabrina" branding, fake follower numbers or example Meta secrets remain.
2. Branding is configurable through `lib/brand.ts` and `.env.local` values.
3. `/` resolves through the dashboard route group without duplicate route conflict.
4. README/setup docs explain the real Supabase and Instagram env setup.
5. `npm run lint`, `npm run build` and smoke E2E pass.

Plans:
- [x] 01-01: Setup docs, environment safety and Supabase/Vercel runbook
- [x] 01-02: Honest integration states and remaining demo-data cleanup
- [x] 01-03: Final local/production validation and authenticated checkpoint

### Phase 2: Instagram Connection Hardening

**Goal:** Make Instagram account connection production-ready enough for the user's own profile, with clear status, expiry handling and failure guidance.

**Requirements:** IG-01, IG-02, IG-03, IG-04, QUAL-01, QUAL-02, QUAL-04
**UI hint:** yes
**Plans:** 3 plans

Success criteria:
1. Settings shows whether Instagram is configured, connected and which username is attached.
2. Missing env vars, invalid callbacks and missing permissions produce actionable UI/API messages.
3. Token expiry is visible and reconnect/refresh behavior is defined.
4. Instagram integration logic is isolated enough to test without live Meta calls.
5. Existing analytics fallback still works when Instagram is not connected.

Plans:
- [x] 02-01: Expose Instagram token status in API and Settings
- [x] 02-02: Add proactive reconnect/expiry notification
- [x] 02-03: Extract testable Instagram integration helpers

### Phase 3: Real Content Manager

**Goal:** Upgrade Instagram Manager from basic post CRUD to a practical content workflow with media, preview and publish/sync lifecycle.

**Requirements:** CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05, QUAL-01, QUAL-02, QUAL-04
**UI hint:** yes
**Plans:** 0 plans

Success criteria:
1. Posts support media metadata or URL fields needed for Instagram publishing.
2. UI supports previewing planned Instagram content before action.
3. Post statuses express the real lifecycle from idea/draft through published/failed.
4. Publish/sync actions use official Meta-supported flows where available.
5. Failure states are persisted and visible to the user.

Plans:
- [ ] TBD

### Phase 4: Real Metrics And Reporting

**Goal:** Replace ambiguous mock usage with clear live/unavailable states and make analytics/export useful for the connected profile.

**Requirements:** ANALYTICS-01, ANALYTICS-02, ANALYTICS-03, ANALYTICS-04, QUAL-01, QUAL-02, QUAL-04
**UI hint:** yes
**Plans:** 0 plans

Success criteria:
1. Analytics source state is visible and accurate.
2. Metrics supported by connected Instagram/Metricool are shown as real data.
3. Unsupported metrics show explicit unavailable states instead of misleading zeros or fake values.
4. Exports include source and range metadata that makes reports trustworthy.
5. Tests cover source fallback and unavailable-state behavior.

Plans:
- [ ] TBD

### Phase 5: Growth And Competitor Operations

**Goal:** Make Growth Lab and Competitor Tracker operational for the user's real profile instead of one-off UI surfaces.

**Requirements:** COMP-01, COMP-02, COMP-03, ANALYTICS-01, ANALYTICS-02, ANALYTICS-03
**UI hint:** yes
**Plans:** 4 plans

Success criteria:
1. Growth Lab loads the connected profile context and persists useful generated plans or experiments.
2. Growth recommendations clearly distinguish real metrics, inferred strategy and missing-data assumptions.
3. Competitor Tracker persists competitors and manual snapshots with timestamps.
4. Competitor comparison uses the user's real profile baseline when Instagram data is available.
5. Reports can be exported or copied with source metadata.

Plans:
- [x] 05-01: Load real user/profile context into Growth Lab
- [x] 05-02: Align Competitor Tracker comparison with user analytics
- [ ] 05-03: Persist Growth Lab experiments/history
- [ ] 05-04: Add competitor snapshots and report export

### Phase 6: AI Niche News Consolidator

**Goal:** Convert News Consolidator into an AI/software-quality radar for the user's niche.

**Requirements:** ANALYTICS-01, QUAL-01, QUAL-02
**UI hint:** yes
**Plans:** 2 plans

Success criteria:
1. Sources prioritize AI, AI-assisted development, software quality, testing and automation.
2. UI labels and fallback content no longer reference construction/architecture niches.
3. The page supports content ideation for the user's Instagram niche.

Plans:
- [x] 06-01: Replace construction/architecture sources and copy with AI Dev Radar
- [ ] 06-02: Add source curation controls and saved article ideas

## Backlog

### Phase 999.1: Fase 3 white-label workspaces multi-cliente (BACKLOG)

**Goal:** Capturar para planejamento futuro a evolução do dashboard para white-label/multi-cliente, com workspaces, branding por cliente, membros, papéis e isolamento de dados por marca.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)
