-- Orders and PayOS payment state. Payment confirmation is webhook-driven.
do $$ begin
  create type public.order_status as enum ('pending_payment', 'paid', 'cancelled', 'expired', 'fulfilled');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code bigint not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'VND',
  status public.order_status not null default 'pending_payment',
  payos_payment_link_id text unique,
  payos_checkout_url text,
  payos_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  product_name text not null,
  variant_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_lamps (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  lamp_id uuid not null unique references public.lamps(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(order_id, lamp_id)
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_lamps_order_id_idx on public.order_lamps(order_id);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_lamps enable row level security;

drop policy if exists orders_owner_select on public.orders;
create policy orders_owner_select on public.orders for select using (user_id = auth.uid());
drop policy if exists orders_owner_insert on public.orders;
create policy orders_owner_insert on public.orders for insert to authenticated with check (user_id = auth.uid());
drop policy if exists order_items_owner_select on public.order_items;
create policy order_items_owner_select on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
drop policy if exists order_lamps_owner_select on public.order_lamps;
create policy order_lamps_owner_select on public.order_lamps for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
