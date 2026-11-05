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
  // Groq key is attached here, server-side; app code never reads it, so it is not bundled.
  const groqKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || '';

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
    // Groq (OpenAI-compatible) chat: /proxy/groq/chat/completions → api.groq.com/openai/v1/chat/completions
    '/proxy/groq': {
      target: 'https://api.groq.com',
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      rewrite: (p) => p.replace(/^\/proxy\/groq/, '/openai/v1'),
      headers: { Authorization: `Bearer ${groqKey}` },
    },
  };

  /** Without a key, answer 503 JSON so the chat falls back to its local replies immediately. */
  const groqKeyGuard = {
    name: 'groq-key-guard',
    configureServer(server) {
      server.middlewares.use('/proxy/groq', (req, res, next) => {
        if (groqKey) return next();
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: { message: 'GROQ_API_KEY not set' } }));
      });
    },
    configurePreviewServer(server) {
      this.configureServer(server);
    },
  };

  return {
    plugins: [react(), groqKeyGuard],
    server: { port: 5173, host: true, proxy },
    preview: { proxy },
  };
});
