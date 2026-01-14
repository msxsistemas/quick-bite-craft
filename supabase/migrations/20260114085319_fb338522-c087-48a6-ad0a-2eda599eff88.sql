-- Allow restaurant admins to see their restaurant even when closed
CREATE POLICY "Restaurant admins can view their restaurant"
ON public.restaurants
FOR SELECT
USING (public.is_restaurant_admin(auth.uid(), id));

-- Allow restaurant admins to update store status/mode (and other restaurant fields if needed)
CREATE POLICY "Restaurant admins can update their restaurant"
ON public.restaurants
FOR UPDATE
USING (public.is_restaurant_admin(auth.uid(), id))
WITH CHECK (public.is_restaurant_admin(auth.uid(), id));
