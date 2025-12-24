-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can send connection requests" ON public.expert_connections;

-- Create a new insert policy that also allows creating connections when accepting collaborations
CREATE POLICY "Users can create connections"
ON public.expert_connections
FOR INSERT
WITH CHECK (
  -- Original case: user is the requester (for friend connections)
  (auth.uid() = requester_id AND (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'expert' AND profiles.verification_status = 'verified'))
    OR
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'researcher'))
  ))
  OR
  -- New case: user is the recipient accepting a collaboration request
  (auth.uid() = recipient_id AND connection_type = 'collaboration' AND EXISTS (
    SELECT 1 FROM collaboration_requests cr
    WHERE cr.expert_id = expert_connections.requester_id
      AND cr.researcher_id = expert_connections.recipient_id
      AND cr.status = 'accepted'
  ))
);