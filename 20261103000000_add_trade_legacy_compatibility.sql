-- Add legacy-compatible trade columns so older app code and newer schema can coexist.
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS trading_pair text,
  ADD COLUMN IF NOT EXISTS entry_price numeric,
  ADD COLUMN IF NOT EXISTS exit_price numeric,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

UPDATE public.trades
SET trading_pair = COALESCE(trading_pair, token_pair),
    entry_price = COALESCE(entry_price, execution_price),
    opened_at = COALESCE(opened_at, created_at)
WHERE trading_pair IS NULL OR entry_price IS NULL OR opened_at IS NULL;

-- Ensure newer flows keep using the current schema fields while older code still has values.
UPDATE public.trades
SET execution_price = COALESCE(execution_price, entry_price)
WHERE execution_price IS NULL AND entry_price IS NOT NULL;
