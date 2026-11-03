-- Apply a percentage increase to one user's available balance.
-- The database validates admin privileges and applies the change atomically.
CREATE OR REPLACE FUNCTION public.increase_user_balance_by_percentage(
  target_user_id uuid,
  percentage numeric
)
RETURNS TABLE (
  previous_balance numeric,
  increase_amount numeric,
  new_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  actor_id uuid;
  current_balance numeric;
  calculated_increase numeric;
BEGIN
  actor_id := auth.uid();

  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_profiles admin_profile
    WHERE admin_profile.id = actor_id
      AND admin_profile.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can adjust user balances';
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'A target user is required';
  END IF;

  IF percentage IS NULL OR percentage <= 0 OR percentage > 100 THEN
    RAISE EXCEPTION 'Percentage must be greater than 0 and no more than 100';
  END IF;

  SELECT COALESCE(profile.available_balance, 0)
  INTO current_balance
  FROM public.user_profiles profile
  WHERE profile.id = target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  calculated_increase := round(current_balance * percentage / 100, 2);

  UPDATE public.user_profiles profile
  SET available_balance = current_balance + calculated_increase,
      updated_at = now()
  WHERE profile.id = target_user_id;

  RETURN QUERY
  SELECT current_balance,
         calculated_increase,
         current_balance + calculated_increase;
END;
$$;

REVOKE ALL ON FUNCTION public.increase_user_balance_by_percentage(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increase_user_balance_by_percentage(uuid, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.increase_user_balance_by_percentage(uuid, numeric) TO authenticated;
