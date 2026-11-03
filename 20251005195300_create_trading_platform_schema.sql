/*
  # AITradePro Trading Platform Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `trading_balance` (numeric, default 0)
      - `checking_account` (numeric, default 0)
      - `tokens_balance` (numeric, default 0)
      - `tier` (integer, default 0)
      - `kyc_verified` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `token_stages`
      - `id` (uuid, primary key)
      - `stage_number` (integer, unique)
      - `stage_name` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `total_available` (numeric)
      - `price` (numeric)
      - `status` (text)
      - `created_at` (timestamptz)
    
    - `user_token_purchases`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `stage_id` (uuid, references token_stages)
      - `amount` (numeric)
      - `price` (numeric)
      - `purchased_at` (timestamptz)
    
    - `trades`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `token_pair` (text)
      - `trade_type` (text)
      - `amount` (numeric)
      - `profit_loss` (numeric)
      - `status` (text)
      - `created_at` (timestamptz)
    
    - `profit_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `amount` (numeric)
      - `profit_type` (text)
      - `date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Restrict data access based on user ownership
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  trading_balance numeric DEFAULT 0,
  checking_account numeric DEFAULT 0,
  tokens_balance numeric DEFAULT 0,
  tier integer DEFAULT 0,
  kyc_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Token Stages Table
CREATE TABLE IF NOT EXISTS token_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_number integer UNIQUE NOT NULL,
  stage_name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  total_available numeric NOT NULL,
  price numeric NOT NULL,
  status text DEFAULT 'Nonactive',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view token stages"
  ON token_stages FOR SELECT
  TO authenticated
  USING (true);

-- User Token Purchases Table
CREATE TABLE IF NOT EXISTS user_token_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  stage_id uuid REFERENCES token_stages(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  price numeric NOT NULL,
  purchased_at timestamptz DEFAULT now()
);

ALTER TABLE user_token_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON user_token_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON user_token_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trades Table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  token_pair text NOT NULL,
  trade_type text NOT NULL,
  amount numeric NOT NULL,
  profit_loss numeric DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Profit Records Table
CREATE TABLE IF NOT EXISTS profit_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  profit_type text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profit records"
  ON profit_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profit records"
  ON profit_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert sample token stages
INSERT INTO token_stages (stage_number, stage_name, start_date, end_date, total_available, price, status)
VALUES 
  (6, 'Pre-sale Stage 6', '2025-09-16', '2025-09-22', 30000000, 0.30260443, 'Completed'),
  (7, 'Pre-sale Stage 7', '2025-09-30', '2025-10-06', 50000000, 0.574439, 'Nonactive'),
  (8, 'Pre-sale Stage 8', '2025-10-14', '2025-10-20', 70000000, 0.8616585, 'Nonactive')
ON CONFLICT (stage_number) DO NOTHING;