-- The issue is that the "Public can view tables" policy only works when restaurant is_open = true
-- But restaurant admins should be able to view tables even when closed

-- First check if policy exists and drop it if so (to recreate with better logic)
-- Actually, the "Managers can manage tables" policy should work for admins
-- The problem is that the query is not matching the manager check

-- Let's see what's happening: the current policies are:
-- 1. "Managers can manage tables" - FOR ALL - can_manage_restaurant(restaurant_id)
-- 2. "Public can view tables of open restaurants" - FOR SELECT - requires is_open = true

-- The admin should fall under "Managers can manage tables" which allows ALL operations
-- Let's verify the restaurant_admins table has the correct user

-- Add a more specific policy for admins to select tables regardless of is_open status
DROP POLICY IF EXISTS "Restaurant admins can view all tables" ON public.tables;

CREATE POLICY "Restaurant admins can view all tables"
ON public.tables
FOR SELECT
USING (can_manage_restaurant(restaurant_id));