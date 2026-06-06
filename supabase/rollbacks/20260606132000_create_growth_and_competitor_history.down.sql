drop policy if exists "competitor_snapshots_delete_own" on public.competitor_snapshots;
drop policy if exists "competitor_snapshots_update_own" on public.competitor_snapshots;
drop policy if exists "competitor_snapshots_insert_own" on public.competitor_snapshots;
drop policy if exists "competitor_snapshots_select_own" on public.competitor_snapshots;

drop policy if exists "growth_experiments_delete_own" on public.growth_experiments;
drop policy if exists "growth_experiments_update_own" on public.growth_experiments;
drop policy if exists "growth_experiments_insert_own" on public.growth_experiments;
drop policy if exists "growth_experiments_select_own" on public.growth_experiments;

drop trigger if exists set_growth_experiments_updated_at on public.growth_experiments;

drop index if exists competitor_snapshots_competitor_platform_idx;
drop index if exists competitor_snapshots_user_id_captured_at_idx;
drop index if exists growth_experiments_user_id_created_at_idx;

drop table if exists public.competitor_snapshots;
drop table if exists public.growth_experiments;
