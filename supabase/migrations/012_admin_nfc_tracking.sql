-- Allow admins to reconcile an issued NFC with the account that claimed it.
-- Regular users can still read only their own profile.

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.current_user_is_admin()
);

create index if not exists lamps_status_created_at_idx
  on public.lamps(status, created_at desc);
