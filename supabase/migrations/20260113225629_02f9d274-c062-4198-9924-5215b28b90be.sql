-- Helper function: can the current authenticated user manage a restaurant?
-- Covers: restaurant admins linked in restaurant_admins + resellers that own the restaurant.
create or replace function public.can_manage_restaurant(_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      public.is_restaurant_admin(_restaurant_id, auth.uid())
      or (
        public.has_role(auth.uid(), 'reseller'::public.app_role)
        and exists (
          select 1
          from public.restaurants r
          where r.id = _restaurant_id
            and r.reseller_id = auth.uid()
        )
      )
    );
$$;

-- ============ Categories ============
drop policy if exists "Restaurant admins can manage categories" on public.categories;
create policy "Restaurant admins can manage categories"
on public.categories
for all
to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

-- ============ Products ============
drop policy if exists "Restaurant admins can manage products" on public.products;
create policy "Restaurant admins can manage products"
on public.products
for all
to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

-- ============ Coupons ============
drop policy if exists "Restaurant admins can manage coupons" on public.coupons;
create policy "Restaurant admins can manage coupons"
on public.coupons
for all
to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

-- ============ Extra groups ============
drop policy if exists "Restaurant admins can manage extra groups" on public.extra_groups;
create policy "Restaurant admins can manage extra groups"
on public.extra_groups
for all
to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

-- ============ Extra options (via extra_groups.restaurant_id) ============
drop policy if exists "Restaurant admins can manage extra options" on public.extra_options;
create policy "Restaurant admins can manage extra options"
on public.extra_options
for all
to authenticated
using (
  exists (
    select 1
    from public.extra_groups eg
    where eg.id = extra_options.group_id
      and public.can_manage_restaurant(eg.restaurant_id)
  )
)
with check (
  exists (
    select 1
    from public.extra_groups eg
    where eg.id = extra_options.group_id
      and public.can_manage_restaurant(eg.restaurant_id)
  )
);

-- ============ Loyalty rewards ============
drop policy if exists "Restaurant admins can manage loyalty rewards" on public.loyalty_rewards;
create policy "Restaurant admins can manage loyalty rewards"
on public.loyalty_rewards
for all
to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

-- ============ Orders (admins need to see/update their own restaurant orders) ============
drop policy if exists "Restaurant admins can view orders of their restaurants" on public.orders;
create policy "Restaurant admins can view orders of their restaurants"
on public.orders
for select
to authenticated
using (public.can_manage_restaurant(restaurant_id));

drop policy if exists "Restaurant admins can update orders of their restaurants" on public.orders;
create policy "Restaurant admins can update orders of their restaurants"
on public.orders
for update
to authenticated
using (public.can_manage_restaurant(restaurant_id));

-- ============ Customer loyalty (admin access) ============
drop policy if exists "Restaurant admins can manage customer loyalty" on public.customer_loyalty;
create policy "Restaurant admins can manage customer loyalty"
on public.customer_loyalty
for all
to authenticated
using (public.can_manage_restaurant(restaurant_id))
with check (public.can_manage_restaurant(restaurant_id));

-- ============ Points transactions (admin access via customer_loyalty.restaurant_id) ============
drop policy if exists "Restaurant admins can manage points transactions" on public.points_transactions;
create policy "Restaurant admins can manage points transactions"
on public.points_transactions
for all
to authenticated
using (
  exists (
    select 1
    from public.customer_loyalty cl
    where cl.id = points_transactions.loyalty_id
      and public.can_manage_restaurant(cl.restaurant_id)
  )
)
with check (
  exists (
    select 1
    from public.customer_loyalty cl
    where cl.id = points_transactions.loyalty_id
      and public.can_manage_restaurant(cl.restaurant_id)
  )
);
