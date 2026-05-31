# Instagram Dashboard

## What This Is

Um dashboard privado para gerir o seu perfil de Instagram a partir de uma aplicação web própria. O produto deve evoluir do estado atual de planner/analytics com Supabase para uma ferramenta prática de operação: perfil configurável, calendário editorial, posts com mídia, publicação/sincronização via Instagram e relatórios de performance.

Este projeto não será white-label nesta etapa. O foco atual é seu próprio perfil de Instagram, mantendo a arquitetura simples e direta.

## Core Value

Você consegue planejar, publicar/sincronizar e analisar o seu Instagram real sem depender de dados fake ou branding herdado do projeto original.

## Requirements

### Validated

- ✓ Usuário pode autenticar por email/senha via Supabase — existing
- ✓ Rotas privadas são protegidas por sessão Supabase — existing
- ✓ Usuário pode criar, listar e remover posts no Supabase — existing
- ✓ Calendário usa posts reais da tabela `posts` — existing
- ✓ Analytics possui fallback Instagram → Metricool → mock — existing
- ✓ News Consolidator agrega RSS com fallback mock — existing
- ✓ Notificações persistidas podem ser listadas, lidas e dispensadas — existing
- ✓ Configurações salvam perfil, avatar e integrações — existing
- ✓ Branding inicial já foi centralizado em `lib/brand.ts` — Phase 0

### Active

- [ ] Personalizar o dashboard para o seu perfil, removendo branding herdado e valores fake visíveis.
- [ ] Configurar ambiente real com Supabase, bucket de avatar e credenciais Meta/Instagram.
- [ ] Tornar o Instagram Manager útil para gestão real, incluindo mídia, preview e ciclo de status.
- [ ] Implementar publicação/sincronização segura com Instagram quando as permissões Meta estiverem prontas.
- [ ] Substituir KPIs e relatórios mockados por dados reais ou estados explícitos de integração pendente.
- [ ] Manter testes e build passando durante cada fase.

### Out of Scope

- White-label/multi-cliente — deferido para backlog `999.1`.
- Aplicativo mobile nativo — o foco é web dashboard.
- Gestão de múltiplas marcas/workspaces — não é meta atual.
- Automação agressiva que viole políticas da Meta — risco de bloqueio da conta.
- Scraping de métricas de concorrentes — APIs oficiais não fornecem esse acesso de forma geral.

## Context

- O codebase é Next.js 16 App Router, React 19, TypeScript, Tailwind v4 e Supabase.
- O mapa técnico está em `.planning/codebase/`.
- O repositório já tinha documentação, rotas de API, Supabase migrations, testes Playwright e CI.
- A primeira limpeza já foi feita: branding "Sabrina" removido, `.env.example` sanitizado, conflito de rota `/` removido e `lib/brand.ts` criado.
- Para usar Instagram real, a conta precisa estar preparada no ecossistema Meta e os redirects precisam bater com `NEXT_PUBLIC_SITE_URL`.

## Constraints

- **Tech stack**: manter Next.js, Supabase e Tailwind atuais — já estão implementados e testados.
- **Auth/data**: preservar isolamento por `user_id` e políticas RLS — evita vazamento de dados.
- **Meta APIs**: usar permissões oficiais e revisar escopos antes de publicação — reduz risco de rejeição ou bloqueio.
- **Security**: não versionar secrets; `.env.example` deve manter valores vazios.
- **Scope**: priorizar seu perfil único antes de qualquer generalização white-label.
- **Testing**: cada fase deve manter `npm run lint`, `npm run build` e smoke E2E funcionando.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Não fazer white-label agora | Evita modelagem multi-tenant antes de haver valor no uso próprio | ✓ Good |
| Centralizar branding em `lib/brand.ts` | Permite personalização via env sem caça a strings espalhadas | ✓ Good |
| Manter Supabase como backend | Já cobre Auth, banco, RLS e Storage para o escopo atual | — Pending |
| Usar APIs oficiais da Meta | Publicação e métricas precisam ser sustentáveis e compatíveis com políticas | — Pending |
| Manter mock apenas como fallback explícito | App não quebra em dev, mas usuário entende quando dado não é real | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-31 after initialization*

