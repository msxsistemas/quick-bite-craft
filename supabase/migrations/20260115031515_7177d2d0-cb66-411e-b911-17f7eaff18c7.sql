-- Create tables for PDV management
CREATE TABLE public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'requesting', 'reserved')),
  current_waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL,
  current_order_id UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX idx_tables_status ON public.tables(status);

-- Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tables
CREATE POLICY "Managers can manage tables"
  ON public.tables
  FOR ALL
  USING (can_manage_restaurant(restaurant_id))
  WITH CHECK (can_manage_restaurant(restaurant_id));

CREATE POLICY "Public can view tables of open restaurants"
  ON public.tables
  FOR SELECT
  USING (active = true AND EXISTS (
    SELECT 1 FROM restaurants r WHERE r.id = tables.restaurant_id AND r.is_open = true
  ));

-- Add table_id to orders for PDV orders
ALTER TABLE public.orders 
ADD COLUMN table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL;

-- Add foreign key reference from tables to orders
ALTER TABLE public.tables
ADD CONSTRAINT tables_current_order_id_fkey 
FOREIGN KEY (current_order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create trigger to update updated_at
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON public.tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.tables IS 'Restaurant tables for PDV management';
COMMENT ON COLUMN public.tables.status IS 'Table status: free, occupied, requesting (bill), reserved';
COMMENT ON COLUMN public.orders.table_id IS 'Reference to the table for in-restaurant orders';