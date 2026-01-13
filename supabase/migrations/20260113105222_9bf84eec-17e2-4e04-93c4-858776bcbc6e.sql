-- Add column to allow multiple quantities of the same option in extra groups
ALTER TABLE public.extra_groups 
ADD COLUMN allow_repeat boolean NOT NULL DEFAULT false;