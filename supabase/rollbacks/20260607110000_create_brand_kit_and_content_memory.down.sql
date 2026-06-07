drop policy if exists "content_memory_delete_own" on public.content_memory;
drop policy if exists "content_memory_update_own" on public.content_memory;
drop policy if exists "content_memory_insert_own" on public.content_memory;
drop policy if exists "content_memory_select_own" on public.content_memory;

drop policy if exists "brand_kit_update_own" on public.brand_kit;
drop policy if exists "brand_kit_insert_own" on public.brand_kit;
drop policy if exists "brand_kit_select_own" on public.brand_kit;

drop trigger if exists set_content_memory_updated_at on public.content_memory;
drop trigger if exists set_brand_kit_updated_at on public.brand_kit;

drop index if exists content_memory_user_id_type_idx;
drop index if exists content_memory_user_id_created_at_idx;

drop table if exists public.content_memory;
drop table if exists public.brand_kit;
