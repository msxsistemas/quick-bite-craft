-- Add promo expiration date column to products
ALTER TABLE public.products 
ADD COLUMN promo_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;