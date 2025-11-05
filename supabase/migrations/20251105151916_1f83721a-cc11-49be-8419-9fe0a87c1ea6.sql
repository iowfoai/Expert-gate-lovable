-- Create interview_requests table
CREATE TABLE public.interview_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  researcher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  research_topic TEXT NOT NULL,
  description TEXT NOT NULL,
  questions TEXT[] NOT NULL,
  preferred_date DATE,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  expert_notes TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  researcher_rating INTEGER CHECK (researcher_rating >= 1 AND researcher_rating <= 5),
  researcher_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;

-- Researchers can view their own requests
CREATE POLICY "Researchers can view their own requests"
ON public.interview_requests
FOR SELECT
USING (auth.uid() = researcher_id);

-- Experts can view requests sent to them
CREATE POLICY "Experts can view requests sent to them"
ON public.interview_requests
FOR SELECT
USING (auth.uid() = expert_id);

-- Researchers can create interview requests
CREATE POLICY "Researchers can create interview requests"
ON public.interview_requests
FOR INSERT
WITH CHECK (auth.uid() = researcher_id);

-- Researchers can update their own pending requests
CREATE POLICY "Researchers can update their own pending requests"
ON public.interview_requests
FOR UPDATE
USING (auth.uid() = researcher_id AND status = 'pending');

-- Experts can update requests sent to them
CREATE POLICY "Experts can update requests sent to them"
ON public.interview_requests
FOR UPDATE
USING (auth.uid() = expert_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_interview_requests_updated_at
BEFORE UPDATE ON public.interview_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_interview_requests_researcher ON public.interview_requests(researcher_id);
CREATE INDEX idx_interview_requests_expert ON public.interview_requests(expert_id);
CREATE INDEX idx_interview_requests_status ON public.interview_requests(status);