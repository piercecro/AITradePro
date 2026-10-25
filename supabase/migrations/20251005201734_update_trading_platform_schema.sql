/*
  # Update AITradePro Trading Platform Schema

  1. Tables Updates
    - Drop old tables and create new structure
    - `user_profiles` - Updated with deposit/withdrawal fields
    - `deposits` - Track all deposit transactions
    - `withdrawals` - Track all withdrawal requests
    - `trades` - Track trading activity
    - `bot_connections` - Track bot connection status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop old tables if they exist
DROP TABLE IF EXISTS profit_records CASCADE;
DROP TABLE IF EXISTS user_token_purchases CASCADE;
DROP TABLE IF EXISTS token_stages CASCADE;
DROP TABLE IF EXISTS trades CASCADE;

-- Update user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'available_balance'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN IF EXISTS trading_balance;
    ALTER TABLE user_profiles DROP COLUMN IF EXISTS checking_account;
    ALTER TABLE user_profiles DROP COLUMN IF EXISTS tokens_balance;
    ALTER TABLE user_profiles DROP COLUMN IF EXISTS kyc_verified;

    ALTER TABLE user_profiles ADD COLUMN available_balance numeric DEFAULT 0;
    ALTER TABLE user_profiles ADD COLUMN total_deposited numeric DEFAULT 0;
    ALTER TABLE user_profiles ADD COLUMN total_withdrawn numeric DEFAULT 0;
    ALTER TABLE user_profiles ADD COLUMN total_profit numeric DEFAULT 0;
  END IF;
END $$;

-- Deposits Table
CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  crypto_type text,
  transaction_hash text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
DROP POLICY IF EXISTS "Users can insert own deposits" ON deposits;

CREATE POLICY "Users can view own deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposits"
  ON deposits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  wallet_address text NOT NULL,
  crypto_type text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON withdrawals;

CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
  ON withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trades Table (Recreate with new structure)
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  trading_pair text NOT NULL,
  trade_type text NOT NULL,
  amount numeric NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric,
  profit_loss numeric DEFAULT 0,
  status text DEFAULT 'active',
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trades" ON trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
DROP POLICY IF EXISTS "Users can update own trades" ON trades;

CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Bot Connections Table
CREATE TABLE IF NOT EXISTS bot_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  bot_name text NOT NULL,
  is_connected boolean DEFAULT false,
  connected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, bot_name)
);

ALTER TABLE bot_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bot connections" ON bot_connections;
DROP POLICY IF EXISTS "Users can manage own bot connections" ON bot_connections;

CREATE POLICY "Users can view own bot connections"
  ON bot_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bot connections"
  ON bot_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
