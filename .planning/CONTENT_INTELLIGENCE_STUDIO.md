# Content Intelligence Studio

## Goal Prompt

Use este objetivo para iniciar a execução autônoma:

```text
Transformar o dashboard em um Content Intelligence Studio: unificar logo/branding, conectar AI Dev Radar ao Growth Lab, adicionar geração assistida por IA para posts/carrosséis, renderizar carrosséis exportáveis e salvar drafts no Instagram Manager, com GSD, validação, commit, push e deploy production.
```

## Product Direction

O dashboard deve evoluir de um gerenciador de Instagram para um estúdio operacional de inteligência de conteúdo.

Fluxo alvo:

```text
AI Dev Radar -> Growth Lab -> Carousel Builder -> Instagram Manager -> Analytics
```

Objetivo prático:
- transformar notícias e sinais do nicho em ideias publicáveis;
- gerar roteiros e carrosséis com IA;
- manter consistência visual e de tom;
- salvar tudo como draft no Instagram Manager;
- medir o resultado depois da publicação.

## Core Principle

Não usar IA generativa de imagem para renderizar texto final de carrossel.

Racional:
- modelos de imagem ainda erram texto, alinhamento e consistência visual;
- carrossel técnico precisa de legibilidade e controle;
- o caminho mais confiável é gerar estratégia/texto com IA e renderizar slides com templates React/CSS.

Uso recomendado de IA:
- GPT/Gemini para ângulo, hook, roteiro, estrutura de slides, legenda e CTA;
- renderização determinística para slides;
- imagem generativa apenas como background/ilustração opcional, sem texto crítico embutido.

## Phase Plan

### Phase 7: Brand Identity And App Logo

Goal:
Criar identidade visual mínima para o app, com logo consistente no sidebar, login e favicon.

Scope:
- criar componente `AppLogo`;
- substituir ícones atuais no sidebar e login;
- gerar favicon/app icon coerente com o contexto IA + desenvolvimento + Instagram;
- manter branding configurável por `lib/brand.ts`;
- atualizar metadata quando necessário.

Suggested visual:
- símbolo técnico com `H`, radar/sinal e referência sutil a IA;
- paleta escura com indigo/cyan/emerald;
- evitar visual genérico de dashboard.

Relevant files:
- `components/layout/sidebar.tsx`
- `app/login/page.tsx`
- `app/layout.tsx`
- `app/favicon.ico`
- `lib/brand.ts`

Acceptance:
- logo único aparece no sidebar e login;
- favicon aparece corretamente na aba do navegador;
- `npm run lint`, `npm run build` e `npm run e2e` passam.

### Phase 8: AI Dev Radar To Growth Lab

Goal:
Transformar o AI Dev Radar em entrada real para criação de conteúdo.

Scope:
- adicionar botão `Abrir notícia` em cada item;
- adicionar botão `Criar conteúdo`;
- enviar título, resumo, fonte, tópico e link para o Growth Lab;
- Growth Lab deve abrir já preenchido com a notícia como contexto;
- adicionar prompt `Notícia -> Post`.

Recommended first implementation:
- usar query params ou session/local storage para transferir o item do Radar para o Growth Lab;
- não criar automação complexa ainda;
- Growth Lab preenche:
  - `idea`: título da notícia;
  - `content`: resumo + fonte + link;
  - `niche`: IA aplicada, desenvolvimento com IA, QA e automação;
  - `audience`: devs, QAs, tech leads e builders de produto com IA.

Relevant files:
- `components/news/news-feed.tsx`
- `app/api/news/route.ts`
- `app/(dashboard)/growth-lab/page.tsx`
- `lib/growth-prompts.ts`

Acceptance:
- toda notícia tem link externo explícito;
- `Criar conteúdo` abre Growth Lab preenchido;
- novo prompt transforma notícia em post/carrossel/reel textual;
- origem/link da notícia permanecem preservados no conteúdo.

### Phase 9: AI Provider Integration

Goal:
Adicionar geração assistida por IA dentro do Growth Lab.

Scope:
- criar API route para geração;
- suportar provider configurável por env;
- começar com OpenAI ou Gemini;
- manter fallback manual quando API key estiver ausente;
- salvar outputs em `growth_experiments`.

Suggested env vars:
- `AI_PROVIDER=openai|gemini|mock`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Recommended behavior:
- botão `Gerar com IA`;
- loading state;
- erro acionável quando env estiver ausente;
- output editável antes de salvar;
- salvar provider/model usado para auditoria futura.

Relevant files:
- `app/(dashboard)/growth-lab/page.tsx`
- `lib/growth-prompts.ts`
- `supabase/migrations/*`
- new: `app/api/growth/generate/route.ts`
- new: `lib/ai-provider.ts`

Acceptance:
- Growth Lab gera texto real com provider configurado;
- sem key, app continua útil com prompt copiável;
- outputs podem ser salvos no histórico.

### Phase 10: Carousel Builder

Goal:
Gerar carrosséis editáveis/exportáveis a partir de notícias, prompts ou ideias.

Scope:
- criar tela ou aba `Carousel Builder`;
- gerar estrutura de 5-8 slides;
- permitir edição de texto por slide;
- escolher template visual;
- exportar PNG por slide ou PDF;
- salvar como draft no Instagram Manager com `media_url`/metadados quando possível.

Recommended architecture:
- dados do carrossel como JSON estruturado;
- renderização dos slides com React/CSS;
- export usando browser rendering/headless capture;
- templates determinísticos, não imagem com texto gerado por IA.

Suggested schema:
- `carousel_projects`
- `carousel_slides`

Carousel project fields:
- `user_id`
- `title`
- `source_type`: `news|growth|manual`
- `source_url`
- `theme`
- `status`

Slide fields:
- `project_id`
- `position`
- `headline`
- `body`
- `visual_hint`
- `speaker_notes`

Acceptance:
- usuário gera carrossel a partir de um item do Radar;
- slides são editáveis;
- export funciona;
- draft é criado no Instagram Manager.

### Phase 11: Brand Kit And Content Memory

Goal:
Criar memória operacional para manter consistência e aprender com performance.

Scope:
- configurar logo, cores, CTA padrão, tom e assinatura visual;
- guardar hooks bons, CTAs bons e temas recorrentes;
- usar analytics/post performance como contexto futuro;
- alimentar geração com o que performou melhor.

Suggested schema:
- `brand_kit`
- `content_memory`
- `saved_hooks`

Acceptance:
- geração respeita Brand Kit;
- usuário consegue salvar hooks/CTAs;
- Growth Lab pode usar memória de performance como contexto.

## Recommended Execution Order

1. Phase 7: logo/favicons.
2. Phase 8: AI Dev Radar -> Growth Lab with `Notícia -> Post`.
3. Phase 9: AI provider.
4. Phase 10: Carousel Builder.
5. Phase 11: Brand Kit and memory.

## Out Of Scope For First Pass

- publicação automática no Instagram sem fluxo oficial Meta aprovado;
- imagem generativa com texto final embutido;
- editor visual complexo estilo Canva;
- multi-cliente/white-label.

## Validation Requirements

Every implementation phase must run:

```bash
npm run lint
npm run build
npm run e2e
```

For production work:

```bash
supabase migration list
supabase db push
vercel deploy . --prod -y
```

## Current Decision Log

- Carrosséis devem ser renderizados por template determinístico.
- IA gera estrutura/texto; app renderiza o visual.
- News items should become actionable content inputs, not only reading links.
- Growth Lab remains the central brain for content transformation.
- Instagram Manager remains the operational board for drafts/scheduling/publishing state.
