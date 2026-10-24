-- Product catalog and cart foundation for Allura.
-- Product content is stored here so the storefront never hard-codes catalog data.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  eyebrow text not null default 'ALLURA ATELIER',
  description text not null default '',
  short_description text not null default '',
  currency text not null default 'VND',
  status public.content_status not null default 'active',
  rating numeric(2,1),
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  option_group text not null default 'default',
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= price),
  sku text unique,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  status public.content_status not null default 'active',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  storage_provider text not null default 'external',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  icon text not null default 'sparkles',
  title text not null,
  description text not null default '',
  display_order integer not null default 0
);

create table if not exists public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  value text not null,
  display_order integer not null default 0
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  session_id uuid,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (user_id is not null or session_id is not null)
);

create unique index if not exists carts_user_active_idx on public.carts(user_id) where user_id is not null and status = 'active';
create unique index if not exists carts_session_active_idx on public.carts(session_id) where session_id is not null and status = 'active';

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, variant_id)
);

create index if not exists product_variants_product_idx on public.product_variants(product_id, display_order);
create index if not exists product_images_product_idx on public.product_images(product_id, display_order);
create index if not exists product_features_product_idx on public.product_features(product_id, display_order);
create index if not exists product_specs_product_idx on public.product_specs(product_id, display_order);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at before update on public.carts for each row execute function public.set_updated_at();
drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at before update on public.cart_items for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_features enable row level security;
alter table public.product_specs enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists products_public_select on public.products;
create policy products_public_select on public.products for select using (status = 'active');
drop policy if exists variants_public_select on public.product_variants;
create policy variants_public_select on public.product_variants for select using (status = 'active');
drop policy if exists images_public_select on public.product_images;
create policy images_public_select on public.product_images for select using (true);
drop policy if exists features_public_select on public.product_features;
create policy features_public_select on public.product_features for select using (true);
drop policy if exists specs_public_select on public.product_specs;
create policy specs_public_select on public.product_specs for select using (true);

drop policy if exists carts_owner_select on public.carts;
create policy carts_owner_select on public.carts for select using (user_id = auth.uid());
drop policy if exists carts_owner_insert on public.carts;
create policy carts_owner_insert on public.carts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists carts_owner_update on public.carts;
create policy carts_owner_update on public.carts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists cart_items_owner_select on public.cart_items;
create policy cart_items_owner_select on public.cart_items for select using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
drop policy if exists cart_items_owner_insert on public.cart_items;
create policy cart_items_owner_insert on public.cart_items for insert to authenticated with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
drop policy if exists cart_items_owner_update on public.cart_items;
create policy cart_items_owner_update on public.cart_items for update using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

-- Initial catalog content is seed data, not UI hard-code. Replace image_url with Cloudinary URLs later.
insert into public.products (slug, name, eyebrow, description, short_description, rating, review_count)
values ('allura-living-glow', 'Đèn ngủ thông minh Allura Living Glow', 'ALLURA ATELIER • KỶ NIỆM SÁNG', 'Đèn ngủ thủ công từ gỗ óc chó nguyên khối kết hợp vòm thủy tinh mờ tán xạ. Tích hợp chip NFC một chạm để đánh thức lời thì thầm yêu thương, giai điệu ru êm và những kỷ niệm bất tận giữa hai người.', 'Một món quà ánh sáng lưu giữ lời nhắn, giọng nói và những khoảnh khắc chỉ dành riêng cho người bạn thương.', 4.9, 186)
on conflict (slug) do update set name = excluded.name, description = excluded.description, short_description = excluded.short_description, rating = excluded.rating, review_count = excluded.review_count, updated_at = now();

insert into public.product_variants (product_id, name, option_group, price, compare_at_price, sku, stock_quantity, display_order)
select p.id, v.name, v.option_group, v.price, v.compare_at_price, v.sku, v.stock_quantity, v.display_order
from public.products p cross join (values
  ('Đèn đơn', 'package', 1450000::numeric, 1850000::numeric, 'ALLURA-SINGLE', 20, 1),
  ('Đèn + hộp quà', 'package', 1690000::numeric, 2150000::numeric, 'ALLURA-GIFT', 20, 2),
  ('Đèn + hộp quà cao cấp', 'package', 1990000::numeric, 2490000::numeric, 'ALLURA-PREMIUM', 10, 3)
) as v(name, option_group, price, compare_at_price, sku, stock_quantity, display_order)
where p.slug = 'allura-living-glow'
on conflict (sku) do nothing;

insert into public.product_images (product_id, image_url, alt_text, display_order)
select p.id, v.image_url, v.alt_text, v.display_order
from public.products p cross join (values
  ('https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=85', 'Đèn Allura phát ánh sáng ấm trên bàn gỗ', 1),
  ('https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=85', 'Không gian phòng ngủ với đèn Allura', 2),
  ('https://images.unsplash.com/photo-1542728928-1413d1894ed1?auto=format&fit=crop&w=900&q=85', 'Hộp quà Allura thủ công', 3)
) as v(image_url, alt_text, display_order)
where p.slug = 'allura-living-glow'
and not exists (select 1 from public.product_images i where i.product_id = p.id);

insert into public.product_features (product_id, icon, title, description, display_order)
select p.id, v.icon, v.title, v.description, v.display_order
from public.products p cross join (values
  ('nfc', 'Công nghệ NFC độc quyền', 'Chạm một lần để mở món quà riêng tư.', 1),
  ('mic', 'Lưu giọng nói thân quen', 'Ghi lại voice message ấm áp cho người nhận.', 2),
  ('music', 'Nhạc thư giãn', 'Đồng bộ cùng những giai điệu dịu dàng.', 3)
) as v(icon, title, description, display_order)
where p.slug = 'allura-living-glow'
and not exists (select 1 from public.product_features f where f.product_id = p.id);

insert into public.product_specs (product_id, label, value, display_order)
select p.id, v.label, v.value, v.display_order
from public.products p cross join (values
  ('Chất liệu', 'Gỗ óc chó Bắc Mỹ & vòm thủy tinh mờ', 1),
  ('Ánh sáng', '2700K Warm Glow', 2),
  ('Kết nối', 'NFC một chạm', 3),
  ('Bảo hành', '12 tháng, đổi 1-1 tại nơi', 4)
) as v(label, value, display_order)
where p.slug = 'allura-living-glow'
and not exists (select 1 from public.product_specs s where s.product_id = p.id);
