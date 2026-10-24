-- Admin-created orders and NFC gift issuing.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists public.admin_orders (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  lamp_id uuid references public.lamps(id) on delete set null,
  gift_id uuid references public.gift_contents(id) on delete set null,
  buyer_name text not null,
  buyer_email text,
  buyer_phone text,
  buyer_address text,
  buyer_note text,
  product_name text not null,
  variant_name text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  receiver_name text not null,
  receiver_email text not null,
  occasion text not null default 'Khác',
  title text not null,
  message text not null,
  signature text,
  image_url text,
  nfc_token text unique,
  status text not null default 'draft' check (status in ('draft', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists admin_orders_status_idx on public.admin_orders(status, created_at desc);
alter table public.admin_orders enable row level security;

drop policy if exists admin_orders_admin_all on public.admin_orders;
create policy admin_orders_admin_all on public.admin_orders
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists lamps_admin_select on public.lamps;
create policy lamps_admin_select on public.lamps for select using (
  owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists lamps_admin_insert on public.lamps;
create policy lamps_admin_insert on public.lamps for insert to authenticated with check (
  owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists gifts_admin_select on public.gift_contents;
create policy gifts_admin_select on public.gift_contents for select using (
  exists (select 1 from public.lamps l where l.id = lamp_id and l.owner_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists gifts_admin_insert on public.gift_contents;
create policy gifts_admin_insert on public.gift_contents for insert to authenticated with check (
  exists (select 1 from public.lamps l where l.id = lamp_id and l.owner_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists gifts_admin_update on public.gift_contents;
create policy gifts_admin_update on public.gift_contents for update using (
  exists (select 1 from public.lamps l where l.id = lamp_id and l.owner_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);
