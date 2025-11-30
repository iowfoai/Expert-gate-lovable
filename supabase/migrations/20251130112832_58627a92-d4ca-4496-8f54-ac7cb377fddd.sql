-- Drop the password_reset_codes table
DROP TABLE IF EXISTS public.password_reset_codes;

-- Drop the cleanup function
DROP FUNCTION IF EXISTS public.cleanup_expired_reset_codes();