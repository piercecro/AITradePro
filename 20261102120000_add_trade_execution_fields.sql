-- Add execution fields for order management and live trade processing
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'market',
  ADD COLUMN IF NOT EXISTS execution_price numeric,
  ADD COLUMN IF NOT EXISTS stop_loss_price numeric,
  ADD COLUMN IF NOT EXISTS take_profit_price numeric;

-- Keep user balance and PnL in sync for live trading flows
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS available_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_profit numeric DEFAULT 0;
