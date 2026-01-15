-- Add waiter_id and tip_amount to orders table for tip tracking
ALTER TABLE public.orders 
ADD COLUMN waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL,
ADD COLUMN tip_amount NUMERIC NOT NULL DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX idx_orders_waiter_id ON public.orders(waiter_id);

-- Add comment for documentation
COMMENT ON COLUMN public.orders.waiter_id IS 'Reference to the waiter who served this order';
COMMENT ON COLUMN public.orders.tip_amount IS 'Tip amount given to the waiter for this order';