-- Fix RLS policies: Change from RESTRICTIVE to PERMISSIVE
-- When all policies are restrictive, ALL must pass (AND logic)
-- When permissive, at least ONE must pass (OR logic)

-- Drop existing RESTRICTIVE policies and recreate as PERMISSIVE for extra_groups
DROP POLICY IF EXISTS "Public can view active extra groups of open restaurants" ON public.extra_groups;
DROP POLICY IF EXISTS "Resellers can delete extra groups of their restaurants" ON public.extra_groups;
DROP POLICY IF EXISTS "Resellers can insert extra groups for their restaurants" ON public.extra_groups;
DROP POLICY IF EXISTS "Resellers can update extra groups of their restaurants" ON public.extra_groups;
DROP POLICY IF EXISTS "Resellers can view extra groups of their restaurants" ON public.extra_groups;
DROP POLICY IF EXISTS "Restaurant admins can manage extra groups" ON public.extra_groups;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Public can view active extra groups of open restaurants"
ON public.extra_groups FOR SELECT
USING (
  active = true AND EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = extra_groups.restaurant_id AND r.is_open = true
  )
);

CREATE POLICY "Managers can manage extra groups"
ON public.extra_groups FOR ALL
USING (public.can_manage_restaurant(restaurant_id))
WITH CHECK (public.can_manage_restaurant(restaurant_id));

-- Fix extra_options
DROP POLICY IF EXISTS "Public can view active extra options of open restaurants" ON public.extra_options;
DROP POLICY IF EXISTS "Resellers can delete extra options of their restaurants" ON public.extra_options;
DROP POLICY IF EXISTS "Resellers can insert extra options for their restaurants" ON public.extra_options;
DROP POLICY IF EXISTS "Resellers can update extra options of their restaurants" ON public.extra_options;
DROP POLICY IF EXISTS "Resellers can view extra options of their restaurants" ON public.extra_options;
DROP POLICY IF EXISTS "Restaurant admins can manage extra options" ON public.extra_options;

CREATE POLICY "Public can view active extra options of open restaurants"
ON public.extra_options FOR SELECT
USING (
  active = true AND EXISTS (
    SELECT 1 FROM extra_groups eg
    JOIN restaurants r ON r.id = eg.restaurant_id
    WHERE eg.id = extra_options.group_id AND r.is_open = true AND eg.active = true
  )
);

CREATE POLICY "Managers can manage extra options"
ON public.extra_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM extra_groups eg
    WHERE eg.id = extra_options.group_id AND public.can_manage_restaurant(eg.restaurant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM extra_groups eg
    WHERE eg.id = extra_options.group_id AND public.can_manage_restaurant(eg.restaurant_id)
  )
);

-- Also fix categories, products, coupons to use single permissive policy
DROP POLICY IF EXISTS "Resellers can delete categories of their restaurants" ON public.categories;
DROP POLICY IF EXISTS "Resellers can insert categories for their restaurants" ON public.categories;
DROP POLICY IF EXISTS "Resellers can update categories of their restaurants" ON public.categories;
DROP POLICY IF EXISTS "Resellers can view categories of their restaurants" ON public.categories;
DROP POLICY IF EXISTS "Restaurant admins can manage categories" ON public.categories;

CREATE POLICY "Managers can manage categories"
ON public.categories FOR ALL
USING (public.can_manage_restaurant(restaurant_id))
WITH CHECK (public.can_manage_restaurant(restaurant_id));

DROP POLICY IF EXISTS "Resellers can delete products of their restaurants" ON public.products;
DROP POLICY IF EXISTS "Resellers can insert products for their restaurants" ON public.products;
DROP POLICY IF EXISTS "Resellers can update products of their restaurants" ON public.products;
DROP POLICY IF EXISTS "Resellers can view products of their restaurants" ON public.products;
DROP POLICY IF EXISTS "Restaurant admins can manage products" ON public.products;

CREATE POLICY "Managers can manage products"
ON public.products FOR ALL
USING (public.can_manage_restaurant(restaurant_id))
WITH CHECK (public.can_manage_restaurant(restaurant_id));

DROP POLICY IF EXISTS "Resellers can delete coupons of their restaurants" ON public.coupons;
DROP POLICY IF EXISTS "Resellers can insert coupons for their restaurants" ON public.coupons;
DROP POLICY IF EXISTS "Resellers can update coupons of their restaurants" ON public.coupons;
DROP POLICY IF EXISTS "Resellers can view coupons of their restaurants" ON public.coupons;
DROP POLICY IF EXISTS "Restaurant admins can manage coupons" ON public.coupons;

CREATE POLICY "Managers can manage coupons"
ON public.coupons FOR ALL
USING (public.can_manage_restaurant(restaurant_id))
WITH CHECK (public.can_manage_restaurant(restaurant_id));

-- Fix loyalty_rewards
DROP POLICY IF EXISTS "Resellers can manage rewards of their restaurants" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Restaurant admins can manage loyalty rewards" ON public.loyalty_rewards;

CREATE POLICY "Managers can manage loyalty rewards"
ON public.loyalty_rewards FOR ALL
USING (public.can_manage_restaurant(restaurant_id))
WITH CHECK (public.can_manage_restaurant(restaurant_id));