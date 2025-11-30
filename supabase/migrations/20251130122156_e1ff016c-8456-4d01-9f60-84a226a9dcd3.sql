-- Create deleted_accounts table to store information about deleted accounts
CREATE TABLE public.deleted_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  user_type public.user_type,
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  deletion_reason text
);

-- Enable RLS on deleted_accounts
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Only admins can view deleted accounts (for now, no policy = no access)
-- This prevents any user from seeing deleted account data

-- Add index for faster lookups
CREATE INDEX idx_deleted_accounts_user_id ON public.deleted_accounts(user_id);
CREATE INDEX idx_deleted_accounts_deleted_at ON public.deleted_accounts(deleted_at);