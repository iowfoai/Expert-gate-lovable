-- Allow group owners/post authors to delete members
DROP POLICY IF EXISTS "Group owners can remove members" ON public.project_group_members;

CREATE POLICY "Group owners can remove members"
ON public.project_group_members
FOR DELETE
USING (
  public.is_project_group_owner(project_group_members.group_id, auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.project_groups pg
    JOIN public.collaboration_posts cp ON cp.id = pg.post_id
    WHERE pg.id = project_group_members.group_id
      AND cp.author_id = auth.uid()
  )
);

-- Allow admins to delete collaboration posts
DROP POLICY IF EXISTS "Admins can delete any post" ON public.collaboration_posts;

CREATE POLICY "Admins can delete any post"
ON public.collaboration_posts
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete profiles (soft delete through update)
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
-- Note: Admins already have update policy, so they can set is_deleted = true