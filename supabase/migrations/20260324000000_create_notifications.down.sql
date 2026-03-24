drop policy if exists "notifications_delete_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_insert_own" on public.notifications;
drop policy if exists "notifications_select_own" on public.notifications;

drop trigger if exists set_notifications_updated_at on public.notifications;
drop function if exists public.set_notifications_updated_at();

drop index if exists notifications_dismissed_at_idx;
drop index if exists notifications_read_at_idx;
drop index if exists notifications_user_id_created_at_idx;
drop index if exists notifications_user_id_idx;

drop table if exists public.notifications;
