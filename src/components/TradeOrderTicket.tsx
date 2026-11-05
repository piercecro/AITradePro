import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { LivePriceMap } from '../lib/livePrices';
import { useTradePrices } from './TradePricesContext';

type TradeSide = 'Buy' | 'Sell';
type OrderType = 'market' | 'limit' | 'take_profit' | 'stop_loss';

const marketPairs = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XAU/USD', 'AAPL', 'EUR/USD'];
const orderTypes: { value: OrderType; label: string }[] = [
  { value: 'market', label: 'Market' },
  { value: 'limit', label: 'Limit' },
  { value: 'take_profit', label: 'Take profit' },
  { value: 'stop_loss', label: 'Stop loss' },
];
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const priceText = (value: number, symbol: string) => new Intl.NumberFormat('en-US', {
  minimumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'CHF/USD'].includes(symbol) ? 4 : value < 1 ? 6 : 2,
  maximumFractionDigits: ['EUR/USD', 'GBP/USD', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'CHF/USD'].includes(symbol) ? 4 : value < 1 ? 6 : 2,
}).format(value);

export const TradeOrderTicket = () => {
  const { user } = useAuth();
  const prices: LivePriceMap = useTradePrices();
  const [side, setSide] = useState<TradeSide>('Buy');
  const [symbol, setSymbol] = useState('BTC/USD');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState(0.01);
  const [triggerPrice, setTriggerPrice] = useState('');
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadBalance = async () => {
      if (!user) {
        setBalance(0);
        return;
      }
      const { data, error } = await supabase.from('user_profiles').select('available_balance').eq('id', user.id).maybeSingle();
      if (!cancelled && !error) setBalance(Number(data?.available_balance ?? 0));
    };
    void loadBalance();
    return () => { cancelled = true; };
  }, [user]);

  const quote = prices[symbol]?.price ?? 0;
  const price = orderType === 'market' || !triggerPrice ? quote : Number(triggerPrice);
  const estimatedTotal = price * quantity;

  const submitTrade = async () => {
    if (!user) { setMessage('Sign in to place an order.'); return; }
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      setMessage('Enter a valid quantity and price.');
      return;
    }
    if (balance < estimatedTotal) {
      setMessage(`Insufficient balance. Available: ${money(balance)}.`);
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const nextBalance = balance - estimatedTotal;
      const { error: balanceError } = await supabase.from('user_profiles').update({ available_balance: nextBalance }).eq('id', user.id);
      if (balanceError) throw balanceError;

      const { error: insertError } = await supabase.from('trades').insert({
        user_id: user.id,
        token_pair: symbol,
        trading_pair: symbol,
        trade_type: side.toLowerCase(),
        amount: quantity,
        entry_price: price,
        order_type: orderType,
        status: 'active',
        opened_at: new Date().toISOString(),
      });
      if (insertError) {
        await supabase.from('user_profiles').update({ available_balance: balance }).eq('id', user.id);
        throw insertError;
      }
      setBalance(nextBalance);
      setMessage(`${side} order placed for ${quantity} ${symbol}.`);
    } catch (error) {
      console.error('Unable to place trade:', error);
      setMessage('Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-label="Place an order" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.03]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900">Place an order</h2>
          <p className="mt-1 text-[11px] text-slate-500">Balance · {money(balance)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-right">
          <div className="text-[10px] font-medium text-slate-500">{symbol}</div>
          <div className="text-xs font-bold tabular-nums text-slate-900">{quote ? priceText(quote, symbol) : '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Trade side">
        {(['Buy', 'Sell'] as const).map((value) => (
          <button key={value} type="button" aria-pressed={side === value} onClick={() => setSide(value)}
            className={`min-h-9 rounded-md px-3 text-xs font-bold transition-all ${side === value ? value === 'Buy' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>
            {value}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
        Market
        <select aria-label="Market pair" value={symbol} onChange={(event) => setSymbol(event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
          {marketPairs.map((pair) => <option key={pair} value={pair}>{pair}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
        Order type
        <select aria-label="Order type" value={orderType} onChange={(event) => setOrderType(event.target.value as OrderType)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
          {orderTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
        Quantity
        <input aria-label="Quantity" type="number" min="0.000001" step="any" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
      </label>

      {orderType === 'market' ? (
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px]">
          <span className="text-slate-500">Estimated total</span>
          <span className="font-bold tabular-nums text-slate-900">{money(estimatedTotal)}</span>
        </div>
      ) : (
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
          Trigger price
          <input aria-label="Trigger price" type="number" min="0.000001" step="any" value={triggerPrice} onChange={(event) => setTriggerPrice(event.target.value)} placeholder={String(quote || '')} className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          <span className="font-normal text-slate-500">Estimated value: {money(estimatedTotal)}</span>
        </label>
      )}

      {message && <p role="status" className="text-[11px] text-slate-600">{message}</p>}
      <button type="button" onClick={() => void submitTrade()} disabled={submitting || !quote}
        className={`min-h-10 w-full rounded-lg px-4 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${side === 'Buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
        {submitting ? 'Placing order…' : `${side} ${symbol}`}
      </button>
    </section>
  );
};
