-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- If user signed up as reseller, add role
  IF NEW.raw_user_meta_data->>'role' = 'reseller' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'reseller');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users from auth.users
INSERT INTO public.profiles (user_id, email, name)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- Backfill reseller roles for existing users who signed up as resellers
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'reseller'::public.app_role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'reseller'
  AND id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'reseller')
ON CONFLICT DO NOTHING;