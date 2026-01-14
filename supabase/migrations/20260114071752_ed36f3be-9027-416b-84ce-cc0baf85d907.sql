-- Enable full replica identity for realtime
ALTER TABLE public.delivery_zones REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_zones;