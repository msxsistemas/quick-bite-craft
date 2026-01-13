-- Enable realtime for restaurant settings and delivery zones
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_zones;