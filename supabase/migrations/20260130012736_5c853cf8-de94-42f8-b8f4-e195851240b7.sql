-- Fix the trigger function to properly remove non-digits
CREATE OR REPLACE FUNCTION public.set_order_phone_digits()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.customer_phone_digits := regexp_replace(COALESCE(NEW.customer_phone, ''), '[^0-9]', '', 'g');
  RETURN NEW;
END;
$function$;

-- Fix existing orders with incorrect customer_phone_digits
UPDATE orders 
SET customer_phone_digits = regexp_replace(customer_phone, '[^0-9]', '', 'g')
WHERE customer_phone_digits ~ '[^0-9]';