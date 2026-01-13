-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  visible BOOLEAN NOT NULL DEFAULT false,
  extra_groups UUID[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create index for restaurant lookup
CREATE INDEX idx_products_restaurant_id ON public.products(restaurant_id);
CREATE INDEX idx_products_sort_order ON public.products(sort_order);

-- RLS Policies: Resellers can manage products of their restaurants
CREATE POLICY "Resellers can view products of their restaurants"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = products.restaurant_id
    AND r.reseller_id = auth.uid()
  )
);

CREATE POLICY "Resellers can insert products for their restaurants"
ON public.products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = products.restaurant_id
    AND r.reseller_id = auth.uid()
  )
);

CREATE POLICY "Resellers can update products of their restaurants"
ON public.products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = products.restaurant_id
    AND r.reseller_id = auth.uid()
  )
);

CREATE POLICY "Resellers can delete products of their restaurants"
ON public.products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = products.restaurant_id
    AND r.reseller_id = auth.uid()
  )
);

-- Public can view active products of open restaurants
CREATE POLICY "Public can view active products of open restaurants"
ON public.products
FOR SELECT
USING (
  active = true AND visible = true AND
  EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = products.restaurant_id
    AND r.is_open = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');