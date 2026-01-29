-- Fix existing orders with incorrectly formatted customer_phone_digits
UPDATE orders 
SET customer_phone_digits = regexp_replace(customer_phone, '[^0-9]', '', 'g')
WHERE customer_phone_digits IS NULL 
   OR customer_phone_digits ~ '[^0-9]';

-- Create or replace the trigger function to ensure customer_phone_digits is always just digits
CREATE OR REPLACE FUNCTION public.set_customer_phone_digits()
RETURNS TRIGGER AS $$
BEGIN
  NEW.customer_phone_digits := regexp_replace(NEW.customer_phone, '[^0-9]', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS set_customer_phone_digits_trigger ON orders;

CREATE TRIGGER set_customer_phone_digits_trigger
BEFORE INSERT OR UPDATE OF customer_phone ON orders
FOR EACH ROW
EXECUTE FUNCTION public.set_customer_phone_digits();