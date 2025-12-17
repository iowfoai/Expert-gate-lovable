-- Add RLS policy to prevent unverified experts from creating connections
CREATE POLICY "Only verified experts can send connection requests"
ON public.expert_connections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND user_type = 'expert'
    AND verification_status = 'verified'
  )
);

-- Drop the old permissive insert policy
DROP POLICY IF EXISTS "Users can send connection requests" ON public.expert_connections;

-- Add RLS policy to prevent unverified experts from creating collaboration requests
CREATE POLICY "Only verified experts can create collaboration requests"
ON public.collaboration_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND user_type = 'expert'
    AND verification_status = 'verified'
  )
);

-- Drop the old permissive insert policy for collaboration_requests
DROP POLICY IF EXISTS "Experts can create collaboration requests" ON public.collaboration_requests;