-- Add RLS policy to allow authenticated users to view researcher profiles
CREATE POLICY "Authenticated users can view researcher profiles" 
ON public.profiles 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (user_type = 'researcher'::user_type));