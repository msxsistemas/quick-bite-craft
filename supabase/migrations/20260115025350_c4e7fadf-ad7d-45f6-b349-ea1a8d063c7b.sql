-- Create waiters table for restaurant staff management
CREATE TABLE public.waiters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_waiters_restaurant_id ON public.waiters(restaurant_id);

-- Enable Row Level Security
ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Managers can manage waiters"
ON public.waiters
FOR ALL
USING (can_manage_restaurant(restaurant_id))
WITH CHECK (can_manage_restaurant(restaurant_id));

CREATE POLICY "Resellers can manage waiters of their restaurants"
ON public.waiters
FOR ALL
USING (EXISTS (
  SELECT 1 FROM restaurants r
  WHERE r.id = waiters.restaurant_id AND r.reseller_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM restaurants r
  WHERE r.id = waiters.restaurant_id AND r.reseller_id = auth.uid()
));

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_waiters_updated_at
BEFORE UPDATE ON public.waiters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();