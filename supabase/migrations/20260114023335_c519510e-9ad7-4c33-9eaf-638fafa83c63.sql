-- Fix the parameter order mismatch in can_manage_restaurant
-- The is_restaurant_admin function expects (user_id, restaurant_id) but was called with (restaurant_id, user_id)

CREATE OR REPLACE FUNCTION public.can_manage_restaurant(_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      -- Fix: correct parameter order - is_restaurant_admin expects (user_id, restaurant_id)
      public.is_restaurant_admin(auth.uid(), _restaurant_id)
      OR (
        public.has_role(auth.uid(), 'reseller'::public.app_role)
        AND EXISTS (
          SELECT 1
          FROM public.restaurants r
          WHERE r.id = _restaurant_id
            AND r.reseller_id = auth.uid()
        )
      )
    );
$$;