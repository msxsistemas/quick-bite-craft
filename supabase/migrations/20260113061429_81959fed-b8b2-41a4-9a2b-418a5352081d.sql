-- Create customer_addresses table to store saved addresses by phone
CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  label TEXT DEFAULT 'Casa',
  cep TEXT,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by phone
CREATE INDEX idx_customer_addresses_phone ON public.customer_addresses(restaurant_id, customer_phone);

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Public can view addresses (filtered by phone in app)
CREATE POLICY "Public can view addresses"
  ON public.customer_addresses
  FOR SELECT
  USING (true);

-- Public can create addresses
CREATE POLICY "Public can create addresses"
  ON public.customer_addresses
  FOR INSERT
  WITH CHECK (true);

-- Public can update addresses
CREATE POLICY "Public can update addresses"
  ON public.customer_addresses
  FOR UPDATE
  USING (true);

-- Public can delete addresses
CREATE POLICY "Public can delete addresses"
  ON public.customer_addresses
  FOR DELETE
  USING (true);

-- Resellers can manage addresses of their restaurants
CREATE POLICY "Resellers can view addresses of their restaurants"
  ON public.customer_addresses
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = customer_addresses.restaurant_id
    AND r.reseller_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();