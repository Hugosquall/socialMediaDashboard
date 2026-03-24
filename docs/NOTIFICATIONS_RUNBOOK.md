# Runbook de Notificações

Documento operacional para aplicar a migration de notificações sem Supabase CLI.

## Objetivo

Criar e validar a tabela `public.notifications` no Supabase, habilitando a central de notificações persistida por usuário.

## Quando usar

- Quando a tabela `notifications` ainda não existe no projeto.
- Quando a página `/notifications` exibe erro de infraestrutura ou seed inicial não funciona.
- Quando for necessário validar manualmente a estrutura no ambiente Supabase.

## Pré-requisitos

- Acesso ao projeto no painel do Supabase.
- Permissão para abrir o `SQL Editor`.
- O arquivo de migration local disponível em `supabase/migrations/20260324000000_create_notifications.sql`.

## Aplicação Manual

1. Abra o projeto no painel do Supabase.
2. Acesse `SQL Editor`.
3. Crie uma nova query.
4. Copie o conteúdo da migration `supabase/migrations/20260324000000_create_notifications.sql`.
5. Execute a query.
6. Aguarde a confirmação de sucesso do editor.

O script cria:

- tabela `public.notifications`
- constraints de tipo e categoria
- índices para consulta por usuário e data
- trigger de `updated_at`
- policies de RLS por `auth.uid() = user_id`

## Validação do Health

Depois de aplicar a migration, valide também o endpoint de saúde:

1. Abra `GET /api/notifications/health` autenticado.
2. Confirme que a resposta retorna `ok: true` e `status: "ready"`.
3. Acesse `/notifications` e verifique se o indicador visual aparece como saudável.

## Rollback

Se precisar desfazer a migration:

1. Abra `SQL Editor` no Supabase.
2. Execute o conteúdo de `supabase/migrations/20260324000000_create_notifications.down.sql`.
3. Confirme que a tabela e os objetos associados foram removidos.

## Validação

Após aplicar a migration, valide estes pontos:

1. A tabela `public.notifications` existe no schema.
2. O RLS está habilitado na tabela.
3. As policies `notifications_select_own`, `notifications_insert_own`, `notifications_update_own` e `notifications_delete_own` estão presentes.
4. `GET /api/notifications/health` retorna `ok: true` e `status: "ready"`.
5. A página `/notifications` carrega sem erro e mostra o seed inicial na primeira execução.
6. O indicador visual de health na página mostra estado pronto.
7. Ação de marcar como lida, marcar todas e dispensar persiste ao recarregar a página.

## Consulta útil

Verifique rapidamente se a tabela está funcionando:

```sql
select
  id,
  user_id,
  type,
  category,
  title,
  read_at,
  dismissed_at,
  created_at
from public.notifications
order by created_at desc
limit 20;
```

## Sinal de falha comum

Se a UI mostrar `NOTIFICATIONS_TABLE_MISSING`, a migration ainda não foi aplicada no ambiente atual. Execute novamente o SQL do arquivo de migration no `SQL Editor`.
