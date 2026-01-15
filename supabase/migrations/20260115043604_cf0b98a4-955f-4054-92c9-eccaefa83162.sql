
-- Fix RLS policy for restaurant_admins to properly allow resellers to create admins
-- The issue is that the INSERT policy needs to check the restaurant ownership properly

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Resellers can create admins for their restaurants" ON public.restaurant_admins;

-- Create improved INSERT policy that verifies reseller owns the restaurant
CREATE POLICY "Resellers can create admins for their restaurants" 
ON public.restaurant_admins 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = restaurant_admins.restaurant_id
    AND r.reseller_id = auth.uid()
  )
  OR
  -- Also allow if user is creating their own admin record (after signup)
  (user_id = auth.uid())
);

-- Also ensure the restaurant_admin role can be inserted properly
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  OR
  -- Allow resellers to add restaurant_admin role for users of their restaurants
  EXISTS (
    SELECT 1 FROM restaurant_admins ra
    JOIN restaurants r ON r.id = ra.restaurant_id
    WHERE ra.user_id = user_roles.user_id
    AND r.reseller_id = auth.uid()
  )
);
