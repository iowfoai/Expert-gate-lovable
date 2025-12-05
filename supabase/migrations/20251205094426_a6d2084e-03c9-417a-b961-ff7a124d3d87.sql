-- Create a table for expert connections/friend requests
CREATE TABLE public.expert_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

-- Enable RLS
ALTER TABLE public.expert_connections ENABLE ROW LEVEL SECURITY;

-- Policies: Experts can view connections they're involved in
CREATE POLICY "Users can view their own connections"
ON public.expert_connections
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Experts can create connection requests
CREATE POLICY "Experts can send connection requests"
ON public.expert_connections
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Recipients can update (accept/reject) requests sent to them
CREATE POLICY "Recipients can respond to requests"
ON public.expert_connections
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Requesters can delete their pending requests
CREATE POLICY "Requesters can cancel pending requests"
ON public.expert_connections
FOR DELETE
USING (auth.uid() = requester_id AND status = 'pending');

-- Trigger for updated_at
CREATE TRIGGER update_expert_connections_updated_at
BEFORE UPDATE ON public.expert_connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();