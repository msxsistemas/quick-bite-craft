-- Add sold_out column to products table
ALTER TABLE public.products 
ADD COLUMN sold_out boolean NOT NULL DEFAULT false;