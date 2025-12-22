-- Add preferred_languages column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_languages TEXT[] DEFAULT ARRAY['English'];

-- Update all existing profiles to have English as preferred language
UPDATE public.profiles 
SET preferred_languages = ARRAY['English'] 
WHERE preferred_languages IS NULL OR array_length(preferred_languages, 1) IS NULL;