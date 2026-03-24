create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  category text not null,
  title text not null,
  body text not null,
  time_label text,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_type_check
    check (type in ('like', 'comment', 'follow', 'mention', 'competitor', 'alert', 'success')),
  constraint notifications_category_check
    check (category in ('instagram', 'competitors', 'system'))
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_read_at_idx
  on public.notifications (read_at);

create index if not exists notifications_dismissed_at_idx
  on public.notifications (dismissed_at);

create or replace function public.set_notifications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notifications_updated_at on public.notifications;

create trigger set_notifications_updated_at
before update on public.notifications
for each row
execute function public.set_notifications_updated_at();

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own"
  on public.notifications
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications
  for delete
  using (auth.uid() = user_id);
