import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function localMarketApi(apiKey: string): Plugin {
  return {
    name: 'local-market-api',
    configureServer(server) {
      server.middlewares.use('/api/market', async (req, res) => {
        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(body));
        };

        if (req.method !== 'GET') {
          res.setHeader('Allow', 'GET');
          sendJson(405, { error: 'Method not allowed' });
          return;
        }
        if (!apiKey) {
          sendJson(503, { error: 'Market data is not configured. Set TWELVE_DATA_API_KEY in .env.local.' });
          return;
        }

        try {
          const requestUrl = new URL(req.url ?? '/', 'http://localhost');
          const symbol = requestUrl.searchParams.get('symbol');
          const interval = requestUrl.searchParams.get('interval') ?? '1min';
          const outputsize = Math.min(Math.max(Number(requestUrl.searchParams.get('outputsize') ?? 100), 10), 500);
          if (!symbol || !/^[A-Za-z0-9._/-]{1,40}$/.test(symbol)) {
            sendJson(400, { error: 'Provide a valid market symbol.' });
            return;
          }

          const upstream = new URL('https://api.twelvedata.com/time_series');
          upstream.searchParams.set('symbol', symbol);
          upstream.searchParams.set('interval', interval);
          upstream.searchParams.set('outputsize', String(outputsize));
          upstream.searchParams.set('order', 'ASC');
          upstream.searchParams.set('apikey', apiKey);
          const response = await fetch(upstream, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
          const body = await response.json() as { status?: string; message?: string; meta?: unknown; values?: Array<Record<string, unknown>> };

          if (!response.ok || body.status === 'error' || !Array.isArray(body.values)) {
            sendJson(502, { error: body.message ?? `Twelve Data request failed (${response.status})` });
            return;
          }
          const candles = body.values.map((bar) => ({
            time: bar.datetime,
            open: Number(bar.open), high: Number(bar.high), low: Number(bar.low),
            close: Number(bar.close), volume: Number(bar.volume ?? 0),
          }));
          sendJson(200, { symbol, interval, meta: body.meta ?? {}, candles });
        } catch (error) {
          console.error('Local Twelve Data request failed:', error);
          sendJson(502, { error: 'Unable to load market data.' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), localMarketApi(env.TWELVE_DATA_API_KEY ?? '')],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
