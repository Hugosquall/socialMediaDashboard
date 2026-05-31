# Requirements: Instagram Dashboard

**Defined:** 2026-05-31
**Core Value:** Você consegue planejar, publicar/sincronizar e analisar o seu Instagram real sem depender de dados fake ou branding herdado do projeto original.

## v1 Requirements

### Branding

- [ ] **BRAND-01**: User can configure app name, brand name, handle, tagline and displayed role via environment variables.
- [ ] **BRAND-02**: User sees no inherited "Sabrina" branding or old demo secrets in app, docs, tests, or env examples.
- [ ] **BRAND-03**: User sees neutral "connect Instagram" states instead of fake follower KPIs before integration is configured.

### Setup

- [ ] **SETUP-01**: User can copy `.env.example` to `.env.local` and know which values are required for Supabase, branding, Instagram and Metricool.
- [ ] **SETUP-02**: User can run the Supabase migrations and required Storage bucket setup for local/prod use.
- [ ] **SETUP-03**: User can verify protected routes, login and build behavior without configured Supabase credentials.

### Instagram Integration

- [ ] **IG-01**: User can connect their own Instagram account using the configured Meta app callback flow.
- [ ] **IG-02**: User can see connected Instagram account status, username and token expiry state in Settings.
- [ ] **IG-03**: User receives clear remediation when Instagram env vars, callback URL, permissions or token are missing.
- [ ] **IG-04**: User can refresh or reconnect Instagram tokens before expiry.

### Content Management

- [ ] **CONTENT-01**: User can create posts with caption, platform, type, status and scheduled/published dates.
- [ ] **CONTENT-02**: User can attach media metadata or media URL to planned posts.
- [ ] **CONTENT-03**: User can preview planned Instagram content before publishing.
- [ ] **CONTENT-04**: User can move posts through a clear lifecycle: idea/draft, approved, scheduled, publishing, published, failed.
- [ ] **CONTENT-05**: User can publish or sync eligible Instagram posts through an official Meta-supported flow.

### Analytics

- [ ] **ANALYTICS-01**: User can distinguish live Instagram, Metricool and mock analytics sources at a glance.
- [ ] **ANALYTICS-02**: User sees real Instagram metrics where permissions and API support exist.
- [ ] **ANALYTICS-03**: User sees explicit unavailable states when a metric cannot be provided by the connected source.
- [ ] **ANALYTICS-04**: User can export posts and analytics after real integration setup.

### Quality

- [ ] **QUAL-01**: `npm run lint` passes after each implementation phase.
- [ ] **QUAL-02**: `npm run build` passes after each implementation phase.
- [ ] **QUAL-03**: Smoke E2E tests cover unauthenticated login/protection behavior.
- [ ] **QUAL-04**: New Instagram service logic is testable without calling real Meta APIs in CI.

## v2 Requirements

### Community Management

- **COMM-01**: User can triage Instagram comments or mentions from the dashboard.
- **COMM-02**: User can define reusable reply templates.
- **COMM-03**: User can receive alerts for high-priority engagement.

### Competitors

- **COMP-01**: User can manually track competitors with notes and observed metrics.
- **COMP-02**: User can compare own public metrics against manually entered competitor snapshots.
- **COMP-03**: User can generate competitor observation reports.

### Automation

- **AUTO-01**: User can schedule recurring report generation.
- **AUTO-02**: User can receive email digests for weekly/monthly performance.

## Out of Scope

| Feature | Reason |
|---------|--------|
| White-label/multi-client workspaces | Deferred to backlog 999.1; current goal is a single personal Instagram dashboard |
| Native mobile app | Web dashboard is sufficient for v1 |
| Scraping private Instagram or competitor metrics | High policy and reliability risk |
| Unauthorized Instagram automation | Must comply with Meta platform policies |
| Multi-user role management | Not needed for single-profile operation yet |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 1 | In Progress |
| BRAND-02 | Phase 1 | In Progress |
| BRAND-03 | Phase 1 | In Progress |
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | In Progress |
| IG-01 | Phase 2 | Pending |
| IG-02 | Phase 2 | Pending |
| IG-03 | Phase 2 | Pending |
| IG-04 | Phase 2 | Pending |
| CONTENT-01 | Phase 3 | Pending |
| CONTENT-02 | Phase 3 | Pending |
| CONTENT-03 | Phase 3 | Pending |
| CONTENT-04 | Phase 3 | Pending |
| CONTENT-05 | Phase 3 | Pending |
| ANALYTICS-01 | Phase 4 | Pending |
| ANALYTICS-02 | Phase 4 | Pending |
| ANALYTICS-03 | Phase 4 | Pending |
| ANALYTICS-04 | Phase 4 | Pending |
| QUAL-01 | Phase 1-4 | Pending |
| QUAL-02 | Phase 1-4 | Pending |
| QUAL-03 | Phase 1 | In Progress |
| QUAL-04 | Phase 2-4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-05-31*
*Last updated: 2026-05-31 after initialization*

