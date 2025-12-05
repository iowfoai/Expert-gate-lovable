-- Create messages table for expert-to-expert chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.expert_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages from their connections
CREATE POLICY "Users can view messages from their connections"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.expert_connections ec
    WHERE ec.id = connection_id
    AND (ec.requester_id = auth.uid() OR ec.recipient_id = auth.uid())
    AND ec.status = 'accepted'
  )
);

-- Users can send messages to their connections
CREATE POLICY "Users can send messages to their connections"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.expert_connections ec
    WHERE ec.id = connection_id
    AND (ec.requester_id = auth.uid() OR ec.recipient_id = auth.uid())
    AND ec.status = 'accepted'
  )
);

-- Users can update read_at on messages sent to them
CREATE POLICY "Users can mark messages as read"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.expert_connections ec
    WHERE ec.id = connection_id
    AND (
      (ec.requester_id = auth.uid() AND sender_id = ec.recipient_id)
      OR (ec.recipient_id = auth.uid() AND sender_id = ec.requester_id)
    )
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;