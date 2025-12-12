-- Update the handle_new_user function to handle empty full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    user_type,
    education_level,
    institution,
    field_of_expertise,
    years_of_experience,
    bio,
    publications,
    professional_website,
    country,
    research_institution,
    research_field
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'User'),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'researcher'),
    (NEW.raw_user_meta_data->>'education_level')::public.education_level,
    NEW.raw_user_meta_data->>'institution',
    CASE 
      WHEN NEW.raw_user_meta_data->'field_of_expertise' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'field_of_expertise'))
      ELSE NULL 
    END,
    (NEW.raw_user_meta_data->>'years_of_experience')::integer,
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'publications',
    NEW.raw_user_meta_data->>'professional_website',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'research_institution',
    CASE 
      WHEN NEW.raw_user_meta_data->'research_field' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'research_field'))
      ELSE NULL 
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    -- Still return NEW so signup succeeds
    RETURN NEW;
END;
$function$;