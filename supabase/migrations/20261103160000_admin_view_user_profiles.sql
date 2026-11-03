-- Allow authenticated administrators to list user profiles in the admin panel.
-- The SECURITY DEFINER helper avoids recursive RLS evaluation on user_profiles.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all user profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());
