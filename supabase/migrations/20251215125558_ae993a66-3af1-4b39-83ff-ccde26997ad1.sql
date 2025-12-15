-- Add is_deleted column to profiles table for admin deletion functionality
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Add deleted_by column to track which admin deleted the account
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Add deleted_at column to track when the account was deleted
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;