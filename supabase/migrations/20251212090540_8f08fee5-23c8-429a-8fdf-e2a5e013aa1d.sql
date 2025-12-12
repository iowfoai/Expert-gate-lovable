-- Drop the insecure testing policy
DROP POLICY IF EXISTS "Allow all operations for testing" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (for signup flow)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Authenticated users can view expert profiles (for directory/search)
CREATE POLICY "Authenticated users can view expert profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_type = 'expert');

-- Authenticated users can view profiles they have connections with
CREATE POLICY "Users can view connected profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.expert_connections ec
    WHERE ec.status = 'accepted'
    AND ((ec.requester_id = auth.uid() AND ec.recipient_id = profiles.id)
      OR (ec.recipient_id = auth.uid() AND ec.requester_id = profiles.id))
  )
);