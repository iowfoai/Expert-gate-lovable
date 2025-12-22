-- Create collaboration_posts table
CREATE TABLE public.collaboration_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  field_of_study TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on collaboration_posts
ALTER TABLE public.collaboration_posts ENABLE ROW LEVEL SECURITY;

-- Policies for collaboration_posts
CREATE POLICY "Anyone authenticated can view open posts"
ON public.collaboration_posts
FOR SELECT
USING (auth.uid() IS NOT NULL AND (status = 'open' OR author_id = auth.uid()));

CREATE POLICY "Users can create posts"
ON public.collaboration_posts
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their posts"
ON public.collaboration_posts
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their posts"
ON public.collaboration_posts
FOR DELETE
USING (auth.uid() = author_id);

-- Create collaboration_applications table
CREATE TABLE public.collaboration_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.collaboration_posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, applicant_id)
);

-- Enable RLS on collaboration_applications
ALTER TABLE public.collaboration_applications ENABLE ROW LEVEL SECURITY;

-- Policies for collaboration_applications
CREATE POLICY "Applicants can view their own applications"
ON public.collaboration_applications
FOR SELECT
USING (auth.uid() = applicant_id);

CREATE POLICY "Post authors can view applications to their posts"
ON public.collaboration_applications
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.collaboration_posts cp 
  WHERE cp.id = post_id AND cp.author_id = auth.uid()
));

CREATE POLICY "Users can apply to posts"
ON public.collaboration_applications
FOR INSERT
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Post authors can update application status"
ON public.collaboration_applications
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.collaboration_posts cp 
  WHERE cp.id = post_id AND cp.author_id = auth.uid()
));

-- Create project_groups table
CREATE TABLE public.project_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.collaboration_posts(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on project_groups
ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;

-- Create project_group_members table
CREATE TABLE public.project_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on project_group_members
ALTER TABLE public.project_group_members ENABLE ROW LEVEL SECURITY;

-- Policies for project_groups (members can view)
CREATE POLICY "Group members can view their groups"
ON public.project_groups
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.project_group_members pgm 
  WHERE pgm.group_id = id AND pgm.user_id = auth.uid()
));

CREATE POLICY "Post authors can create groups"
ON public.project_groups
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.collaboration_posts cp 
  WHERE cp.id = post_id AND cp.author_id = auth.uid()
));

-- Policies for project_group_members
CREATE POLICY "Group members can view other members"
ON public.project_group_members
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.project_group_members pgm 
  WHERE pgm.group_id = group_id AND pgm.user_id = auth.uid()
));

CREATE POLICY "Group owners can add members"
ON public.project_group_members
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.project_group_members pgm 
  WHERE pgm.group_id = group_id AND pgm.user_id = auth.uid() AND pgm.role = 'owner'
) OR EXISTS (
  SELECT 1 FROM public.project_groups pg
  JOIN public.collaboration_posts cp ON cp.id = pg.post_id
  WHERE pg.id = group_id AND cp.author_id = auth.uid()
));

-- Create project_messages table
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on project_messages
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Policies for project_messages
CREATE POLICY "Group members can view messages"
ON public.project_messages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.project_group_members pgm 
  WHERE pgm.group_id = group_id AND pgm.user_id = auth.uid()
));

CREATE POLICY "Group members can send messages"
ON public.project_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.project_group_members pgm 
    WHERE pgm.group_id = group_id AND pgm.user_id = auth.uid()
  )
);

-- Enable realtime for project_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- Add updated_at triggers
CREATE TRIGGER update_collaboration_posts_updated_at
BEFORE UPDATE ON public.collaboration_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_collaboration_applications_updated_at
BEFORE UPDATE ON public.collaboration_applications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();