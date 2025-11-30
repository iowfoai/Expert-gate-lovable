-- Enable RLS on profiles table (if not already enabled)
alter table public.profiles enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- Create very permissive policy for testing
create policy "Allow all operations for testing"
on public.profiles
for all
to authenticated
using (true)
with check (true);