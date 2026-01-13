-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, code)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Public can view active visible coupons of open restaurants (for display on menu)
CREATE POLICY "Public can view active visible coupons of open restaurants"
ON public.coupons
FOR SELECT
USING (
  active = true 
  AND visible = true 
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses IS NULL OR used_count < max_uses)
  AND EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = coupons.restaurant_id AND r.is_open = true
  )
);

-- Resellers can view all coupons of their restaurants
CREATE POLICY "Resellers can view coupons of their restaurants"
ON public.coupons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = coupons.restaurant_id AND r.reseller_id = auth.uid()
  )
);

-- Resellers can insert coupons for their restaurants
CREATE POLICY "Resellers can insert coupons for their restaurants"
ON public.coupons
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = coupons.restaurant_id AND r.reseller_id = auth.uid()
  )
);

-- Resellers can update coupons of their restaurants
CREATE POLICY "Resellers can update coupons of their restaurants"
ON public.coupons
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = coupons.restaurant_id AND r.reseller_id = auth.uid()
  )
);

-- Resellers can delete coupons of their restaurants
CREATE POLICY "Resellers can delete coupons of their restaurants"
ON public.coupons
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = coupons.restaurant_id AND r.reseller_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to validate coupon (accessible publicly for checkout)
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_restaurant_id UUID,
  p_code TEXT,
  p_order_total NUMERIC
)
RETURNS TABLE (
  valid BOOLEAN,
  coupon_id UUID,
  discount_type TEXT,
  discount_value NUMERIC,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM coupons c
  WHERE c.restaurant_id = p_restaurant_id
    AND UPPER(c.code) = UPPER(p_code)
    AND c.active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Cupom não encontrado'::TEXT;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Cupom expirado'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Cupom esgotado'::TEXT;
    RETURN;
  END IF;
  
  -- Check minimum order value
  IF p_order_total < v_coupon.min_order_value THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 
      ('Pedido mínimo de R$ ' || REPLACE(TO_CHAR(v_coupon.min_order_value, 'FM999999990.00'), '.', ','))::TEXT;
    RETURN;
  END IF;
  
  -- Coupon is valid
  RETURN QUERY SELECT 
    true, 
    v_coupon.id, 
    v_coupon.discount_type, 
    v_coupon.discount_value, 
    NULL::TEXT;
END;
$$;

-- Create function to increment coupon usage (call after order is placed)
CREATE OR REPLACE FUNCTION public.use_coupon(p_coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE coupons 
  SET used_count = used_count + 1 
  WHERE id = p_coupon_id;
END;
$$;