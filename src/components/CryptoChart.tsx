import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { supabase } from '../lib/supabase';

interface PriceData {
  date: string;
  bitcoin: number;
  ethereum: number;
  gold: number;
  silver: number;
  eur: number;
  gbp: number;
  usd: number;
}

export const CryptoChart = () => {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // 🧠 Step 1: Try to load from Supabase
    const { data: dbData, error } = await supabase
      .from('crypto_prices')
      .select('*')
      .order('date', { ascending: true })
      .limit(7);

    if (!error && dbData && dbData.length === 7) {
      // ✅ Use existing DB data
      const formatted = dbData.map((d) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bitcoin: Number(d.bitcoin_usd),
        ethereum: Number(d.ethereum_usd),
        gold: Number(d.gold_usd),
        silver: Number(d.silver_usd),
        eur: Number(d.eur_usd),
        gbp: Number(d.gbp_usd),
        usd: 1,
      }));
      setData(formatted);
      setLoading(false);
      return;
    }

    // 🔄 Step 2: Fetch fresh data if table is empty
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const results: PriceData[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(sevenDaysAgo.getDate() + i);

      try {
        // Fetch BTC + ETH + forex live from CoinGecko
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,eur,gbp'
        );
        const live = await res.json();

        // Mock metals data
        const mockMetals = {
          gold: 2350 + Math.random() * 50 - 25,
          silver: 28 + Math.random() * 1 - 0.5,
        };

        const row: PriceData = {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          bitcoin: live.bitcoin.usd,
          ethereum: live.ethereum.usd,
          gold: mockMetals.gold,
          silver: mockMetals.silver,
          eur: live.bitcoin.eur ? 1 / (live.bitcoin.eur / live.bitcoin.usd) : 1.08,
          gbp: live.bitcoin.gbp ? 1 / (live.bitcoin.gbp / live.bitcoin.usd) : 1.25,
          usd: 1,
        };

        results.push(row);

        // Store in Supabase
        await supabase.from('crypto_prices').insert({
          date: date.toISOString().split('T')[0],
          bitcoin_usd: row.bitcoin,
          ethereum_usd: row.ethereum,
          gold_usd: row.gold,
          silver_usd: row.silver,
          eur_usd: row.eur,
          gbp_usd: row.gbp,
        });
      } catch (err) {
        console.error('Error fetching data', err);
      }
    }

    setData(results);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-[#13151f] text-gray-400 p-8 rounded-xl text-center border border-gray-800">
        Loading market data...
      </div>
    );
  }

  return (
    <div className="bg-[#13151f] p-6 rounded-xl border border-gray-800">
      <h2 className="text-white text-xl font-semibold mb-6">7-Day Market Overview</h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="date" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip contentStyle={{ backgroundColor: '#1a1d29', border: 'none' }} />
          <Legend />
          <Line type="monotone" dataKey="bitcoin" stroke="#f7931a" strokeWidth={2} name="BTC/USD" />
          <Line type="monotone" dataKey="ethereum" stroke="#627eea" strokeWidth={2} name="ETH/USD" />
          <Line type="monotone" dataKey="gold" stroke="#ffd700" strokeWidth={2} name="Gold" />
          <Line type="monotone" dataKey="silver" stroke="#c0c0c0" strokeWidth={2} name="Silver" />
          <Line type="monotone" dataKey="eur" stroke="#1e90ff" strokeWidth={2} name="EUR/USD" />
          <Line type="monotone" dataKey="gbp" stroke="#32cd32" strokeWidth={2} name="GBP/USD" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CryptoChart;
