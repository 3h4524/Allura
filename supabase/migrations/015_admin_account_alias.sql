-- The login form accepts "admin" as a friendly alias for this Supabase Auth email.
-- Create the Auth user once with this email and password admin@123, then the
-- profile trigger grants the admin flag used by the /admin page and RLS policies.

update public.profiles
set is_admin = true
where lower(trim(email)) = 'admin@allura.dev';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(new.email, '')));
begin
  insert into public.profiles (id, full_name, email, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    normalized_email,
    normalized_email = 'admin@allura.dev'
  )
  on conflict (id) do update
  set email = excluded.email,
      is_admin = excluded.is_admin;
  return new;
end;
$$;
