-- Drop existing policies on deleted_accounts
DROP POLICY IF EXISTS "Admins can view deleted accounts" ON public.deleted_accounts;
DROP POLICY IF EXISTS "System can insert deleted accounts" ON public.deleted_accounts;

-- Recreate policies with explicit authentication requirement
CREATE POLICY "Admins can view deleted accounts" 
ON public.deleted_accounts 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only service role should insert deleted accounts (via triggers/functions)
CREATE POLICY "Service role can insert deleted accounts" 
ON public.deleted_accounts 
FOR INSERT 
TO service_role
WITH CHECK (true);