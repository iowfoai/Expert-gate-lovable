-- Allow deleting accepted connections + support per-user "clear chat" timestamps

-- 1) Add per-user cleared timestamps to connections
ALTER TABLE public.expert_connections
  ADD COLUMN IF NOT EXISTS cleared_at_for_requester TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS cleared_at_for_recipient TIMESTAMPTZ NULL;

-- 2) Allow either participant to delete an ACCEPTED connection
DROP POLICY IF EXISTS "Participants can delete accepted connections" ON public.expert_connections;
CREATE POLICY "Participants can delete accepted connections"
ON public.expert_connections
FOR DELETE
USING (
  status = 'accepted'
  AND (auth.uid() = requester_id OR auth.uid() = recipient_id)
);

-- (Existing DELETE policy for requesters cancelling pending requests remains unchanged)