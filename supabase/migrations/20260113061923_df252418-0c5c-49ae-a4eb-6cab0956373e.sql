-- Create customer_loyalty table to track customer points by phone
CREATE TABLE public.customer_loyalty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, customer_phone)
);

-- Create points_transactions table to track point history
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_id UUID NOT NULL REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'adjust')),
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty_rewards table for configurable rewards
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percent')),
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add loyalty settings to restaurant_settings
ALTER TABLE public.restaurant_settings
ADD COLUMN loyalty_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN loyalty_points_per_real NUMERIC NOT NULL DEFAULT 1,
ADD COLUMN loyalty_min_order_for_points NUMERIC NOT NULL DEFAULT 0;

-- Create indexes
CREATE INDEX idx_customer_loyalty_phone ON public.customer_loyalty(restaurant_id, customer_phone);
CREATE INDEX idx_points_transactions_loyalty ON public.points_transactions(loyalty_id);
CREATE INDEX idx_loyalty_rewards_restaurant ON public.loyalty_rewards(restaurant_id);

-- Enable RLS
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_loyalty
CREATE POLICY "Public can view loyalty by phone"
  ON public.customer_loyalty FOR SELECT USING (true);

CREATE POLICY "Public can create loyalty"
  ON public.customer_loyalty FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update loyalty"
  ON public.customer_loyalty FOR UPDATE USING (true);

CREATE POLICY "Resellers can manage loyalty of their restaurants"
  ON public.customer_loyalty FOR ALL
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = customer_loyalty.restaurant_id
    AND r.reseller_id = auth.uid()
  ));

-- RLS Policies for points_transactions
CREATE POLICY "Public can view transactions"
  ON public.points_transactions FOR SELECT USING (true);

CREATE POLICY "Public can create transactions"
  ON public.points_transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Resellers can manage transactions of their restaurants"
  ON public.points_transactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM customer_loyalty cl
    JOIN restaurants r ON r.id = cl.restaurant_id
    WHERE cl.id = points_transactions.loyalty_id
    AND r.reseller_id = auth.uid()
  ));

-- RLS Policies for loyalty_rewards
CREATE POLICY "Public can view active rewards"
  ON public.loyalty_rewards FOR SELECT
  USING (active = true);

CREATE POLICY "Resellers can manage rewards of their restaurants"
  ON public.loyalty_rewards FOR ALL
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = loyalty_rewards.restaurant_id
    AND r.reseller_id = auth.uid()
  ));

-- Create triggers for updated_at
CREATE TRIGGER update_customer_loyalty_updated_at
  BEFORE UPDATE ON public.customer_loyalty
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_rewards_updated_at
  BEFORE UPDATE ON public.loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to add points after order
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
  p_restaurant_id UUID,
  p_customer_phone TEXT,
  p_customer_name TEXT,
  p_order_id UUID,
  p_order_total NUMERIC
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loyalty_id UUID;
  v_points_per_real NUMERIC;
  v_min_order NUMERIC;
  v_loyalty_enabled BOOLEAN;
  v_points_earned INTEGER;
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := regexp_replace(p_customer_phone, '\D', '', 'g');
  
  -- Get loyalty settings
  SELECT loyalty_enabled, loyalty_points_per_real, loyalty_min_order_for_points
  INTO v_loyalty_enabled, v_points_per_real, v_min_order
  FROM restaurant_settings
  WHERE restaurant_id = p_restaurant_id;
  
  -- If loyalty not enabled or order below minimum, return 0
  IF NOT COALESCE(v_loyalty_enabled, false) OR p_order_total < COALESCE(v_min_order, 0) THEN
    RETURN 0;
  END IF;
  
  -- Calculate points (1 point per real by default)
  v_points_earned := FLOOR(p_order_total * COALESCE(v_points_per_real, 1));
  
  IF v_points_earned <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Get or create loyalty account
  INSERT INTO customer_loyalty (restaurant_id, customer_phone, customer_name, total_points, lifetime_points)
  VALUES (p_restaurant_id, v_clean_phone, p_customer_name, v_points_earned, v_points_earned)
  ON CONFLICT (restaurant_id, customer_phone)
  DO UPDATE SET
    customer_name = COALESCE(EXCLUDED.customer_name, customer_loyalty.customer_name),
    total_points = customer_loyalty.total_points + v_points_earned,
    lifetime_points = customer_loyalty.lifetime_points + v_points_earned,
    updated_at = now()
  RETURNING id INTO v_loyalty_id;
  
  -- Record transaction
  INSERT INTO points_transactions (loyalty_id, order_id, type, points, description)
  VALUES (v_loyalty_id, p_order_id, 'earn', v_points_earned, 'Pontos por pedido');
  
  RETURN v_points_earned;
END;
$$;

-- Function to redeem points
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  p_restaurant_id UUID,
  p_customer_phone TEXT,
  p_reward_id UUID,
  p_order_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, discount_type TEXT, discount_value NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loyalty RECORD;
  v_reward RECORD;
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := regexp_replace(p_customer_phone, '\D', '', 'g');
  
  -- Get customer loyalty
  SELECT * INTO v_loyalty
  FROM customer_loyalty
  WHERE restaurant_id = p_restaurant_id AND customer_phone = v_clean_phone;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Você não possui pontos acumulados'::TEXT, NULL::TEXT, NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Get reward
  SELECT * INTO v_reward
  FROM loyalty_rewards
  WHERE id = p_reward_id AND restaurant_id = p_restaurant_id AND active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Recompensa não encontrada'::TEXT, NULL::TEXT, NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if enough points
  IF v_loyalty.total_points < v_reward.points_required THEN
    RETURN QUERY SELECT false, ('Você precisa de ' || v_reward.points_required || ' pontos')::TEXT, NULL::TEXT, NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Deduct points
  UPDATE customer_loyalty
  SET total_points = total_points - v_reward.points_required,
      updated_at = now()
  WHERE id = v_loyalty.id;
  
  -- Record transaction
  INSERT INTO points_transactions (loyalty_id, order_id, type, points, description)
  VALUES (v_loyalty.id, p_order_id, 'redeem', -v_reward.points_required, v_reward.name);
  
  RETURN QUERY SELECT true, ('Resgatado: ' || v_reward.name)::TEXT, v_reward.discount_type, v_reward.discount_value;
END;
$$;