-- Repair account balance fields without overwriting existing user balances.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS available_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_deposited numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_withdrawn numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_profit numeric NOT NULL DEFAULT 0;

-- Preserve balances from older installations that used trading_balance.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'trading_balance'
  ) THEN
    EXECUTE '
      UPDATE public.user_profiles
      SET available_balance = COALESCE(trading_balance, 0)
      WHERE COALESCE(available_balance, 0) = 0
        AND COALESCE(trading_balance, 0) <> 0
    ';
  END IF;
END $$;

UPDATE public.user_profiles
SET available_balance = COALESCE(available_balance, 0),
    total_deposited = COALESCE(total_deposited, 0),
    total_withdrawn = COALESCE(total_withdrawn, 0),
    total_profit = COALESCE(total_profit, 0);

ALTER TABLE public.user_profiles
  ALTER COLUMN available_balance SET DEFAULT 0,
  ALTER COLUMN total_deposited SET DEFAULT 0,
  ALTER COLUMN total_withdrawn SET DEFAULT 0,
  ALTER COLUMN total_profit SET DEFAULT 0;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
