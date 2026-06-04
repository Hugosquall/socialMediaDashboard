# Configurar Instagram em producao

Este projeto usa **Instagram Graph API via Facebook Login**. Esse fluxo conecta
o dashboard a uma conta profissional do Instagram por meio de uma Pagina do
Facebook vinculada ao perfil.

URLs do projeto:

- Producao: `https://socialmediadashboard-kappa.vercel.app`
- Callback OAuth: `https://socialmediadashboard-kappa.vercel.app/api/auth/instagram/callback`
- Callback local: `http://localhost:3000/api/auth/instagram/callback`

## 1. Preparar Instagram e Pagina

1. Confirme que o Instagram e uma conta **Business** ou **Creator**.
2. Confirme que o Instagram e publico.
3. Vincule esse Instagram a uma **Pagina do Facebook**.
4. Use um usuario Facebook que seja admin ou tenha permissao suficiente nessa Pagina.
5. Em ambiente de desenvolvimento, esse usuario precisa ter papel no app Meta
   como admin, developer ou tester.

Sem a Pagina vinculada, o Graph API nao retorna `instagram_business_account` e
o dashboard mostra `instagram_error=no_page`.

## 2. Configurar o app Meta

1. Acesse [Meta for Developers](https://developers.facebook.com/apps/).
2. Abra o app geral do projeto, nao o app Instagram direto `ubsta-IG`.
3. Adicione/configure **Facebook Login**.
4. Em **Valid OAuth Redirect URIs**, inclua:
   - `https://socialmediadashboard-kappa.vercel.app/api/auth/instagram/callback`
   - `http://localhost:3000/api/auth/instagram/callback`
5. Copie o **App ID** e o **App Secret** do app Meta geral.

## 3. Permissoes usadas pelo projeto

O OAuth solicita:

| Escopo | Uso no dashboard |
| --- | --- |
| `pages_show_list` | Listar Paginas que o usuario pode acessar |
| `pages_read_engagement` | Ler dados basicos e engajamento da Pagina |
| `business_management` | Autorizar acesso a ativos comerciais vinculados |
| `instagram_basic` | Localizar a conta profissional vinculada e ler perfil/midia |
| `instagram_content_publish` | Permissao de conteudo exigida pelo setup de Instagram com Facebook Login |

Para uso pessoal em desenvolvimento, o app pode ficar em development mode se o
usuario que autoriza tiver papel no app. Para contas de terceiros, sera
necessario App Review e acesso avancado para as permissoes.

Observacao: a permissao de insights avancados aparece na Meta como
`instagram_business_manage_insights`, mas o dialog de Facebook Login rejeitou
esse escopo no setup atual. Por isso o OAuth inicial usa apenas as permissoes
aceitas pelo produto **Configuracao da API com login do Facebook**; insights
avancados ficam para habilitacao posterior.

## 4. Configurar variaveis na Vercel

No projeto `hugosqualls-projects/socialmediadashboard`, configure em
**Production**:

```env
META_APP_ID=...
META_APP_SECRET=...
META_GRAPH_API_VERSION=v19.0
NEXT_PUBLIC_SITE_URL=https://socialmediadashboard-kappa.vercel.app
```

Pela CLI:

```bash
printf "%s" "<app-id>" | vercel env add META_APP_ID production
printf "%s" "<app-secret>" | vercel env add META_APP_SECRET production
printf "%s" "v19.0" | vercel env add META_GRAPH_API_VERSION production
vercel --prod
```

Nunca coloque `META_APP_SECRET` em variavel `NEXT_PUBLIC_`.

## 5. Configurar ambiente local

Preencha `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
META_APP_ID=...
META_APP_SECRET=...
META_GRAPH_API_VERSION=v19.0
```

Depois rode:

```bash
npm run dev
```

## 6. Testar

1. Acesse `https://socialmediadashboard-kappa.vercel.app`.
2. Crie ou entre na sua conta do dashboard.
3. Va para **Settings -> Integracoes**.
4. Clique em **Conectar** no Instagram Graph API.
5. Autorize pelo Facebook Login e selecione a Pagina vinculada ao Instagram.
6. Ao voltar para `/settings`, o status deve aparecer como conectado.

Quando conectado, a rota `/api/analytics` busca dados via
`graph.facebook.com/{version}`. Se o token nao existir ou a API negar acesso, o
dashboard cai para Metricool, se configurado, ou para dados mockados.

## 7. Erros comuns

| Erro no app | Causa provavel |
| --- | --- |
| `missing_credentials` | `META_APP_ID` ou `META_APP_SECRET` ausente |
| `state_mismatch` | OAuth expirou ou foi aberto sem passar pelo botao do app |
| `no_page` | Usuario Facebook nao tem uma Pagina com Instagram profissional vinculado |
| `server_error` | Falha no Graph API, permissao ausente ou credencial errada |

## 8. Renovacao de token

O callback troca o token curto por um token longo do Facebook e salva o Page
Access Token retornado em `/me/accounts`. Ainda falta automatizar uma rotina de
renovacao/alerta antes de expirar.
