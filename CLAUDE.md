# Dashboard Sabrina — CLAUDE.md

Documentação técnica do projeto para uso como contexto em sessões futuras com Claude.

---

## Tech Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16 (App Router) | Framework principal |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | v4 | Estilização (config inline no CSS) |
| Supabase | — | Auth (email/senha) + banco de dados |
| Recharts | 3.x | Gráficos interativos no Analytics (LineChart, BarChart) |
| shadcn/ui (manual) | — | Componentes base instalados manualmente em `components/ui/` |
| Radix UI | — | Primitivas acessíveis (@radix-ui/react-slot, @radix-ui/react-separator, @radix-ui/react-tooltip) |
| lucide-react | — | Ícones |
| clsx + tailwind-merge | — | Utilitário de classes CSS (`cn()` em `lib/utils.ts`) |
| rss-parser | — | Feed de notícias no News Consolidator |

**Nota sobre shadcn/ui:** CLI não disponível no ambiente. Componentes criados manualmente em `components/ui/` seguindo as mesmas convenções (forwardRef, cn(), variantes via objeto literal).

**Nota sobre Tailwind v4:** Não existe `tailwind.config.ts`. Configuração via `@theme inline` no CSS. Usar `bg-[var(--primary)]` para referenciar variáveis CSS nas classes Tailwind.

---

## Estrutura de Pastas

```
dashboard-sabrina/
├── app/
│   ├── (dashboard)/              # Route group — aplica DashboardLayout
│   │   ├── layout.tsx            # Layout com Sidebar + Topbar
│   │   ├── page.tsx              # Overview (home)
│   │   ├── instagram/page.tsx    # Instagram Manager — CRUD real no Supabase
│   │   ├── analytics/page.tsx    # Analytics — consome /api/analytics
│   │   ├── calendar/page.tsx     # Content Calendar — dados reais de posts (Supabase)
│   │   ├── competitors/page.tsx  # Competitor Tracker — Supabase
│   │   ├── news/page.tsx         # News Consolidator — consome /api/news
│   │   ├── notifications/page.tsx# Notificações — persistidas no Supabase com health/seed
│   │   └── settings/page.tsx     # Configurações — perfil Supabase + integrações
│   ├── api/
│   │   ├── auth/instagram/
│   │   │   ├── route.ts          # GET — inicia OAuth do Instagram
│   │   │   └── callback/route.ts # GET — recebe code, troca por token, salva no Supabase
│   │   ├── analytics/
│   │   │   ├── route.ts          # GET — dados de analytics (Instagram → Metricool → mock)
│   │   │   └── sources/route.ts  # GET/POST/DELETE — gerencia fontes de dados
│   │   └── news/route.ts         # GET — busca RSS feeds, retorna artigos normalizados
│   ├── login/page.tsx            # Login + cadastro via Supabase Auth
│   ├── globals.css               # Variáveis CSS globais + tema dark
│   └── layout.tsx                # Root layout (fonts, metadata, html/body com className="dark")
│
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx           # Sidebar de navegação (usa usePathname para item ativo)
│   │   └── topbar.tsx            # Header superior com título de página
│   ├── news/
│   │   └── news-feed.tsx         # Componente client do feed de notícias
│   └── ui/
│       ├── badge.tsx             # Badge (variantes: default, success, warning, destructive, secondary)
│       ├── button.tsx            # Button (variantes: default, outline, ghost + tamanhos)
│       └── card.tsx              # Card com sub-componentes (Header, Title, Description, Content, Footer)
│
├── lib/
│   ├── database.types.ts         # Tipos gerados do Supabase (profiles, posts, instagram_tokens, competitors)
│   ├── supabase/
│   │   ├── client.ts             # createClient() para Client Components
│   │   └── server.ts             # createClient() para Server Components e API Routes
│   └── utils.ts                  # cn() helper para merge de classes Tailwind
│
├── proxy.ts                       # Protege rotas — renova sessão e redireciona para /login se não autenticado
├── .env.local                     # Variáveis de ambiente (ver seção abaixo)
├── CLAUDE.md                      # Este arquivo
├── README.md                      # Documentação para desenvolvedores
├── INSTAGRAM_SETUP.md             # Passo a passo para criar app no Meta for Developers
└── package.json
```

---

## Variáveis de Ambiente (.env.local)

