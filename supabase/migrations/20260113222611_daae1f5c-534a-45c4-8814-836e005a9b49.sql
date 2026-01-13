-- Allow an authenticated user to claim/link their restaurant admin record by slug.
-- This fixes legacy rows where restaurant_admins.user_id is NULL due to creation with an existing Auth email.

CREATE OR REPLACE FUNCTION public.claim_restaurant_admin(restaurant_slug text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id uuid;
  v_email text;
  v_admin_id uuid;
BEGIN
  IF restaurant_slug IS NULL OR length(trim(restaurant_slug)) = 0 THEN
    RAISE EXCEPTION 'restaurant_slug is required';
  END IF;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF v_email = '' THEN
    RAISE EXCEPTION 'authenticated email not found in token';
  END IF;

  SELECT id INTO v_restaurant_id
  FROM public.restaurants
  WHERE slug = restaurant_slug
  LIMIT 1;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'restaurant not found';
  END IF;

  -- If already linked, keep it.
  SELECT id INTO v_admin_id
  FROM public.restaurant_admins
  WHERE restaurant_id = v_restaurant_id
    AND lower(email) = v_email
    AND user_id = auth.uid()
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    -- Link the legacy admin row (user_id is NULL)
    UPDATE public.restaurant_admins
      SET user_id = auth.uid()
    WHERE restaurant_id = v_restaurant_id
      AND lower(email) = v_email
      AND user_id IS NULL
    RETURNING id INTO v_admin_id;
  END IF;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'admin record not found for this email/restaurant';
  END IF;

  -- Add role (only when a matching admin row exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'restaurant_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_restaurant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_restaurant_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_restaurant_admin(text) TO authenticated;

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_admins_user_id ON public.restaurant_admins(user_id);
