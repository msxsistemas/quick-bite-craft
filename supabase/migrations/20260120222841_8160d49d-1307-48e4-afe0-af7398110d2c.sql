-- Enable realtime for extra_groups table
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_groups;

-- Enable realtime for extra_options table
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_options;