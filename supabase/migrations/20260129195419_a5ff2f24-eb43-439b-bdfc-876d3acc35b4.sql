-- Normalize phone digits for orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_phone_digits TEXT;

-- Backfill existing rows
UPDATE public.orders
SET customer_phone_digits = regexp_replace(customer_phone, '\D', '', 'g')
WHERE customer_phone_digits IS NULL;

-- Keep digits in sync
CREATE OR REPLACE FUNCTION public.set_order_phone_digits()
RETURNS TRIGGER AS $$
BEGIN
  NEW.customer_phone_digits := regexp_replace(COALESCE(NEW.customer_phone, ''), '\\D', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_orders_set_phone_digits ON public.orders;
CREATE TRIGGER trg_orders_set_phone_digits
BEFORE INSERT OR UPDATE OF customer_phone
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_phone_digits();

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_phone_digits
ON public.orders (restaurant_id, customer_phone_digits);
