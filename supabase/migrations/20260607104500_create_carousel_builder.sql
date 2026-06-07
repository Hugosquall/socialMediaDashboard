create table if not exists public.carousel_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_type text not null default 'manual',
  source_url text,
  theme text not null default 'signal',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carousel_projects_source_type_check
    check (source_type in ('manual', 'news', 'growth')),
  constraint carousel_projects_status_check
    check (status in ('draft', 'exported', 'sent_to_instagram'))
);

create table if not exists public.carousel_slides (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.carousel_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null,
  headline text not null,
  body text not null default '',
  visual_hint text,
  speaker_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carousel_slides_position_check
    check (position > 0)
);

create index if not exists carousel_projects_user_id_created_at_idx
  on public.carousel_projects (user_id, created_at desc);

create index if not exists carousel_slides_project_id_position_idx
  on public.carousel_slides (project_id, position);

drop trigger if exists set_carousel_projects_updated_at on public.carousel_projects;
create trigger set_carousel_projects_updated_at
before update on public.carousel_projects
for each row
execute function public.set_updated_at();

drop trigger if exists set_carousel_slides_updated_at on public.carousel_slides;
create trigger set_carousel_slides_updated_at
before update on public.carousel_slides
for each row
execute function public.set_updated_at();

alter table public.carousel_projects enable row level security;
alter table public.carousel_slides enable row level security;

drop policy if exists "carousel_projects_select_own" on public.carousel_projects;
create policy "carousel_projects_select_own"
  on public.carousel_projects
  for select
  using (auth.uid() = user_id);

drop policy if exists "carousel_projects_insert_own" on public.carousel_projects;
create policy "carousel_projects_insert_own"
  on public.carousel_projects
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "carousel_projects_update_own" on public.carousel_projects;
create policy "carousel_projects_update_own"
  on public.carousel_projects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "carousel_projects_delete_own" on public.carousel_projects;
create policy "carousel_projects_delete_own"
  on public.carousel_projects
  for delete
  using (auth.uid() = user_id);

drop policy if exists "carousel_slides_select_own" on public.carousel_slides;
create policy "carousel_slides_select_own"
  on public.carousel_slides
  for select
  using (auth.uid() = user_id);

drop policy if exists "carousel_slides_insert_own" on public.carousel_slides;
create policy "carousel_slides_insert_own"
  on public.carousel_slides
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "carousel_slides_update_own" on public.carousel_slides;
create policy "carousel_slides_update_own"
  on public.carousel_slides
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "carousel_slides_delete_own" on public.carousel_slides;
create policy "carousel_slides_delete_own"
  on public.carousel_slides
  for delete
  using (auth.uid() = user_id);
