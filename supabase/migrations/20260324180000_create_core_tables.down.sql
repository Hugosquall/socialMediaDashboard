drop policy if exists "competitors_delete_own" on public.competitors;
drop policy if exists "competitors_update_own" on public.competitors;
drop policy if exists "competitors_insert_own" on public.competitors;
drop policy if exists "competitors_select_own" on public.competitors;

drop policy if exists "instagram_tokens_delete_own" on public.instagram_tokens;
drop policy if exists "instagram_tokens_update_own" on public.instagram_tokens;
drop policy if exists "instagram_tokens_insert_own" on public.instagram_tokens;
drop policy if exists "instagram_tokens_select_own" on public.instagram_tokens;

drop policy if exists "posts_delete_own" on public.posts;
drop policy if exists "posts_update_own" on public.posts;
drop policy if exists "posts_insert_own" on public.posts;
drop policy if exists "posts_select_own" on public.posts;

drop policy if exists "profiles_delete_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;

drop trigger if exists set_competitors_updated_at on public.competitors;
drop trigger if exists set_instagram_tokens_updated_at on public.instagram_tokens;
drop trigger if exists set_posts_updated_at on public.posts;
drop trigger if exists set_profiles_updated_at on public.profiles;

drop function if exists public.set_updated_at();

drop index if exists competitors_name_idx;
drop index if exists competitors_user_id_is_active_idx;
drop index if exists competitors_user_id_idx;

drop index if exists posts_instagram_post_id_idx;
drop index if exists posts_published_at_idx;
drop index if exists posts_scheduled_at_idx;
drop index if exists posts_status_idx;
drop index if exists posts_user_id_status_idx;
drop index if exists posts_user_id_idx;

drop index if exists profiles_handle_idx;

drop index if exists instagram_tokens_user_id_idx;

drop table if exists public.competitors;
drop table if exists public.instagram_tokens;
drop table if exists public.posts;
drop table if exists public.profiles;
