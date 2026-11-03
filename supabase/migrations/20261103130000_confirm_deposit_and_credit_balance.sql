-- Atomically confirm a pending deposit and credit the user's available balance.
-- This replaces the client-side status update + missing/unsafe legacy RPC sequence.
CREATE OR REPLACE FUNCTION public.confirm_deposit_and_credit_balance(deposit_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  actor_id uuid;
  deposit_row public.deposits%ROWTYPE;
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
    RAISE EXCEPTION 'Only administrators can confirm deposits';
  END IF;

  SELECT * INTO deposit_row
  FROM public.deposits
  WHERE id = deposit_id_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found';
  END IF;

  IF deposit_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Deposit is not pending; it may already have been processed';
  END IF;

  IF deposit_row.amount IS NULL OR deposit_row.amount <= 0 THEN
    RAISE EXCEPTION 'Deposit amount must be greater than zero';
  END IF;

  UPDATE public.user_profiles
  SET available_balance = COALESCE(available_balance, 0) + deposit_row.amount,
      total_deposited = COALESCE(total_deposited, 0) + deposit_row.amount,
      updated_at = now()
  WHERE id = deposit_row.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile for this deposit was not found';
  END IF;

  UPDATE public.deposits
  SET status = 'confirmed',
      confirmed_at = now()
  WHERE id = deposit_row.id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_deposit_and_credit_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_deposit_and_credit_balance(uuid) TO authenticated;

-- Prevent ordinary users from promoting themselves to administrator via the
-- existing own-profile UPDATE policy. Existing admin accounts remain editable.
CREATE OR REPLACE FUNCTION public.prevent_non_admin_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role
     AND COALESCE(OLD.role, 'user') <> 'admin' THEN
    RAISE EXCEPTION 'Only an existing administrator can change an account role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_prevent_non_admin_role_change ON public.user_profiles;
CREATE TRIGGER user_profiles_prevent_non_admin_role_change
BEFORE UPDATE OF role ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_non_admin_role_change();
