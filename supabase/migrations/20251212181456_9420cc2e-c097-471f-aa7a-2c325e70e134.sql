-- Drop the insecure policy that allows unauthenticated access to expert profiles
DROP POLICY IF EXISTS "Authenticated users can view expert profiles" ON public.profiles;

-- Create a new policy that requires authentication to view expert profiles
CREATE POLICY "Authenticated users can view expert profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND user_type = 'expert'::user_type
);