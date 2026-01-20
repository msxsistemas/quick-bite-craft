-- Enable realtime for orders table (kitchen, PDV, order tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for tables (table status management)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;

-- Enable realtime for comandas (comanda management)
ALTER PUBLICATION supabase_realtime ADD TABLE public.comandas;

-- Enable realtime for products (menu updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Enable realtime for categories (menu updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- Enable realtime for waiters (waiter management)
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiters;

-- Enable realtime for delivery zones
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_zones;

-- Enable realtime for coupons
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;

-- Enable realtime for loyalty rewards
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_rewards;

-- Enable realtime for customer loyalty
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_loyalty;

-- Enable realtime for operating hours
ALTER PUBLICATION supabase_realtime ADD TABLE public.operating_hours;

-- Enable realtime for restaurant settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_settings;

-- Enable realtime for suggestions
ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions;