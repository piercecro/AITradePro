-- Record the account that referred a newly registered user.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_profiles_referred_by_idx
  ON public.user_profiles (referred_by);

-- Expose only the signed-in user's referee total, not other users' profile records.
CREATE OR REPLACE FUNCTION public.get_my_referral_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT count(*)
  FROM public.user_profiles
  WHERE referred_by = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_referral_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referral_count() TO authenticated;
