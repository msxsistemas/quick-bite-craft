-- Create comandas table
CREATE TABLE public.comandas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  payment_method TEXT,
  tip_amount NUMERIC NOT NULL DEFAULT 0,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comanda_id column to orders table
ALTER TABLE public.orders ADD COLUMN comanda_id UUID REFERENCES public.comandas(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comandas
CREATE POLICY "Public can view comandas of open restaurants"
ON public.comandas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = comandas.restaurant_id AND r.is_open = true
  )
);

CREATE POLICY "Managers can manage comandas"
ON public.comandas
FOR ALL
USING (can_manage_restaurant(restaurant_id))
WITH CHECK (can_manage_restaurant(restaurant_id));

CREATE POLICY "Resellers can manage comandas of their restaurants"
ON public.comandas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = comandas.restaurant_id AND r.reseller_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = comandas.restaurant_id AND r.reseller_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_comandas_updated_at
BEFORE UPDATE ON public.comandas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for comandas
ALTER PUBLICATION supabase_realtime ADD TABLE public.comandas;