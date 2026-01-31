-- Add max_uses_per_customer column to coupons table
ALTER TABLE public.coupons 
ADD COLUMN max_uses_per_customer integer DEFAULT NULL;