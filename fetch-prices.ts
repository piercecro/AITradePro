// project/api/fetch-prices.ts
import { createClient } from '@supabase/supabase-js'

// ✅ These environment variables will be configured in Vercel
const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

// Create a Supabase client using the SERVICE ROLE key (server-only)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req: Request): Promise<Response> {
  try {
    // Fetch crypto + metal + fiat prices from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,gold,silver&vs_currencies=usd,eur,gbp'
    )
    const data = await response.json()

    const prices = [
      { asset: 'BTC', usd: data.bitcoin.usd, eur: data.bitcoin.eur, gbp: data.bitcoin.gbp },
      { asset: 'ETH', usd: data.ethereum.usd, eur: data.ethereum.eur, gbp: data.ethereum.gbp },
      { asset: 'GOLD', usd: data.gold.usd, eur: data.gold.eur, gbp: data.gold.gbp },
      { asset: 'SILVER', usd: data.silver.usd, eur: data.silver.eur, gbp: data.silver.gbp },
      { asset: 'USD', usd: 1, eur: 1 / data.bitcoin.eur * data.bitcoin.usd, gbp: 1 / data.bitcoin.gbp * data.bitcoin.usd },
      { asset: 'EUR', usd: data.bitcoin.usd / data.bitcoin.eur, eur: 1, gbp: data.bitcoin.gbp / data.bitcoin.eur },
      { asset: 'GBP', usd: data.bitcoin.usd / data.bitcoin.gbp, eur: data.bitcoin.eur / data.bitcoin.gbp, gbp: 1 },
    ]

    // Store fetched data in Supabase
    const { error } = await supabase.from('crypto_prices').insert(
      prices.map(p => ({
        asset: p.asset,
        usd: p.usd,
        eur: p.eur,
        gbp: p.gbp,
        timestamp: new Date().toISOString(),
      }))
    )

    if (error) {
      console.error('Supabase insert error:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, inserted: prices.length }), { status: 200 })
  } catch (err) {
    console.error('API error:', err)
    return new Response(JSON.stringify({ error: 'Failed to fetch prices' }), { status: 500 })
  }
}