```env
# Copie de .env.example e preencha os valores reais
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
METRICOOL_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`METRICOOL_API_KEY` é fallback de ambiente. A prioridade atual de leitura é a chave salva no `user_metadata` do usuário autenticado, com fallback para a env global quando necessário.

---

## Tema Dark

Tema dark global e obrigatório — sem toggle light/dark. Ativado via `className="dark"` no `<html>` do root layout.

```css
--background: #0a0a0f       /* fundo principal */
--card: #111118              /* fundo de cards */
--primary: #6366f1           /* indigo-500 */
--secondary: #1e1e2e         /* fundo de elementos secundários */
--border: #27272a            /* bordas sutis */
--muted-foreground: #71717a  /* texto de placeholder/labels */
--sidebar-bg: #0d0d14        /* fundo da sidebar */
```

---

## Convenções de Componentes

### Componentes UI (`components/ui/`)
- Sempre usar `React.forwardRef` para permitir ref forwarding
- Variantes definidas via objeto literal (sem CVA library)
- Sempre aceitar `className` via `cn()` para override externo
- Somente named exports (sem default export)

### Componentes de Layout (`components/layout/`)
- `"use client"` quando usam hooks do Next.js
- Sidebar usa `usePathname` para estado de item ativo

### Páginas (`app/(dashboard)/*/page.tsx`)
- `"use client"` nas páginas que precisam de interatividade ou fetch client-side
- Grid responsivo com `sm:`, `lg:` breakpoints do Tailwind

---

## Banco de Dados (Supabase)

| Tabela | Descrição |
|---|---|
| `profiles` | Perfil público do usuário (nome, handle, bio, avatar_url) |
| `posts` | Posts do Instagram Manager — caption, tipo, status, métricas, datas |
| `instagram_tokens` | Access token OAuth do Instagram — salvo após callback, tem `expires_at` |
| `competitors` | Concorrentes monitorados com handles e métricas |

Tipos em `lib/database.types.ts`. Usar `Tables<"nome_da_tabela">` para tipar rows.

---

## Estratégia de Dados do Analytics

A página `/analytics` consome `GET /api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD`. A route segue esta hierarquia com fallback automático:

1. **Instagram Graph API** — se `instagram_tokens` existir para o usuário no Supabase. Busca via `graph.instagram.com/v19.0`.
2. **Metricool** — se houver chave no `user_metadata` do usuário autenticado (fallback para `METRICOOL_API_KEY`). Usa `app.metricool.com/api/v2`. Agrega Facebook e Twitter além do Instagram.
3. **Dados mockados** — fallback sempre disponível. Usa gerador determinístico (seed baseado na data) para evitar hydration mismatch.

A resposta inclui `source` ("instagram" | "metricool" | "mock") e `sourcesAvailable`. A página exibe um banner colorido indicando a fonte ativa, com link para Configurações quando em modo mock.

A route `/api/analytics/sources` (GET/POST/DELETE) gerencia as fontes: verifica disponibilidade e salva/remove a Metricool API key no `user_metadata` do usuário autenticado.

---

## Autenticação

Supabase Auth com email + senha. `proxy.ts` protege todas as rotas exceto `/login` e `/api/auth/instagram/callback`.

### OAuth do Instagram
1. `GET /api/auth/instagram` → redireciona para `api.instagram.com/oauth/authorize`
2. Callback: troca code por short-lived token → long-lived token (60 dias) → salva em `instagram_tokens`
3. Redireciona para `/settings?instagram_connected=true`

---

## O que está funcionando (integração real)

- ✅ Autenticação completa (login, cadastro, sessão persistida, proteção de rotas)
- ✅ Instagram Manager — CRUD de posts no Supabase (criar, listar por status, deletar)
- ✅ OAuth do Instagram — fluxo completo implementado, depende de credenciais Meta no `.env.local`
- ✅ News Consolidator — RSS feeds reais (ArchDaily, Dezeen, Archinect) com fallback mock
- ✅ Analytics — sistema dual data source (Instagram Graph API + Metricool + mock)
- ✅ Perfil de usuário — salvo e carregado do Supabase
- ✅ Configurações de integrações — connect/disconnect Instagram e Metricool na UI

---

## O que está como mock / placeholder

| Funcionalidade | Localização | Observação |
|---|---|---|
| KPIs de seguidores no Instagram Manager | `instagram/page.tsx` — valor fixo "48.2K" | Aguarda Instagram Graph API conectado |
| Competitor Tracker | `competitors/page.tsx` | UI completa, dados mockados inline (tabela `competitors` existe no Supabase) |
| Content Calendar | `calendar/page.tsx` | Dados reais da tabela `posts`, com filtros de plataforma e calendário mensal |
| Notificações | `notifications/page.tsx` | UI funcional (marcar lida, filtrar, dispensar), sem fonte de dados real |
| Preferências de notificações no app | `notifications/page.tsx` e `settings/page.tsx` → `NotificationsTab` | Persistem em `user_metadata`, não em coluna dedicada |
| Exportar posts (JSON) / analytics (CSV) | `settings/page.tsx` → `DataTab` | Já implementado e conectado às rotas `/api/export/posts` e `/api/export/analytics` |
| Upload de avatar | `settings/page.tsx` → `ProfileTab` | Já implementado com Supabase Storage no bucket `avatars` |
| Sidebar responsiva | `components/layout/dashboard-shell.tsx` e `components/layout/sidebar.tsx` | Já implementada com menu mobile e bloqueio de scroll |

---

## Estado atual e dependências

- **Instagram Graph API**: já integrado no código. Para sair do fallback mock, o ambiente precisa ter `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` e um token válido salvo no Supabase para o usuário autenticado.
- **Metricool**: já integrado no código. A chave é configurada por usuário no `user_metadata`, com fallback opcional para env global.
- **Content Calendar**: usa dados reais da tabela `posts` no Supabase.
- **Competitor Tracker**: ainda usa dados mockados inline; essa é a principal funcionalidade que segue como evolução futura.

---

## Decisões de Arquitetura

1. **Route Groups `(dashboard)`** — aplica layout compartilhado sem afetar URLs.

2. **Variáveis CSS em vez de Tailwind config** — Tailwind v4 usa `@theme inline`. Variáveis CSS nativas referenciadas com `bg-[var(--primary)]`.

3. **shadcn manual** — CLI com erro de autenticação no ambiente. Mesmas interfaces e padrões.

4. **API Route para Analytics** — dados movidos para `app/api/analytics/route.ts` (server-side) para acesso seguro ao Supabase e variáveis de ambiente privadas.

5. **Mock determinístico** — gerador de dados mock usa seed baseado na data inicial, evitando hydration mismatch entre servidor e cliente.

6. **Sem estado global** — estado gerenciado localmente por página. Zustand ou Context API podem ser adicionados se necessário.
