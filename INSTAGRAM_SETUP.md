# Configurar Instagram em produção

Este projeto usa o fluxo **Instagram API with Instagram Login** para conectar uma
conta profissional do Instagram ao dashboard. A conta precisa ser **Business** ou
**Creator**; conta pessoal não entrega os dados necessários de analytics.

URLs do projeto:

- Produção: `https://socialmediadashboard-kappa.vercel.app`
- Callback OAuth: `https://socialmediadashboard-kappa.vercel.app/api/auth/instagram/callback`
- Callback local: `http://localhost:3000/api/auth/instagram/callback`

## 1. Preparar a conta do Instagram

1. No Instagram, converta o perfil para **Professional account**.
2. Escolha **Business** ou **Creator**.
3. Confirme que o perfil tem acesso aos Insights no app do Instagram.
4. Para uso privado, deixe o app Meta em desenvolvimento e adicione sua conta como tester/admin.

## 2. Criar ou ajustar o app na Meta

1. Acesse [Meta for Developers](https://developers.facebook.com/apps/).
2. Crie ou abra o app usado pelo projeto.
3. Adicione/configure o produto de Instagram com login para contas profissionais.
4. Em OAuth, configure os redirects:
   - `https://socialmediadashboard-kappa.vercel.app/api/auth/instagram/callback`
   - `http://localhost:3000/api/auth/instagram/callback`
5. Copie o **App ID** e o **App Secret**.

## 3. Permissões usadas pelo projeto

O projeto solicita estes escopos:

| Escopo | Uso no dashboard |
| --- | --- |
| `instagram_business_basic` | Ler perfil profissional e mídia básica |
| `instagram_business_manage_insights` | Ler métricas de conta e mídia |

Para uso pessoal, normalmente basta a conta estar adicionada ao app como
admin/developer/tester. Para liberar a conexão para contas de terceiros, será
necessário passar por App Review e obter acesso avançado.

## 4. Configurar variáveis na Vercel

No projeto `hugosqualls-projects/socialmediadashboard`, configure em
**Production**:

```env
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
NEXT_PUBLIC_SITE_URL=https://socialmediadashboard-kappa.vercel.app
```

Pela CLI:

```bash
printf "%s" "<app-id>" | vercel env add INSTAGRAM_APP_ID production
printf "%s" "<app-secret>" | vercel env add INSTAGRAM_APP_SECRET production
vercel --prod
```

Nunca coloque `INSTAGRAM_APP_SECRET` em variável `NEXT_PUBLIC_`.

## 5. Configurar ambiente local

Preencha `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
```

Depois rode:

```bash
npm run dev
```

## 6. Testar

1. Acesse `https://socialmediadashboard-kappa.vercel.app`.
2. Crie ou entre na sua conta do dashboard.
3. Vá para **Settings -> Integrações**.
4. Clique em **Conectar** no Instagram.
5. Autorize no Instagram.
6. Ao voltar para `/settings`, o status deve aparecer como conectado.

Quando conectado, a rota `/api/analytics` busca dados do Instagram. Se o token
não existir ou a API negar acesso, o dashboard cai para Metricool, se configurado,
ou para dados mockados.

## 7. Renovação de token

O token longo do Instagram vence em aproximadamente 60 dias. A renovação pode ser
feita com:

```http
GET https://graph.instagram.com/refresh_access_token
  ?grant_type=ig_refresh_token
  &access_token=TOKEN_ATUAL
```

Ainda falta automatizar essa renovação com cron ou job agendado.
