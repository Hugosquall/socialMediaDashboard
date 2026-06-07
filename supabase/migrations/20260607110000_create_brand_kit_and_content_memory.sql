create table if not exists public.brand_kit (
  user_id uuid primary key references auth.users (id) on delete cascade,
  logo_url text,
  primary_color text not null default '#22d3ee',
  accent_color text not null default '#34d399',
  tone text not null default 'Tecnico, claro, pragmatico e sem hype',
  default_cta text not null default 'Salve para revisar antes do proximo planejamento tecnico.',
  signature text not null default 'IA aplicada, desenvolvimento e qualidade de software.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_memory_type_check
    check (type in ('hook', 'cta', 'theme', 'learning'))
);

create index if not exists content_memory_user_id_created_at_idx
  on public.content_memory (user_id, created_at desc);

create index if not exists content_memory_user_id_type_idx
  on public.content_memory (user_id, type);

drop trigger if exists set_brand_kit_updated_at on public.brand_kit;
create trigger set_brand_kit_updated_at
before update on public.brand_kit
for each row
execute function public.set_updated_at();

drop trigger if exists set_content_memory_updated_at on public.content_memory;
create trigger set_content_memory_updated_at
before update on public.content_memory
for each row
execute function public.set_updated_at();

alter table public.brand_kit enable row level security;
alter table public.content_memory enable row level security;

drop policy if exists "brand_kit_select_own" on public.brand_kit;
create policy "brand_kit_select_own"
  on public.brand_kit
  for select
  using (auth.uid() = user_id);

drop policy if exists "brand_kit_insert_own" on public.brand_kit;
create policy "brand_kit_insert_own"
  on public.brand_kit
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "brand_kit_update_own" on public.brand_kit;
create policy "brand_kit_update_own"
  on public.brand_kit
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "content_memory_select_own" on public.content_memory;
create policy "content_memory_select_own"
  on public.content_memory
  for select
  using (auth.uid() = user_id);

drop policy if exists "content_memory_insert_own" on public.content_memory;
create policy "content_memory_insert_own"
  on public.content_memory
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "content_memory_update_own" on public.content_memory;
create policy "content_memory_update_own"
  on public.content_memory
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "content_memory_delete_own" on public.content_memory;
create policy "content_memory_delete_own"
  on public.content_memory
  for delete
  using (auth.uid() = user_id);
