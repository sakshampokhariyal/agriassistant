import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev / preview proxies for official live feeds:
 *  - /proxy/datagov → https://api.data.gov.in   (Agmarknet mandi prices)
 *  - /proxy/pib     → https://www.pib.gov.in    (PIB press-release RSS)
 * Neither source sends CORS headers, so browsers can't call them directly.
 * The data.gov.in API key is added HERE, server-side, from DATA_GOV_API_KEY in .env.local,
 * so it is never bundled into the website. In production, host an equivalent proxy.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Accept either name; the key is only used here (server-side) and never read by app code.
  const apiKey = env.DATA_GOV_API_KEY || env.VITE_DATA_GOV_API_KEY || '';

  const proxy = {
    '/proxy/datagov': {
      target: 'https://api.data.gov.in',
      changeOrigin: true,
      timeout: 20000,
      proxyTimeout: 20000,
      rewrite: (p) => {
        const path = p.replace(/^\/proxy\/datagov/, '');
        return apiKey ? `${path}${path.includes('?') ? '&' : '?'}api-key=${encodeURIComponent(apiKey)}` : path;
      },
    },
    '/proxy/pib': {
      target: 'https://www.pib.gov.in',
      changeOrigin: true,
      timeout: 20000,
      proxyTimeout: 20000,
      rewrite: (p) => p.replace(/^\/proxy\/pib/, ''),
      headers: { 'User-Agent': 'Mozilla/5.0 (AgriSahaya prototype)' },
    },
  };

  return {
    plugins: [react()],
    server: { port: 5173, host: true, proxy },
    preview: { proxy },
  };
});
