-- Gift image shown above the receiver's letter.
alter table public.gift_contents add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('allura-gift-images', 'allura-gift-images', true)
on conflict (id) do update set public = true;

drop policy if exists allura_gift_images_public_read on storage.objects;
create policy allura_gift_images_public_read on storage.objects
for select using (bucket_id = 'allura-gift-images');

drop policy if exists allura_gift_images_owner_insert on storage.objects;
create policy allura_gift_images_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'allura-gift-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists allura_gift_images_owner_update on storage.objects;
create policy allura_gift_images_owner_update on storage.objects
for update to authenticated
using (bucket_id = 'allura-gift-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'allura-gift-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists allura_gift_images_owner_delete on storage.objects;
create policy allura_gift_images_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'allura-gift-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop function if exists public.verify_receiver_email(text, text);
create function public.verify_receiver_email(p_nfc_token text, p_email text)
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
  image_url text
)
language sql
security definer
set search_path = public
as $$
  select g.id, g.lamp_id, g.receiver_name, g.occasion, g.custom_occasion,
         g.title, g.message, g.signature, g.voice_file_id, g.image_url
  from public.gift_contents g
  join public.lamps l on l.id = g.lamp_id
  where l.nfc_token = p_nfc_token
    and l.status = 'active'
    and g.status = 'ready'
    and lower(trim(g.receiver_email)) = lower(trim(p_email));
$$;
