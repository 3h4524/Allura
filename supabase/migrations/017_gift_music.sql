-- Adds an optional music track to each gift and exposes it after receiver verification.

alter table public.gift_contents
  add column if not exists music_id uuid references public.music(id) on delete set null;

create index if not exists gift_contents_music_id_idx on public.gift_contents(music_id);

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
  music_id uuid,
  image_url text,
  image_urls jsonb,
  image_positions jsonb
)
language sql
security definer
set search_path = public, extensions
as $$
  select g.id, g.lamp_id, g.receiver_name, g.occasion, g.custom_occasion,
         g.title, g.message, g.signature, g.voice_file_id, g.music_id,
         g.image_url, g.image_urls, g.image_positions
  from public.gift_contents g
  join public.lamps l on l.id = g.lamp_id
  where l.nfc_token = p_nfc_token
    and l.status = 'active'
    and g.status = 'ready'
    and g.receiver_code_hash = encode(digest(trim(p_code), 'sha256'), 'hex');
$$;
