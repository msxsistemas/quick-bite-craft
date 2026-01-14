-- Allow authenticated users to insert their own role
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Also update the has_role function to check user metadata as fallback
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
  OR (
    -- Fallback: check auth.users metadata for role
    SELECT (raw_user_meta_data->>'role')::text = _role::text
    FROM auth.users
    WHERE id = _user_id
  );
$$;