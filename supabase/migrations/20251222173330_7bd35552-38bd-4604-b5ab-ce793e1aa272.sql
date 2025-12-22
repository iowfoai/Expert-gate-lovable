-- Create table for editable site content
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text UNIQUE NOT NULL,
  content_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Everyone can read content
CREATE POLICY "Anyone can view site content"
ON public.site_content
FOR SELECT
USING (true);

-- Only admins can update content
CREATE POLICY "Admins can update site content"
ON public.site_content
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can insert content
CREATE POLICY "Admins can insert site content"
ON public.site_content
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can delete content
CREATE POLICY "Admins can delete site content"
ON public.site_content
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;

-- Create trigger for updated_at
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();