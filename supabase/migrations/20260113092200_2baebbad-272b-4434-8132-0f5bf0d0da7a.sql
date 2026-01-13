-- Create restaurant_admins table to store admin users for each restaurant
CREATE TABLE public.restaurant_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT, -- For simple password storage (in production, use proper auth)
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, email)
);

-- Enable RLS
ALTER TABLE public.restaurant_admins ENABLE ROW LEVEL SECURITY;

-- Policy: Resellers can manage admins for their restaurants
CREATE POLICY "Resellers can view admins of their restaurants"
ON public.restaurant_admins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_admins.restaurant_id
    AND r.reseller_id = auth.uid()
  )
);

CREATE POLICY "Resellers can create admins for their restaurants"
ON public.restaurant_admins
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_admins.restaurant_id
    AND r.reseller_id = auth.uid()
  )
);

CREATE POLICY "Resellers can update admins of their restaurants"
ON public.restaurant_admins
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_admins.restaurant_id
    AND r.reseller_id = auth.uid()
  )
);

CREATE POLICY "Resellers can delete admins of their restaurants"
ON public.restaurant_admins
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_admins.restaurant_id
    AND r.reseller_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_restaurant_admins_updated_at
BEFORE UPDATE ON public.restaurant_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();