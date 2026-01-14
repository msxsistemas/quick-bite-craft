-- Enable REPLICA IDENTITY FULL for operating_hours
ALTER TABLE public.operating_hours REPLICA IDENTITY FULL;

-- Add operating_hours to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.operating_hours;