-- Create delivery_zones table
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order NUMERIC(10,2) NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create restaurant_settings table for additional settings
CREATE TABLE public.restaurant_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
  charge_mode TEXT NOT NULL DEFAULT 'fixed',
  fixed_delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_delivery_time INTEGER NOT NULL DEFAULT 30,
  max_delivery_time INTEGER NOT NULL DEFAULT 50,
  pix_key_type TEXT,
  pix_key TEXT,
  app_name TEXT DEFAULT 'Cardápio',
  short_name TEXT DEFAULT 'Cardápio',
  whatsapp_msg_pix TEXT,
  whatsapp_msg_accepted TEXT,
  whatsapp_msg_delivery TEXT,
  whatsapp_msg_delivered TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operating_hours table
CREATE TABLE public.operating_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '11:00',
  end_time TIME NOT NULL DEFAULT '23:00',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read access for delivery_zones"
  ON public.delivery_zones FOR SELECT
  USING (true);

CREATE POLICY "Public read access for restaurant_settings"
  ON public.restaurant_settings FOR SELECT
  USING (true);

CREATE POLICY "Public read access for operating_hours"
  ON public.operating_hours FOR SELECT
  USING (true);

-- Admin write access (authenticated users can manage their restaurant data)
CREATE POLICY "Authenticated users can insert delivery_zones"
  ON public.delivery_zones FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update delivery_zones"
  ON public.delivery_zones FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete delivery_zones"
  ON public.delivery_zones FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert restaurant_settings"
  ON public.restaurant_settings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update restaurant_settings"
  ON public.restaurant_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert operating_hours"
  ON public.operating_hours FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update operating_hours"
  ON public.operating_hours FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete operating_hours"
  ON public.operating_hours FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_delivery_zones_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operating_hours_updated_at
  BEFORE UPDATE ON public.operating_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();