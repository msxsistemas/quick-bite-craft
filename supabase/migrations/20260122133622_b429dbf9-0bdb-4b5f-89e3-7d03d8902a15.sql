-- Enable realtime for operating_hours table
ALTER PUBLICATION supabase_realtime ADD TABLE public.operating_hours;

-- Enable realtime for loyalty_rewards table
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_rewards;

-- Enable realtime for extra_groups and extra_options tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_options;

-- Enable realtime for suggestions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions;