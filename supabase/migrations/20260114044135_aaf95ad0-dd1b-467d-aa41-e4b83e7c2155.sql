-- Persist whether store status is controlled manually or synced by operating hours
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS is_manual_mode boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.restaurants.is_manual_mode IS 'When true, store open status can be toggled manually; when false, it should sync with operating hours.';