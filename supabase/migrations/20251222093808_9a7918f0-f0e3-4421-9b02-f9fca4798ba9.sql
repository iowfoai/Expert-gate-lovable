-- Fix project_groups RLS policy (wrong column reference)
DROP POLICY IF EXISTS "Group members can view their groups" ON public.project_groups;
CREATE POLICY "Group members can view their groups"
ON public.project_groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_group_members pgm
    WHERE pgm.group_id = project_groups.id AND pgm.user_id = auth.uid()
  )
);

-- Fix project_group_members RLS policies (wrong column references)
DROP POLICY IF EXISTS "Group members can view other members" ON public.project_group_members;
CREATE POLICY "Group members can view other members"
ON public.project_group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_group_members pgm
    WHERE pgm.group_id = project_group_members.group_id AND pgm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Group owners can add members" ON public.project_group_members;
CREATE POLICY "Group owners can add members"
ON public.project_group_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_group_members pgm
    WHERE pgm.group_id = project_group_members.group_id 
    AND pgm.user_id = auth.uid() 
    AND pgm.role = 'owner'
  )
  OR EXISTS (
    SELECT 1 FROM project_groups pg
    JOIN collaboration_posts cp ON cp.id = pg.post_id
    WHERE pg.id = project_group_members.group_id AND cp.author_id = auth.uid()
  )
);

-- Fix project_messages RLS policies (wrong column references)
DROP POLICY IF EXISTS "Group members can view messages" ON public.project_messages;
CREATE POLICY "Group members can view messages"
ON public.project_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_group_members pgm
    WHERE pgm.group_id = project_messages.group_id AND pgm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Group members can send messages" ON public.project_messages;
CREATE POLICY "Group members can send messages"
ON public.project_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM project_group_members pgm
    WHERE pgm.group_id = project_messages.group_id AND pgm.user_id = auth.uid()
  )
);