-- Create a table for storing customer suggestions/feedback
CREATE TABLE public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  source TEXT DEFAULT 'waiter_app',
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  comanda_id UUID REFERENCES public.comandas(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Public can create suggestions (customers submitting feedback)
CREATE POLICY "Public can create suggestions"
ON public.suggestions
FOR INSERT
WITH CHECK (true);

-- Managers can view suggestions of their restaurants
CREATE POLICY "Managers can view suggestions"
ON public.suggestions
FOR SELECT
USING (can_manage_restaurant(restaurant_id));

-- Resellers can view suggestions of their restaurants
CREATE POLICY "Resellers can view suggestions"
ON public.suggestions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM restaurants r
  WHERE r.id = suggestions.restaurant_id
  AND r.reseller_id = auth.uid()
));

-- Create index for faster queries
CREATE INDEX idx_suggestions_restaurant_id ON public.suggestions(restaurant_id);
CREATE INDEX idx_suggestions_created_at ON public.suggestions(created_at DESC);