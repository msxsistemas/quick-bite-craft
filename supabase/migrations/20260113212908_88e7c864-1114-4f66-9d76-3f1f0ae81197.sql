-- Add user_id column to restaurant_admins for Supabase Auth integration
ALTER TABLE public.restaurant_admins ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_admins_user_id ON public.restaurant_admins(user_id);

-- Create function to check if user is a restaurant admin
CREATE OR REPLACE FUNCTION public.is_restaurant_admin(_user_id uuid, _restaurant_id uuid)
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
  )
$$;