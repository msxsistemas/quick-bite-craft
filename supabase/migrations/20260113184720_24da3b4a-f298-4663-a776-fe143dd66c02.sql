-- Enable realtime for coupons and loyalty tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_loyalty;
ALTER PUBLICATION supabase_realtime ADD TABLE public.points_transactions;