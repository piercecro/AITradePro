-- Fix missing user profile columns required by the app
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

UPDATE public.user_profiles
SET role = 'user'
WHERE role IS NULL OR role = '';

-- Ensure the profile row is created with expected defaults if the table was created earlier without these fields
ALTER TABLE public.user_profiles
  ALTER COLUMN role SET DEFAULT 'user';

-- Backfill any existing rows that are missing a role
UPDATE public.user_profiles
SET role = 'user'
WHERE role IS NULL;

-- Ensure the app can read the current user from the profile table
CREATE INDEX IF NOT EXISTS user_profiles_email_idx
  ON public.user_profiles (email);
