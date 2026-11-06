/**
 * data.gov.in relay (Cloudflare Worker).
 *
 * Why: api.data.gov.in refuses connections from Vercel's servers (ECONNREFUSED), so the live
 * site's /api/proxy cannot reach it. Vercel forwards mandi-price requests here instead and
 * this Worker passes them on from Cloudflare's network.
 *
 * Safety:
 *  - Holds no API key and no secrets: the caller (our Vercel proxy) sends the request with
 *    its own api-key, exactly as it would to data.gov.in.
 *  - Forwards only GET requests for dataset reads (/resource/<id>) to api.data.gov.in,
 *    so it cannot be used as a general-purpose proxy.
 *  - Never logs URLs (they contain the key).
 */
const UPSTREAM = 'https://api.data.gov.in';
const ALLOWED_PATH = /^\/resource\/[0-9a-f-]{36}$/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/health') return json(200, { ok: true });
    if (request.method !== 'GET') return json(405, { error: { message: 'Only GET is allowed' } });
    if (!ALLOWED_PATH.test(url.pathname)) return json(404, { error: { message: 'Only data.gov.in dataset reads are relayed' } });

    try {
      const upstream = await fetch(`${UPSTREAM}${url.pathname}${url.search}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'AgriSahaya-relay/1.0' },
        signal: AbortSignal.timeout(25000),
      });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' },
      });
    } catch (e) {
      const reason = e?.name === 'TimeoutError' ? 'timeout' : e?.cause?.code || e?.message || 'unknown';
      return json(502, { error: { message: 'data.gov.in did not answer the relay', reason } });
    }
  },
};

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
