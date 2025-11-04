-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('researcher', 'expert');

-- Create enum for education levels
CREATE TYPE public.education_level AS ENUM (
  'bachelors',
  'masters',
  'phd',
  'postdoc',
  'professor',
  'industry_professional'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_type public.user_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Common fields
  bio TEXT,
  country TEXT,
  profile_image_url TEXT,
  
  -- Expert-specific fields
  education_level public.education_level,
  institution TEXT,
  field_of_expertise TEXT[],
  years_of_experience INTEGER,
  credentials_document_url TEXT,
  publications TEXT,
  professional_website TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  
  -- Expert availability
  monthly_interview_limit INTEGER DEFAULT 5,
  interviews_remaining INTEGER DEFAULT 5,
  is_available BOOLEAN DEFAULT true,
  
  -- Researcher-specific fields
  research_institution TEXT,
  research_field TEXT[],
  
  CONSTRAINT valid_expert_fields CHECK (
    (user_type = 'expert' AND education_level IS NOT NULL AND institution IS NOT NULL) OR
    (user_type = 'researcher')
  )
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'researcher')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();