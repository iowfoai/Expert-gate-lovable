-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Only verified experts can send connection requests" ON public.expert_connections;

-- Create a new INSERT policy that allows:
-- 1. Verified experts to send connection requests
-- 2. Researchers to connect with other researchers
CREATE POLICY "Users can send connection requests"
ON public.expert_connections
FOR INSERT
WITH CHECK (
  auth.uid() = requester_id
  AND (
    -- Verified experts can send requests
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'expert'
      AND profiles.verification_status = 'verified'
    )
    OR
    -- Researchers can also send requests
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'researcher'
    )
  )
);