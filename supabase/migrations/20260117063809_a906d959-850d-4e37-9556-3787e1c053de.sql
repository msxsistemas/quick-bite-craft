-- Add promotion fields to products table
ALTER TABLE public.products
ADD COLUMN is_promo boolean NOT NULL DEFAULT false,
ADD COLUMN promo_price numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.is_promo IS 'Indicates if the product is currently on promotion';
COMMENT ON COLUMN public.products.promo_price IS 'The promotional price (when is_promo is true)';