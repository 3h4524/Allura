-- Allura MVP database schema for Supabase
-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ---------- Enums ----------
do $$ begin
  create type public.user_status as enum ('active', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lamp_status as enum ('inactive', 'active', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gift_status as enum ('draft', 'ready');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.content_status as enum ('active', 'hidden');
exception when duplicate_object then null; end $$;

-- ---------- User profile ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));

-- ---------- Lamp ----------
create table if not exists public.lamps (
  id uuid primary key default gen_random_uuid(),
  nfc_token text not null unique,
  owner_id uuid references public.profiles(id) on delete set null,
  status public.lamp_status not null default 'inactive',
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lamps_nfc_token_not_blank check (length(trim(nfc_token)) >= 16)
);

-- One lamp can have one current gift in the MVP.
create table if not exists public.gift_contents (
  id uuid primary key default gen_random_uuid(),
  lamp_id uuid not null unique references public.lamps(id) on delete cascade,
  receiver_name text not null,
  receiver_email text not null,
  occasion text not null,
  custom_occasion text,
  title text not null,
  message text not null,
  signature text,
  voice_file_id uuid,
  status public.gift_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_receiver_email_not_blank check (length(trim(receiver_email)) > 3)
);

-- ---------- Private voice files ----------
create table if not exists public.voice_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_key text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size integer not null,
  duration_seconds numeric(10,2),
  created_at timestamptz not null default now(),
  constraint voice_file_type_check check (mime_type in ('audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav')),
  constraint voice_file_size_check check (file_size > 0 and file_size <= 52428800)
);

do $$ begin
  alter table public.gift_contents
    add constraint gift_contents_voice_file_fk
    foreign key (voice_file_id) references public.voice_files(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------- System music ----------
create table if not exists public.music_moods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  thumbnail text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.music (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  mood_id uuid not null references public.music_moods(id) on delete restrict,
  audio_path text not null,
  duration_seconds numeric(10,2),
  thumbnail text,
  status public.content_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Receiver sessions ----------
-- The raw email is never returned to the receiver client.
create table if not exists public.receiver_sessions (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gift_contents(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists lamps_owner_id_idx on public.lamps(owner_id);
create index if not exists gifts_lamp_id_idx on public.gift_contents(lamp_id);
create index if not exists music_mood_id_idx on public.music(mood_id);
create index if not exists receiver_sessions_expiry_idx on public.receiver_sessions(expires_at);

-- ---------- Generic updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists lamps_set_updated_at on public.lamps;
create trigger lamps_set_updated_at before update on public.lamps
for each row execute function public.set_updated_at();

drop trigger if exists gifts_set_updated_at on public.gift_contents;
create trigger gifts_set_updated_at before update on public.gift_contents
for each row execute function public.set_updated_at();

drop trigger if exists music_set_updated_at on public.music;
create trigger music_set_updated_at before update on public.music
for each row execute function public.set_updated_at();

-- Create a profile automatically after Supabase Auth registration.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    lower(new.email)
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Secure lamp claiming ----------
create or replace function public.claim_lamp(p_nfc_token text)
returns public.lamps
language plpgsql
security invoker
set search_path = public
as $$
declare claimed public.lamps;
begin
  update public.lamps
  set owner_id = auth.uid(), status = 'active', activated_at = coalesce(activated_at, now()), updated_at = now()
  where nfc_token = p_nfc_token
    and status = 'inactive'
    and owner_id is null
    and auth.uid() is not null
  returning * into claimed;

  if claimed.id is null then
    raise exception 'lamp_not_available';
  end if;
  return claimed;
end;
$$;

-- ---------- Receiver verification ----------
-- Backend should call this with service role or expose it through a controlled API.
-- It returns only gift content; receiver_email is intentionally omitted.
create or replace function public.verify_receiver_email(p_nfc_token text, p_email text)
returns table (
  gift_id uuid,
  lamp_id uuid,
  receiver_name text,
  occasion text,
  custom_occasion text,
  title text,
  message text,
  signature text,
  voice_file_id uuid
)
language sql
security definer
set search_path = public
as $$
  select g.id, g.lamp_id, g.receiver_name, g.occasion, g.custom_occasion,
         g.title, g.message, g.signature, g.voice_file_id
  from public.gift_contents g
  join public.lamps l on l.id = g.lamp_id
  where l.nfc_token = p_nfc_token
    and l.status = 'active'
    and g.status = 'ready'
    and lower(trim(g.receiver_email)) = lower(trim(p_email));
$$;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.lamps enable row level security;
alter table public.gift_contents enable row level security;
alter table public.voice_files enable row level security;
alter table public.music_moods enable row level security;
alter table public.music enable row level security;
alter table public.receiver_sessions enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists lamps_select_owner on public.lamps;
create policy lamps_select_owner on public.lamps for select using (owner_id = auth.uid());
drop policy if exists lamps_insert_authenticated on public.lamps;
create policy lamps_insert_authenticated on public.lamps for insert to authenticated with check (owner_id is null);
drop policy if exists lamps_update_owner on public.lamps;
create policy lamps_update_owner on public.lamps for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists gifts_select_owner on public.gift_contents;
create policy gifts_select_owner on public.gift_contents for select using (
  exists (select 1 from public.lamps l where l.id = lamp_id and l.owner_id = auth.uid())
);
drop policy if exists gifts_insert_owner on public.gift_contents;
create policy gifts_insert_owner on public.gift_contents for insert to authenticated with check (
  exists (select 1 from public.lamps l where l.id = lamp_id and l.owner_id = auth.uid())
);
drop policy if exists gifts_update_owner on public.gift_contents;
create policy gifts_update_owner on public.gift_contents for update using (
  exists (select 1 from public.lamps l where l.id = lamp_id and l.owner_id = auth.uid())
);

drop policy if exists voice_select_owner on public.voice_files;
create policy voice_select_owner on public.voice_files for select using (owner_id = auth.uid());
drop policy if exists voice_insert_owner on public.voice_files;
create policy voice_insert_owner on public.voice_files for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists voice_delete_owner on public.voice_files;
create policy voice_delete_owner on public.voice_files for delete using (owner_id = auth.uid());

drop policy if exists moods_public_select on public.music_moods;
create policy moods_public_select on public.music_moods for select using (true);
drop policy if exists music_public_select on public.music;
create policy music_public_select on public.music for select using (status = 'active');

-- Receiver sessions are created/consumed by the backend only.
revoke all on public.receiver_sessions from anon, authenticated;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public)
values ('allura-voice', 'allura-voice', false)
on conflict (id) do update set public = false;

drop policy if exists allura_voice_owner_read on storage.objects;
create policy allura_voice_owner_read on storage.objects
for select to authenticated
using (bucket_id = 'allura-voice' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists allura_voice_owner_insert on storage.objects;
create policy allura_voice_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'allura-voice' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists allura_voice_owner_delete on storage.objects;
create policy allura_voice_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'allura-voice' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Seed moods ----------
insert into public.music_moods (name, description, display_order)
values
  ('Relax', 'Nhẹ nhàng và thư giãn', 1),
  ('Sleep', 'Âm thanh cho giấc ngủ sâu', 2),
  ('Focus', 'Tập trung vào điều quan trọng', 3),
  ('Meditation', 'Một khoảng lặng cho tâm trí', 4),
  ('Romantic', 'Dịu dàng cho hai người', 5),
  ('Nature', 'Thanh âm từ thiên nhiên', 6)
on conflict (name) do nothing;
