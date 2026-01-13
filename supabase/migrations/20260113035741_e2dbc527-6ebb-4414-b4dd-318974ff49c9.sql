-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🍽️',
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resellers (owners of restaurants)
CREATE POLICY "Resellers can view categories of their restaurants"
ON public.categories
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM restaurants r
  WHERE r.id = categories.restaurant_id
  AND r.reseller_id = auth.uid()
));

CREATE POLICY "Resellers can insert categories for their restaurants"
ON public.categories
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM restaurants r
  WHERE r.id = categories.restaurant_id
  AND r.reseller_id = auth.uid()
));

CREATE POLICY "Resellers can update categories of their restaurants"
ON public.categories
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM restaurants r
  WHERE r.id = categories.restaurant_id
  AND r.reseller_id = auth.uid()
));

CREATE POLICY "Resellers can delete categories of their restaurants"
ON public.categories
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM restaurants r
  WHERE r.id = categories.restaurant_id
  AND r.reseller_id = auth.uid()
));

-- Public can view active categories of open restaurants
CREATE POLICY "Public can view active categories of open restaurants"
ON public.categories
FOR SELECT
USING (
  active = true
  AND EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = categories.restaurant_id
    AND r.is_open = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);