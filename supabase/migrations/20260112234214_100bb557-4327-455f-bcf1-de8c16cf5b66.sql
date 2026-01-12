-- Create reseller_settings table for storing reseller configurations
CREATE TABLE public.reseller_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id uuid NOT NULL UNIQUE,
    full_name text,
    company_name text,
    phone text,
    primary_color text DEFAULT '#FF9500',
    secondary_color text DEFAULT '#1E57DC',
    mercadopago_enabled boolean DEFAULT false,
    mercadopago_access_token text,
    mercadopago_public_key text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reseller_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reseller_settings
CREATE POLICY "Resellers can view their own settings"
ON public.reseller_settings
FOR SELECT
USING (has_role(auth.uid(), 'reseller') AND reseller_id = auth.uid());

CREATE POLICY "Resellers can insert their own settings"
ON public.reseller_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'reseller') AND reseller_id = auth.uid());

CREATE POLICY "Resellers can update their own settings"
ON public.reseller_settings
FOR UPDATE
USING (has_role(auth.uid(), 'reseller') AND reseller_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_reseller_settings_updated_at
BEFORE UPDATE ON public.reseller_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL DEFAULT 99.90,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Resellers can view their own plans"
ON public.subscription_plans
FOR SELECT
USING (has_role(auth.uid(), 'reseller') AND reseller_id = auth.uid());

CREATE POLICY "Resellers can insert their own plans"
ON public.subscription_plans
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'reseller') AND reseller_id = auth.uid());

CREATE POLICY "Resellers can update their own plans"
ON public.subscription_plans
FOR UPDATE
USING (has_role(auth.uid(), 'reseller') AND reseller_id = auth.uid());

CREATE POLICY "Resellers can delete their own plans"
ON public.subscription_plans
FOR DELETE
USING (has_role(auth.uid(), 'reseller') AND reseller_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create restaurant_subscriptions table to track restaurant subscriptions
CREATE TABLE public.restaurant_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'pending', 'overdue', 'cancelled')),
    trial_ends_at timestamp with time zone,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    monthly_fee numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(restaurant_id)
);

-- Enable RLS
ALTER TABLE public.restaurant_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_subscriptions
CREATE POLICY "Resellers can view subscriptions of their restaurants"
ON public.restaurant_subscriptions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.id = restaurant_id AND r.reseller_id = auth.uid()
    )
);

CREATE POLICY "Resellers can insert subscriptions for their restaurants"
ON public.restaurant_subscriptions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.id = restaurant_id AND r.reseller_id = auth.uid()
    )
);

CREATE POLICY "Resellers can update subscriptions of their restaurants"
ON public.restaurant_subscriptions
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.id = restaurant_id AND r.reseller_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_restaurant_subscriptions_updated_at
BEFORE UPDATE ON public.restaurant_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create subscription_payments table
CREATE TABLE public.subscription_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES public.restaurant_subscriptions(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    due_date date NOT NULL,
    paid_at timestamp with time zone,
    payment_method text,
    external_payment_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_payments
CREATE POLICY "Resellers can view payments of their restaurants"
ON public.subscription_payments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_subscriptions rs
        JOIN public.restaurants r ON r.id = rs.restaurant_id
        WHERE rs.id = subscription_id AND r.reseller_id = auth.uid()
    )
);

CREATE POLICY "Resellers can insert payments for their restaurants"
ON public.subscription_payments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurant_subscriptions rs
        JOIN public.restaurants r ON r.id = rs.restaurant_id
        WHERE rs.id = subscription_id AND r.reseller_id = auth.uid()
    )
);

CREATE POLICY "Resellers can update payments of their restaurants"
ON public.subscription_payments
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_subscriptions rs
        JOIN public.restaurants r ON r.id = rs.restaurant_id
        WHERE rs.id = subscription_id AND r.reseller_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_subscription_payments_updated_at
BEFORE UPDATE ON public.subscription_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();