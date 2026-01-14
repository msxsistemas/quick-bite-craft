-- Create helper function to check if user is restaurant owner
CREATE OR REPLACE FUNCTION public.is_restaurant_owner(_restaurant_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_admins
    WHERE user_id = _user_id
      AND restaurant_id = _restaurant_id
      AND is_owner = true
  )
$$;

-- Update can_manage_restaurant to use consistent pattern
-- Owners get the same access as the function already provides
-- This function already covers owners through is_restaurant_admin
-- No changes needed to the core logic

-- Grant execute on the new function
GRANT EXECUTE ON FUNCTION public.is_restaurant_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_restaurant_owner(uuid, uuid) TO anon;