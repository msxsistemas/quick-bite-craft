-- Create extra_groups table
CREATE TABLE public.extra_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  internal_name TEXT NOT NULL,
  display_title TEXT NOT NULL,
  subtitle TEXT,
  max_selections INTEGER NOT NULL DEFAULT 1,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create extra_options table
CREATE TABLE public.extra_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.extra_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extra_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for extra_groups
CREATE POLICY "Resellers can view extra groups of their restaurants"
  ON public.extra_groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = extra_groups.restaurant_id AND r.reseller_id = auth.uid()
  ));

CREATE POLICY "Resellers can insert extra groups for their restaurants"
  ON public.extra_groups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = extra_groups.restaurant_id AND r.reseller_id = auth.uid()
  ));

CREATE POLICY "Resellers can update extra groups of their restaurants"
  ON public.extra_groups FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = extra_groups.restaurant_id AND r.reseller_id = auth.uid()
  ));

CREATE POLICY "Resellers can delete extra groups of their restaurants"
  ON public.extra_groups FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = extra_groups.restaurant_id AND r.reseller_id = auth.uid()
  ));

-- RLS policies for extra_options
CREATE POLICY "Resellers can view extra options of their restaurants"
  ON public.extra_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM extra_groups eg
    JOIN restaurants r ON r.id = eg.restaurant_id
    WHERE eg.id = extra_options.group_id AND r.reseller_id = auth.uid()
  ));

CREATE POLICY "Resellers can insert extra options for their restaurants"
  ON public.extra_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM extra_groups eg
    JOIN restaurants r ON r.id = eg.restaurant_id
    WHERE eg.id = extra_options.group_id AND r.reseller_id = auth.uid()
  ));

CREATE POLICY "Resellers can update extra options of their restaurants"
  ON public.extra_options FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM extra_groups eg
    JOIN restaurants r ON r.id = eg.restaurant_id
    WHERE eg.id = extra_options.group_id AND r.reseller_id = auth.uid()
  ));

CREATE POLICY "Resellers can delete extra options of their restaurants"
  ON public.extra_options FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM extra_groups eg
    JOIN restaurants r ON r.id = eg.restaurant_id
    WHERE eg.id = extra_options.group_id AND r.reseller_id = auth.uid()
  ));

-- Add updated_at triggers
CREATE TRIGGER update_extra_groups_updated_at
  BEFORE UPDATE ON public.extra_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extra_options_updated_at
  BEFORE UPDATE ON public.extra_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();