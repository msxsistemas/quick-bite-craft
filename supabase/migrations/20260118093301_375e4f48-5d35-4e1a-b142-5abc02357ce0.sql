-- Enable realtime for all restaurant admin tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_zones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operating_hours;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comandas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_loyalty;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_settings;