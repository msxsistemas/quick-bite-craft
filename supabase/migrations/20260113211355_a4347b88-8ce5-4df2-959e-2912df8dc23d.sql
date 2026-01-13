-- Fix: Policy for restaurant_admin_sessions (cannot use IF NOT EXISTS)
-- First drop if exists, then create
DROP POLICY IF EXISTS "Anyone can manage sessions" ON public.restaurant_admin_sessions;

CREATE POLICY "Anyone can manage sessions"
ON public.restaurant_admin_sessions
FOR ALL
USING (true)
WITH CHECK (true);