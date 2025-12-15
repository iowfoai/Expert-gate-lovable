-- Allow both participants to update accepted connections (for unread flags), while preventing unsafe edits

-- 1) Guard function: once a connection is accepted, only allow unread flag changes (and updated_at)
CREATE OR REPLACE FUNCTION public.expert_connections_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'accepted' THEN
    -- Block changes to identity/meaningful fields on accepted connections
    IF NEW.requester_id <> OLD.requester_id
      OR NEW.recipient_id <> OLD.recipient_id
      OR NEW.status <> OLD.status
      OR NEW.connection_type <> OLD.connection_type
      OR NEW.created_at <> OLD.created_at
    THEN
      RAISE EXCEPTION 'Cannot modify accepted connection metadata';
    END IF;
  END IF;

  -- Always maintain updated_at
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_expert_connections_guard ON public.expert_connections;
CREATE TRIGGER tr_expert_connections_guard
BEFORE UPDATE ON public.expert_connections
FOR EACH ROW
EXECUTE FUNCTION public.expert_connections_guard();

-- 2) RLS policy: participants can update accepted connections (trigger ensures only safe changes)
DROP POLICY IF EXISTS "Participants can update accepted connections" ON public.expert_connections;
CREATE POLICY "Participants can update accepted connections"
ON public.expert_connections
FOR UPDATE
USING (
  status = 'accepted'
  AND (auth.uid() = requester_id OR auth.uid() = recipient_id)
)
WITH CHECK (
  status = 'accepted'
  AND (auth.uid() = requester_id OR auth.uid() = recipient_id)
);
