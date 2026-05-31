# Instagram Dashboard

Dashboard privado de gestão de redes sociais — Instagram Manager, Analytics, Calendário de Conteúdo, Monitoramento de Concorrentes e News Consolidator.

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16 (App Router) | Framework principal |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | v4 | Estilização (config inline no CSS) |
| Supabase | — | Auth (email/senha) + banco de dados |
| Recharts | 3.x | Gráficos interativos no Analytics |
| shadcn/ui (manual) | — | Componentes base |
| Radix UI | — | Primitivas acessíveis |
| lucide-react | — | Ícones |
| rss-parser | — | Feed de notícias (ArchDaily, Dezeen, Archinect) |

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. O app redireciona para `/login` se não autenticado.

## Setup rápido

1. Copie `.env.example` para `.env.local`.
2. Preencha as variáveis do Supabase.
3. Configure `NEXT_PUBLIC_SITE_URL` com a URL local ou pública.
4. Se for usar Instagram ou Metricool, preencha também as credenciais correspondentes.
5. Rode `npm install` e `npm run dev`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Instagram Graph API (opcional — habilita dados reais no Analytics e Instagram Manager)
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=

# Metricool (opcional — habilita métricas de Facebook e Twitter no Analytics)
METRICOOL_API_KEY=

# URL do site (usado no redirect OAuth)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Consulte `INSTAGRAM_SETUP.md` para o passo a passo de criação do app no Meta for Developers.

A chave da Metricool pode ser configurada diretamente na interface em **Configurações → Integrações** (salva em `user_metadata` do usuário autenticado), com fallback opcional para `METRICOOL_API_KEY` no ambiente.

## Páginas

| Rota | Seção | Dados |
|---|---|---|
| `/` | Overview | KPIs gerais + acesso rápido às seções |
| `/instagram` | Instagram Manager | Posts no Supabase (CRUD real) |
| `/analytics` | Analytics | Instagram Graph API → Metricool → mock |
| `/calendar` | Content Calendar | Dados reais de `posts` no Supabase (com filtros e visão mensal) |
| `/competitors` | Competitor Tracker | Supabase (tabela `competitors`) |
| `/news` | News Consolidator | RSS feeds reais com fallback mock |
| `/notifications` | Notificações | Supabase (`notifications`) + seed inicial + health visual |
| `/settings` | Configurações | Perfil e integrações no Supabase |
| `/login` | Login / Cadastro | Supabase Auth |

## API Routes

| Endpoint | Método | Descrição |
|---|---|---|
| `GET /api/auth/instagram` | GET | Inicia OAuth do Instagram |
| `GET /api/auth/instagram/callback` | GET | Callback OAuth — salva token no Supabase |
| `GET /api/analytics` | GET | Dados de analytics (Instagram → Metricool → mock) |
| `GET /api/analytics/sources` | GET | Verifica quais fontes estão configuradas |
| `POST /api/analytics/sources` | POST | Salva Metricool API key no `user_metadata` do usuário autenticado |
| `DELETE /api/analytics/sources` | DELETE | Remove Metricool API key do `user_metadata` do usuário autenticado |
| `GET /api/news` | GET | Busca RSS feeds e retorna artigos normalizados |
| `GET /api/notifications/health` | GET | Verifica se a tabela `notifications` está pronta para uso |
| `GET /api/notifications` | GET | Lista notificações persistidas do usuário (não dispensadas) |
| `POST /api/notifications` | POST | Seed inicial idempotente de notificações |
| `PATCH /api/notifications/state` | PATCH | Atualiza estado (marcar lida, marcar todas, dispensar) |

## Banco de dados (Supabase)

Tabelas principais:

- **`profiles`** — nome, handle, bio, avatar do usuário
- **`posts`** — posts do Instagram Manager (caption, tipo, status, datas, métricas)
- **`instagram_tokens`** — access token OAuth do Instagram por usuário
- **`competitors`** — concorrentes monitorados
- **`notifications`** — central de notificações persistida por usuário

## Runbooks

- [Runbook de notificações](docs/NOTIFICATIONS_RUNBOOK.md) — como aplicar a migration manualmente no SQL Editor do Supabase, validar a tabela e fazer rollback se necessário.
  O fluxo inclui a checagem de `GET /api/notifications/health` e o callout visual na tela quando a tabela ainda não existe.

## Estratégia de dados do Analytics

O Analytics usa uma hierarquia de fontes com fallback automático:

1. **Instagram Graph API** — se o usuário tiver conectado o Instagram via OAuth (token salvo no Supabase). Retorna impressões, alcance, crescimento de seguidores e top posts reais.
2. **Metricool** — se houver chave no `user_metadata` do usuário autenticado (fallback: `METRICOOL_API_KEY` no ambiente). Agrega dados de Instagram, Facebook e Twitter.
3. **Dados mockados** — fallback sempre disponível em desenvolvimento. Um banner laranja na página indica quando o mock está ativo.

### Calendário de conteúdo

O calendário usa dados reais da tabela `posts` do usuário autenticado, com priorização de data (`scheduled_at`, `published_at`, `created_at`), filtros por plataforma e visão mensal.

## Autenticação

Toda a autenticação é feita via Supabase Auth (email + senha). O `proxy.ts` protege todas as rotas exceto `/login` e `/api/auth/instagram/callback`, redirecionando para `/login` se não autenticado.

## Testes

```bash
npm run lint
npm run e2e
```

O `npm run e2e` executa os testes em `tests/e2e/` com o servidor de desenvolvimento subido automaticamente pelo Playwright.

Cobertura atual:
- redirecionamento de rota protegida para `/login`
- validação da tela de login e do fluxo entre login/cadastro
- proteção da rota `/api/analytics/sources`
- cenário autenticado opcional com navegação até `/calendar`

Existe também um cenário autenticado opcional, que só roda quando as credenciais forem fornecidas por env:

```bash
E2E_AUTH_EMAIL=seu-email@teste.com
E2E_AUTH_PASSWORD=sua-senha-segura
```

Se essas variáveis não existirem, o cenário autenticado é pulado automaticamente sem quebrar a suíte. Os testes não autenticados continuam válidos sem nenhuma credencial adicional.
