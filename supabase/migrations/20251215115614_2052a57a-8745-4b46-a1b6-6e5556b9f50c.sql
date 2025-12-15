-- Drop existing policies on interview_requests
DROP POLICY IF EXISTS "Experts can update requests sent to them" ON public.interview_requests;
DROP POLICY IF EXISTS "Experts can view requests sent to them" ON public.interview_requests;
DROP POLICY IF EXISTS "Researchers can create interview requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Researchers can update their own pending requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Researchers can view their own requests" ON public.interview_requests;

-- Recreate policies with explicit authentication requirement
CREATE POLICY "Experts can view requests sent to them" 
ON public.interview_requests 
FOR SELECT 
TO authenticated
USING (auth.uid() = expert_id);

CREATE POLICY "Researchers can view their own requests" 
ON public.interview_requests 
FOR SELECT 
TO authenticated
USING (auth.uid() = researcher_id);

CREATE POLICY "Experts can update requests sent to them" 
ON public.interview_requests 
FOR UPDATE 
TO authenticated
USING (auth.uid() = expert_id);

CREATE POLICY "Researchers can update their own pending requests" 
ON public.interview_requests 
FOR UPDATE 
TO authenticated
USING (auth.uid() = researcher_id AND status = 'pending');

CREATE POLICY "Researchers can create interview requests" 
ON public.interview_requests 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = researcher_id);