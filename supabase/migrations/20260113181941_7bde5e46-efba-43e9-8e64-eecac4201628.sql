-- Create a table for restaurant admin sessions
CREATE TABLE public.restaurant_admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.restaurant_admins(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (session validation will be done in code)
CREATE POLICY "Allow public read for session validation"
ON public.restaurant_admin_sessions
FOR SELECT
USING (true);

-- Create policy for public insert (login creates session)
CREATE POLICY "Allow public insert for login"
ON public.restaurant_admin_sessions
FOR INSERT
WITH CHECK (true);

-- Create policy for public delete (logout deletes session)
CREATE POLICY "Allow public delete for logout"
ON public.restaurant_admin_sessions
FOR DELETE
USING (true);

-- Create index for faster session lookups
CREATE INDEX idx_restaurant_admin_sessions_token ON public.restaurant_admin_sessions(session_token);
CREATE INDEX idx_restaurant_admin_sessions_expires ON public.restaurant_admin_sessions(expires_at);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.restaurant_admin_sessions WHERE expires_at < now();
END;
$$;