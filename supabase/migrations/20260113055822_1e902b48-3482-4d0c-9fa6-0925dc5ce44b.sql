
-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  delivery_zone_id UUID REFERENCES public.delivery_zones(id),
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  coupon_id UUID REFERENCES public.coupons(id),
  payment_method TEXT NOT NULL DEFAULT 'pix',
  payment_change NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  preparing_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  delivering_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Public can view their own orders by phone
CREATE POLICY "Public can view orders by phone" 
ON public.orders 
FOR SELECT 
USING (true);

-- Public can create orders
CREATE POLICY "Public can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Resellers can view orders of their restaurants
CREATE POLICY "Resellers can view orders of their restaurants" 
ON public.orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM restaurants r 
  WHERE r.id = orders.restaurant_id 
  AND r.reseller_id = auth.uid()
));

-- Resellers can update orders of their restaurants
CREATE POLICY "Resellers can update orders of their restaurants" 
ON public.orders 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM restaurants r 
  WHERE r.id = orders.restaurant_id 
  AND r.reseller_id = auth.uid()
));

-- Create index for faster queries
CREATE INDEX idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
