-- Storage for the Allura music library.
insert into storage.buckets (id, name, public)
values ('allura-music', 'allura-music', true)
on conflict (id) do update set public = true;

drop policy if exists allura_music_public_read on storage.objects;
create policy allura_music_public_read on storage.objects
for select using (bucket_id = 'allura-music');

-- Uploads are performed by the admin/service role. Public users only read active music metadata.
drop policy if exists music_public_select on public.music;
create policy music_public_select on public.music for select using (status = 'active');
