-- Drop the restrictive policy that only allows viewing open restaurants
DROP POLICY IF EXISTS "Public can view open restaurants by slug" ON restaurants;

-- Create a new policy that allows anyone to view restaurants by slug (needed for login page)
CREATE POLICY "Anyone can view restaurants by slug"
ON restaurants
FOR SELECT
USING (true);