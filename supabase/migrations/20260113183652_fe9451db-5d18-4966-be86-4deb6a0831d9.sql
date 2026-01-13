-- Enable realtime for extra groups and options tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_options;