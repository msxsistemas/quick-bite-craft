-- Create table for table/comanda payments
CREATE TABLE public.table_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
  comanda_id UUID REFERENCES public.comandas(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('pix', 'dinheiro', 'cartao')),
  amount NUMERIC NOT NULL DEFAULT 0,
  service_fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'expired')),
  customers JSONB DEFAULT '[]'::jsonb,
  waiter_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT table_or_comanda CHECK (table_id IS NOT NULL OR comanda_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.table_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view payments of open restaurants"
ON public.table_payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM restaurants r
  WHERE r.id = table_payments.restaurant_id AND r.is_open = true
));

CREATE POLICY "Public can create payments"
ON public.table_payments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update payments"
ON public.table_payments
FOR UPDATE
USING (true);

CREATE POLICY "Public can delete payments"
ON public.table_payments
FOR DELETE
USING (true);

CREATE POLICY "Managers can manage payments"
ON public.table_payments
FOR ALL
USING (can_manage_restaurant(restaurant_id))
WITH CHECK (can_manage_restaurant(restaurant_id));

-- Create trigger for updated_at
CREATE TRIGGER update_table_payments_updated_at
BEFORE UPDATE ON public.table_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_payments;