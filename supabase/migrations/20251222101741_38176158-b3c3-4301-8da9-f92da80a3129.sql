-- Fix project group creation reliability by removing self-referential RLS and allowing post authors to read their groups

-- 1) Helper functions to avoid RLS infinite recursion
create or replace function public.is_project_group_member(_group_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_group_members
    where group_id = _group_id
      and user_id = _user_id
  )
$$;

create or replace function public.is_project_group_owner(_group_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_group_members
    where group_id = _group_id
      and user_id = _user_id
      and role = 'owner'
  )
$$;

-- 2) project_groups: make group visible to members AND to the post author
DROP POLICY IF EXISTS "Group members can view their groups" ON public.project_groups;

CREATE POLICY "Group members can view their groups"
ON public.project_groups
FOR SELECT
USING (public.is_project_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "Post authors can view their project groups" ON public.project_groups;

CREATE POLICY "Post authors can view their project groups"
ON public.project_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.collaboration_posts cp
    WHERE cp.id = project_groups.post_id
      AND cp.author_id = auth.uid()
  )
);

-- 3) project_group_members: remove self-referential policies and rebuild using the helper functions
DROP POLICY IF EXISTS "Group members can view other members" ON public.project_group_members;

CREATE POLICY "Group members can view other members"
ON public.project_group_members
FOR SELECT
USING (public.is_project_group_member(project_group_members.group_id, auth.uid()));

DROP POLICY IF EXISTS "Group owners can add members" ON public.project_group_members;

CREATE POLICY "Group owners can add members"
ON public.project_group_members
FOR INSERT
WITH CHECK (
  public.is_project_group_owner(project_group_members.group_id, auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.project_groups pg
    JOIN public.collaboration_posts cp ON cp.id = pg.post_id
    WHERE pg.id = project_group_members.group_id
      AND cp.author_id = auth.uid()
  )
);
