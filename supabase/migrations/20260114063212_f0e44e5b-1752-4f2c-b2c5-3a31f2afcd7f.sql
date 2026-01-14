-- Enable realtime for extra_groups table
ALTER TABLE public.extra_groups REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_groups;

-- Enable realtime for extra_options table
ALTER TABLE public.extra_options REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_options;