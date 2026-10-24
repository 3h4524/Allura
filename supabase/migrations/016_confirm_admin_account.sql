-- Confirm the dedicated development/admin account so it can sign in without
-- relying on an inbox for the internal admin email.

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(trim(email)) = 'admin@allura.dev';

insert into public.profiles (id, full_name, email, is_admin)
select id,
       coalesce(raw_user_meta_data ->> 'full_name', ''),
       lower(trim(email)),
       true
from auth.users
where lower(trim(email)) = 'admin@allura.dev'
on conflict (id) do update
set email = excluded.email,
    is_admin = true;
