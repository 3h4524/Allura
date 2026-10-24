drop policy if exists cart_items_owner_delete on public.cart_items;
create policy cart_items_owner_delete
on public.cart_items
for delete
using (exists (
  select 1
  from public.carts c
  where c.id = cart_id
    and c.user_id = auth.uid()
));
