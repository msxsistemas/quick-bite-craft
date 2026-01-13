-- Add policy to allow public to read restaurant_admins for login verification
CREATE POLICY "Public can verify login credentials"
ON public.restaurant_admins
FOR SELECT
USING (true);