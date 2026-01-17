-- Add customer_name and customer_phone fields to tables (same as comandas)
ALTER TABLE public.tables 
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_phone TEXT;