-- Allow public to view active extra_groups of open restaurants
CREATE POLICY "Public can view active extra groups of open restaurants"
ON public.extra_groups
FOR SELECT
USING (
  active = true AND 
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = extra_groups.restaurant_id AND r.is_open = true
  )
);

-- Allow public to view active extra_options of open restaurants
CREATE POLICY "Public can view active extra options of open restaurants"
ON public.extra_options
FOR SELECT
USING (
  active = true AND 
  EXISTS (
    SELECT 1 FROM extra_groups eg
    JOIN restaurants r ON r.id = eg.restaurant_id
    WHERE eg.id = extra_options.group_id AND r.is_open = true AND eg.active = true
  )
);