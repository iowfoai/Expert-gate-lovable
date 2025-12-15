-- Create collaboration_requests table (experts requesting to collaborate with researchers)
CREATE TABLE public.collaboration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.profiles(id),
  researcher_id UUID NOT NULL REFERENCES public.profiles(id),
  topic TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT collaboration_requests_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'completed'))
);

-- Enable RLS on collaboration_requests
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Policies for collaboration_requests
CREATE POLICY "Experts can create collaboration requests"
ON public.collaboration_requests
FOR INSERT
WITH CHECK (auth.uid() = expert_id);

CREATE POLICY "Experts can view their own collaboration requests"
ON public.collaboration_requests
FOR SELECT
USING (auth.uid() = expert_id);

CREATE POLICY "Researchers can view collaboration requests sent to them"
ON public.collaboration_requests
FOR SELECT
USING (auth.uid() = researcher_id);

CREATE POLICY "Researchers can update collaboration requests sent to them"
ON public.collaboration_requests
FOR UPDATE
USING (auth.uid() = researcher_id);

CREATE POLICY "Experts can update their own collaboration requests"
ON public.collaboration_requests
FOR UPDATE
USING (auth.uid() = expert_id);

-- Add connection_type column to expert_connections to differentiate friend connections
ALTER TABLE public.expert_connections
ADD COLUMN IF NOT EXISTS connection_type TEXT NOT NULL DEFAULT 'friend';

-- Add constraint for connection_type
ALTER TABLE public.expert_connections
ADD CONSTRAINT expert_connections_type_check CHECK (connection_type IN ('friend', 'interview', 'collaboration'));

-- Update trigger for collaboration_requests updated_at
CREATE TRIGGER update_collaboration_requests_updated_at
  BEFORE UPDATE ON public.collaboration_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for collaboration_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_requests;

-- Add has_unread column to expert_connections to track unread messages
ALTER TABLE public.expert_connections
ADD COLUMN IF NOT EXISTS has_unread_for_requester BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_unread_for_recipient BOOLEAN DEFAULT false;