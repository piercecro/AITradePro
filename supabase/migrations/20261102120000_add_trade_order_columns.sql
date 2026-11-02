ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'market',
  ADD COLUMN IF NOT EXISTS execution_price numeric,
  ADD COLUMN IF NOT EXISTS stop_loss_price numeric,
  ADD COLUMN IF NOT EXISTS take_profit_price numeric;

UPDATE trades
SET order_type = COALESCE(order_type, 'market'),
    execution_price = COALESCE(execution_price, entry_price),
    stop_loss_price = COALESCE(stop_loss_price, NULL),
    take_profit_price = COALESCE(take_profit_price, NULL)
WHERE order_type IS NULL OR execution_price IS NULL;
