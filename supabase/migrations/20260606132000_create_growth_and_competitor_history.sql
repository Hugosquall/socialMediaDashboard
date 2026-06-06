create table if not exists public.growth_experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id text not null,
  prompt_title text not null,
  input jsonb not null default '{}'::jsonb,
  generated_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  platform text not null,
  handle text not null,
  followers integer,
  followers_delta integer,
  engagement_rate numeric,
  posts_per_week integer,
  avg_likes integer,
  avg_comments integer,
  captured_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  constraint competitor_snapshots_platform_check
    check (platform in ('instagram', 'tiktok', 'twitter', 'youtube')),
  constraint competitor_snapshots_followers_check
    check (followers is null or followers >= 0),
  constraint competitor_snapshots_posts_check
    check (posts_per_week is null or posts_per_week >= 0),
  constraint competitor_snapshots_likes_check
    check (avg_likes is null or avg_likes >= 0),
  constraint competitor_snapshots_comments_check
    check (avg_comments is null or avg_comments >= 0),
  constraint competitor_snapshots_engagement_check
    check (engagement_rate is null or engagement_rate >= 0)
);

create index if not exists growth_experiments_user_id_created_at_idx
  on public.growth_experiments (user_id, created_at desc);

create index if not exists competitor_snapshots_user_id_captured_at_idx
  on public.competitor_snapshots (user_id, captured_at desc);

create index if not exists competitor_snapshots_competitor_platform_idx
  on public.competitor_snapshots (competitor_id, platform, captured_at desc);

drop trigger if exists set_growth_experiments_updated_at on public.growth_experiments;
create trigger set_growth_experiments_updated_at
before update on public.growth_experiments
for each row
execute function public.set_updated_at();

alter table public.growth_experiments enable row level security;
alter table public.competitor_snapshots enable row level security;

drop policy if exists "growth_experiments_select_own" on public.growth_experiments;
create policy "growth_experiments_select_own"
  on public.growth_experiments
  for select
  using (auth.uid() = user_id);

drop policy if exists "growth_experiments_insert_own" on public.growth_experiments;
create policy "growth_experiments_insert_own"
  on public.growth_experiments
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "growth_experiments_update_own" on public.growth_experiments;
create policy "growth_experiments_update_own"
  on public.growth_experiments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "growth_experiments_delete_own" on public.growth_experiments;
create policy "growth_experiments_delete_own"
  on public.growth_experiments
  for delete
  using (auth.uid() = user_id);

drop policy if exists "competitor_snapshots_select_own" on public.competitor_snapshots;
create policy "competitor_snapshots_select_own"
  on public.competitor_snapshots
  for select
  using (auth.uid() = user_id);

drop policy if exists "competitor_snapshots_insert_own" on public.competitor_snapshots;
create policy "competitor_snapshots_insert_own"
  on public.competitor_snapshots
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "competitor_snapshots_update_own" on public.competitor_snapshots;
create policy "competitor_snapshots_update_own"
  on public.competitor_snapshots
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "competitor_snapshots_delete_own" on public.competitor_snapshots;
create policy "competitor_snapshots_delete_own"
  on public.competitor_snapshots
  for delete
  using (auth.uid() = user_id);
