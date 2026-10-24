-- Assign an admin-issued NFC lamp to the buyer who owns the matching email.
-- The lamp remains inactive until the buyer signs in and claims it.

create index if not exists admin_orders_buyer_email_idx
  on public.admin_orders (lower(buyer_email));

alter table public.admin_orders
  add column if not exists assigned_at timestamptz;

alter table public.admin_orders alter column receiver_name drop not null;
alter table public.admin_orders alter column receiver_email drop not null;
alter table public.admin_orders alter column title drop not null;
alter table public.admin_orders alter column message drop not null;

-- Only the admin issuing an order may create an unclaimed lamp.
drop policy if exists lamps_insert_authenticated on public.lamps;
drop policy if exists lamps_admin_insert on public.lamps;
create policy lamps_admin_insert on public.lamps
for insert to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists lamps_admin_delete on public.lamps;
create policy lamps_admin_delete on public.lamps
for delete to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

create or replace function public.claim_lamp(p_nfc_token text)
returns public.lamps
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.lamps;
  caller_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if auth.uid() is null or caller_email = '' then
    raise exception 'authentication_required';
  end if;

  update public.lamps l
  set owner_id = auth.uid(),
      status = 'active',
      activated_at = coalesce(l.activated_at, now()),
      updated_at = now()
  where l.nfc_token = trim(p_nfc_token)
    and l.status = 'inactive'
    and l.owner_id is null
    and exists (
      select 1
      from public.admin_orders o
      where o.lamp_id = l.id
        and o.status in ('draft', 'completed')
        and lower(trim(coalesce(o.buyer_email, ''))) = caller_email
    )
  returning l.* into claimed;

  if claimed.id is null then
    raise exception 'lamp_not_assigned_to_account';
  end if;

  update public.admin_orders
  set assigned_at = coalesce(assigned_at, now())
  where lamp_id = claimed.id;

  return claimed;
end;
$$;

revoke all on function public.claim_lamp(text) from public;
grant execute on function public.claim_lamp(text) to authenticated;

-- Public-safe status lookup for the NFC entry route. It never returns the
-- buyer email or the owner id.
create or replace function public.get_lamp_status(p_nfc_token text)
returns table (
  lamp_id uuid,
  lamp_status text,
  has_ready_gift boolean,
  is_owner boolean
)
language sql
security definer
set search_path = public
as $$
  select
    l.id,
    l.status::text,
    exists (
      select 1
      from public.gift_contents g
      where g.lamp_id = l.id
        and g.status = 'ready'
    ),
    l.owner_id = auth.uid()
  from public.lamps l
  where l.nfc_token = trim(p_nfc_token)
  limit 1;
$$;

revoke all on function public.get_lamp_status(text) from public;
grant execute on function public.get_lamp_status(text) to anon, authenticated;
