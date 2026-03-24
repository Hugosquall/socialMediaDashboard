create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  handle text not null default '',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  caption text not null default '',
  type text not null default 'post',
  status text not null default 'draft',
  platform text not null default 'instagram',
  media_url text,
  instagram_post_id text,
  scheduled_at timestamptz,
  published_at timestamptz,
  likes integer,
  comments integer,
  shares integer,
  saves integer,
  impressions integer,
  reach integer,
  engagement_rate numeric,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_type_check
    check (type in ('post', 'reels', 'story', 'carrossel')),
  constraint posts_status_check
    check (status in ('scheduled', 'draft', 'published', 'backlog'))
);

create table if not exists public.instagram_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  instagram_user_id text not null,
  instagram_username text,
  access_token text not null,
  token_type text not null default 'bearer',
  scope text not null default 'user_profile,user_media',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  instagram_handle text,
  tiktok_handle text,
  twitter_handle text,
  youtube_handle text,
  followers integer,
  avg_engagement numeric,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitors_followers_check
    check (followers is null or followers >= 0),
  constraint competitors_avg_engagement_check
    check (avg_engagement is null or avg_engagement >= 0)
);

create unique index if not exists instagram_tokens_user_id_idx
  on public.instagram_tokens (user_id);

create index if not exists profiles_handle_idx
  on public.profiles (handle);

create index if not exists posts_user_id_idx
  on public.posts (user_id);

create index if not exists posts_user_id_status_idx
  on public.posts (user_id, status);

create index if not exists posts_status_idx
  on public.posts (status);

create index if not exists posts_scheduled_at_idx
  on public.posts (scheduled_at);

create index if not exists posts_published_at_idx
  on public.posts (published_at);

create index if not exists posts_instagram_post_id_idx
  on public.posts (instagram_post_id);

create index if not exists competitors_user_id_idx
  on public.competitors (user_id);

create index if not exists competitors_user_id_is_active_idx
  on public.competitors (user_id, is_active);

create index if not exists competitors_name_idx
  on public.competitors (name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

drop trigger if exists set_instagram_tokens_updated_at on public.instagram_tokens;
create trigger set_instagram_tokens_updated_at
before update on public.instagram_tokens
for each row
execute function public.set_updated_at();

drop trigger if exists set_competitors_updated_at on public.competitors;
create trigger set_competitors_updated_at
before update on public.competitors
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.instagram_tokens enable row level security;
alter table public.competitors enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles
  for delete
  using (auth.uid() = id);

drop policy if exists "posts_select_own" on public.posts;
create policy "posts_select_own"
  on public.posts
  for select
  using (auth.uid() = user_id);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
  on public.posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
  on public.posts
  for delete
  using (auth.uid() = user_id);

drop policy if exists "instagram_tokens_select_own" on public.instagram_tokens;
create policy "instagram_tokens_select_own"
  on public.instagram_tokens
  for select
  using (auth.uid() = user_id);

drop policy if exists "instagram_tokens_insert_own" on public.instagram_tokens;
create policy "instagram_tokens_insert_own"
  on public.instagram_tokens
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "instagram_tokens_update_own" on public.instagram_tokens;
create policy "instagram_tokens_update_own"
  on public.instagram_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "instagram_tokens_delete_own" on public.instagram_tokens;
create policy "instagram_tokens_delete_own"
  on public.instagram_tokens
  for delete
  using (auth.uid() = user_id);

drop policy if exists "competitors_select_own" on public.competitors;
create policy "competitors_select_own"
  on public.competitors
  for select
  using (auth.uid() = user_id);

drop policy if exists "competitors_insert_own" on public.competitors;
create policy "competitors_insert_own"
  on public.competitors
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "competitors_update_own" on public.competitors;
create policy "competitors_update_own"
  on public.competitors
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "competitors_delete_own" on public.competitors;
create policy "competitors_delete_own"
  on public.competitors
  for delete
  using (auth.uid() = user_id);
