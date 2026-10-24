create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.gift_contents
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

comment on column public.gift_contents.image_urls is 'Ordered public image URLs for the gift gallery';

drop function if exists public.verify_receiver_code(text, text);
create function public.verify_receiver_code(p_nfc_token text, p_code text)
returns table (
  gift_id uuid,
  lamp_id uuid,
  receiver_name text,
  occasion text,
  custom_occasion text,
  title text,
  message text,
  signature text,
  voice_file_id uuid,
  image_url text,
  image_urls jsonb
)
language sql
security definer
set search_path = public, extensions
as $$
  select g.id, g.lamp_id, g.receiver_name, g.occasion, g.custom_occasion,
         g.title, g.message, g.signature, g.voice_file_id, g.image_url, g.image_urls
  from public.gift_contents g
  join public.lamps l on l.id = g.lamp_id
  where l.nfc_token = p_nfc_token
    and l.status = 'active'
    and g.status = 'ready'
    and g.receiver_code_hash = encode(digest(trim(p_code), 'sha256'), 'hex');
$$;
