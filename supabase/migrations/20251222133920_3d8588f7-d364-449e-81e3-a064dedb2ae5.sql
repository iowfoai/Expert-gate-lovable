-- Add is_test_account column to profiles (default false so new accounts are visible)
ALTER TABLE public.profiles 
ADD COLUMN is_test_account boolean NOT NULL DEFAULT false;

-- Mark ALL existing accounts as test accounts (they won't be visible to regular users)
UPDATE public.profiles SET is_test_account = true;

-- Drop existing policies that allow viewing profiles
DROP POLICY IF EXISTS "Authenticated users can view expert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view researcher profiles" ON public.profiles;

-- Create new policies that exclude test accounts for non-admins
CREATE POLICY "Authenticated users can view expert profiles"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) 
  AND (user_type = 'expert'::user_type)
  AND (
    is_test_account = false 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Authenticated users can view researcher profiles"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) 
  AND (user_type = 'researcher'::user_type)
  AND (
    is_test_account = false 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);