-- Enable realtime for extras tables (idempotent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_groups;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_options;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;