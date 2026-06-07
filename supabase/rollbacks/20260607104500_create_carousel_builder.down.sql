drop policy if exists "carousel_slides_delete_own" on public.carousel_slides;
drop policy if exists "carousel_slides_update_own" on public.carousel_slides;
drop policy if exists "carousel_slides_insert_own" on public.carousel_slides;
drop policy if exists "carousel_slides_select_own" on public.carousel_slides;

drop policy if exists "carousel_projects_delete_own" on public.carousel_projects;
drop policy if exists "carousel_projects_update_own" on public.carousel_projects;
drop policy if exists "carousel_projects_insert_own" on public.carousel_projects;
drop policy if exists "carousel_projects_select_own" on public.carousel_projects;

drop trigger if exists set_carousel_slides_updated_at on public.carousel_slides;
drop trigger if exists set_carousel_projects_updated_at on public.carousel_projects;

drop index if exists carousel_slides_project_id_position_idx;
drop index if exists carousel_projects_user_id_created_at_idx;

drop table if exists public.carousel_slides;
drop table if exists public.carousel_projects;
