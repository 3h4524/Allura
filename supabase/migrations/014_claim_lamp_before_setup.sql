-- Keep the lamp pending while the buyer creates the gift.
-- The setup save activates the lamp after gift_contents is ready.

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
      status = 'inactive',
      activated_at = null,
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
