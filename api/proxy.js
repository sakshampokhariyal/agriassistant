/**
 * Production version of the dev proxies in vite.config.js (Vercel serverless function).
 * vercel.json rewrites /proxy/<service>/<path> → /api/proxy?path=<service>/<path>.
 *
 *   /proxy/groq/…      → https://api.groq.com/openai/v1/…   (Authorization: Bearer GROQ_API_KEY)
 *   /proxy/datagov/…   → https://api.data.gov.in/…          (&api-key=DATA_GOV_API_KEY)
 *   /proxy/newsdata/…  → https://newsdata.io/api/1/…        (&apikey=NEWSDATA_API_KEY)
 *
 * Keys come from the Vercel project's environment variables and never reach the browser.
 * Without a key the function answers 503, which the app treats as "use the offline fallback".
 */
const env = (...names) => names.map((n) => process.env[n]).find(Boolean) || '';

const SERVICES = {
  groq: {
    key: () => env('GROQ_API_KEY', 'VITE_GROQ_API_KEY'),
    keyName: 'GROQ_API_KEY',
    url: (sub, qs) => `https://api.groq.com/openai/v1/${sub}${qs ? `?${qs}` : ''}`,
    headers: (key) => ({ Authorization: `Bearer ${key}` }),
  },
  datagov: {
    key: () => env('DATA_GOV_API_KEY', 'VITE_DATA_GOV_API_KEY'),
    keyName: 'DATA_GOV_API_KEY',
    url: (sub, qs, key) => `https://api.data.gov.in/${sub}?${qs ? `${qs}&` : ''}api-key=${encodeURIComponent(key)}`,
  },
  newsdata: {
    key: () => env('NEWSDATA_API_KEY', 'VITE_NEWSDATA_API_KEY'),
    keyName: 'NEWSDATA_API_KEY',
    url: (sub, qs, key) => `https://newsdata.io/api/1/${sub}?${qs ? `${qs}&` : ''}apikey=${encodeURIComponent(key)}`,
  },
};

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const { path = '', ...rest } = req.query || {};
  const [service, ...segs] = String(Array.isArray(path) ? path.join('/') : path).split('/');
  const svc = SERVICES[service];
  if (!svc) return res.status(404).json({ error: { message: 'Unknown proxy' } });

  const key = svc.key();
  if (!key) return res.status(503).json({ error: { message: `${svc.keyName} not set` } });

  const qs = new URLSearchParams();
  Object.entries(rest).forEach(([k, v]) => (Array.isArray(v) ? v : [v]).forEach((x) => qs.append(k, x)));
  const sub = segs.map(encodeURIComponent).join('/');

  const init = { method: req.method, headers: { Accept: 'application/json', ...(svc.headers?.(key) || {}) } };
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body != null) {
    init.headers['Content-Type'] = 'application/json';
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(svc.url(sub, qs.toString(), key), { ...init, signal: AbortSignal.timeout(28000) });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: { message: e?.name === 'TimeoutError' ? 'Upstream timed out' : 'Upstream request failed' } });
  }
}
