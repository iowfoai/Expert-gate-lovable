-- Drop the restrictive policy and create a new one that allows any authenticated user to send connection requests
DROP POLICY IF EXISTS "Experts can send connection requests" ON public.expert_connections;

CREATE POLICY "Users can send connection requests" 
ON public.expert_connections 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);