-- Fix RLS: Allow post authors to add themselves as the first member (owner) when creating a group
DROP POLICY IF EXISTS "Group owners can add members" ON public.project_group_members;

CREATE POLICY "Group owners can add members"
ON public.project_group_members
FOR INSERT
WITH CHECK (
  -- Post author can add any member (including themselves as owner)
  EXISTS (
    SELECT 1 FROM project_groups pg
    JOIN collaboration_posts cp ON cp.id = pg.post_id
    WHERE pg.id = project_group_members.group_id
    AND cp.author_id = auth.uid()
  )
  OR
  -- Existing group owners can add members
  is_project_group_owner(group_id, auth.uid())
);