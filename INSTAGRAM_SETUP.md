# Como conectar o Instagram ao Dashboard

Siga este guia uma única vez. Leva ~10 minutos.

---

## 1. Criar um app no Meta for Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com) e faça login com a conta do Facebook do seu chefe (ou uma conta empresarial).
2. Clique em **"Meus Apps"** → **"Criar App"**.
3. Escolha o tipo **"Consumidor"** (ou "Business" se tiver uma Meta Business Suite).
4. Dê um nome ao app, ex: `Instagram Dashboard`, e clique em **Criar**.

---

## 2. Adicionar o produto "Instagram Basic Display"

1. No painel do app, vá em **"Adicionar Produto"**.
2. Encontre **"Instagram Basic Display"** e clique em **Configurar**.
3. Clique em **"Criar novo app"** na seção Instagram Basic Display.
4. Aceite os termos.

---

## 3. Configurar a URL de redirecionamento OAuth

No painel do Instagram Basic Display, em **"Configurações do app"**:

- **Valid OAuth Redirect URIs:** `http://localhost:3000/api/auth/instagram/callback`
  - Em produção, adicione também: `https://seu-dominio.com/api/auth/instagram/callback`
- **Deauthorize Callback URL:** `http://localhost:3000/api/auth/instagram/deauth` (pode deixar placeholder)
- **Data Deletion Request URL:** `http://localhost:3000/api/auth/instagram/delete` (pode deixar placeholder)

Clique em **Salvar alterações**.

---

## 4. Adicionar usuário de teste

Como o app ainda está em modo desenvolvimento, apenas usuários adicionados como "testers" podem conectar:

1. Vá em **"Funções"** → **"Testadores do Instagram"**.
2. Clique em **"Adicionar Testadores do Instagram"**.
3. Digite o nome de usuário do Instagram do seu chefe e envie o convite.
4. O seu chefe precisa aceitar o convite em [instagram.com/accounts/manage_access](https://www.instagram.com/accounts/manage_access).

---

## 5. Copiar as credenciais para o .env.local

1. No painel do app, vá em **"Configurações básicas"** (Basic Settings).
2. Copie o **App ID** e o **App Secret**.
3. Abra o arquivo `.env.local` na raiz do projeto e preencha:

```env
INSTAGRAM_APP_ID=123456789012345
INSTAGRAM_APP_SECRET=abc123def456ghi789jkl012mno345pq
```

---

## 6. Testar a conexão

1. Inicie o servidor: `npm run dev`
2. Acesse `http://localhost:3000/login` e crie uma conta (ou entre).
3. Vá em **Settings → Integrações**.
4. Clique em **"Conectar"** ao lado de "Instagram Graph API".
5. Você será redirecionado para o Instagram, autorize o app.
6. Pronto! O token será salvo no banco e o status ficará "Conectado".

---

## Escopos solicitados

| Escopo | Para quê |
|--------|----------|
| `user_profile` | Nome, foto de perfil, username |
| `user_media` | Lista de posts, reels e stories |
| `instagram_manage_insights` | Impressões, alcance, engajamento |

---

## Publicar o app (quando quiser usar em produção)

Enquanto o app está em modo **desenvolvimento**, apenas testers podem conectar.
Para usar com qualquer conta Instagram:

1. Vá em **"Revisão do App"** → **"Permissões e funcionalidades"**.
2. Solicite aprovação para os escopos `user_profile` e `user_media`.
3. A Meta revisa em ~5 dias úteis.

Para uso pessoal (só o seu chefe), o modo desenvolvimento com tester é suficiente.

---

## Renovação do token

O token do Instagram dura **60 dias**. O dashboard pode renovar automaticamente.
Uma futura melhoria é adicionar um cron job no Supabase Edge Functions para renovar
antes de expirar, chamando:

```
GET https://graph.instagram.com/refresh_access_token
  ?grant_type=ig_refresh_token
  &access_token=TOKEN_ATUAL
```
