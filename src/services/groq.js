/**
 * Groq chat completions (OpenAI-compatible) for the farming assistant.
 *
 * Requests go to /proxy/groq (see vite.config.js), which adds the API key SERVER-SIDE –
 * the key is never shipped in the website bundle. In production, host an equivalent
 * proxy (serverless function) at the same path.
 *
 * Any failure (no key → 503, offline, timeout, rate limit, bad response) throws, and the
 * chat falls back to the local rule-based replies in data/ai.js.
 */
import { APP_NAME } from '../config/brand';
import { pestGuides, helplines } from '../data/communityTools';

/** Ground the model in the app's own checked content (English; the model replies in the farmer's language). */
const REFERENCE_NOTES = [
  ...pestGuides.map((g) => `• ${g.crop.en} – ${g.name.en}: signs: ${g.signs.en} Organic: ${g.organic.en} Chemical: ${g.chemical.en}`),
  `• Helplines: ${helplines.map((h) => `${h.title.en} ${h.numbers.map((n) => n.label).join('/')}`).join('; ')}.`,
  '• Sprays: about 200 L of spray solution per acre; do not spray if rain is expected within 24 hours.',
  '• PMFBY crop insurance: report localised crop loss (flood/inundation, hailstorm, landslide, cloudburst, unseasonal rain) and post-harvest loss within 72 hours – via the Crop Insurance app, helpline 14447, the insurance company, bank or agriculture office. Keep photos with location, land records and the policy/application number. A field survey follows. This app\'s "Crop Loss" tab helps prepare the evidence.',
].join('\n');

/**
 * Tried in order; a model the account can't use (404 model_not_found) is skipped and the
 * first one that works is remembered for the session. Groq's catalogue changes over time.
 */
export const GROQ_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
let workingModel = null;
const unavailable = new Set();
/** Model that answered last (shown nowhere; useful when debugging). */
export const activeModel = () => workingModel;
const ENDPOINT = '/proxy/groq/chat/completions';
const TIMEOUT_MS = 20000;
const HISTORY_TURNS = 8;

const LANG_NAME = { en: 'English', hi: 'Hindi (Devanagari script)', kn: 'Kannada (Kannada script)' };

/** Build the system prompt, including live context so answers fit the farmer's day. */
export function systemPrompt({ lang = 'en', context = '' } = {}) {
  return [
    `You are ${APP_NAME}, an expert farming assistant helping Indian farmers with crops, irrigation, weather, soil and fertilizer, pests and diseases, market (mandi) prices, and government schemes like PMFBY, PM-KISAN and Kisan Credit Card. Answer clearly and concisely.`,
    `Reply in ${LANG_NAME[lang] || 'English'}, using simple words a farmer understands. Keep answers under about 150 words.`,
    'Format: short paragraphs; use lines starting with "• " for lists and **bold** for key actions. No tables, no headings.',
    'Give practical, safe advice. For pesticides give the dose per litre of water and remind the farmer to read the label and wear protection. Prefer organic or cultural options first when they work.',
    'Never invent exact prices, scheme amounts or deadlines you are not sure of – say so, and point to the official source (Kisan Call Centre 1800-180-1551, PMFBY helpline 14447, the local Raitha Samparka Kendra or KVK).',
    'If a question is not about farming, rural life or these services, politely steer back to farming.',
    `Verified reference notes (ICAR / UAS extension guidance) – rely on these over your own memory when a question matches:\n${REFERENCE_NOTES}`,
    context && `Current context (use it when relevant):\n${context}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Groq/Llama markdown → the subset RichText renders (**bold**, *italic*, "• " bullets). */
export function normalizeReply(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/g, '') // reasoning models (Qwen) may inline their thinking
    .replace(/\r/g, '')
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s*#{1,6}\s+(.*)$/, '**$1**') // headings → bold line
        .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/, '• ') // -, *, 1., indented • bullets → •
        .replace(/\s+$/, '') // trailing "  " markdown line breaks
        .replace(/__([^_]+)__/g, '**$1**')
        .replace(/`([^`]+)`/g, '$1')
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Ask Groq. `history` is [{ role: 'user'|'assistant', content }] (oldest first),
 * ending with the new user question. Returns the normalized reply text or throws.
 */
export async function askGroq(history, { lang, context, signal } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort);
  const messages = [{ role: 'system', content: systemPrompt({ lang, context }) }, ...history.slice(-HISTORY_TURNS * 2)];
  const candidates = workingModel ? [workingModel] : GROQ_MODELS.filter((m) => !unavailable.has(m));
  try {
    for (const model of candidates) {
      const reasoning = model.startsWith('openai/gpt-oss');
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          model,
          temperature: 0.4,
          // Reasoning models spend part of the budget thinking before they answer.
          max_tokens: reasoning ? 1500 : 600,
          ...(reasoning ? { reasoning_effort: 'low' } : {}),
          messages,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) throw new Error(`Groq HTTP ${res.status}`);
      const data = await res.json();
      if (res.status === 404 || data?.error?.code === 'model_not_found') {
        unavailable.add(model);
        if (workingModel === model) workingModel = null;
        continue; // try the next model
      }
      if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${data?.error?.message || ''}`);
      const text = normalizeReply(data?.choices?.[0]?.message?.content);
      if (!text) throw new Error('Groq: empty reply');
      workingModel = model;
      return text;
    }
    throw new Error('Groq: no available model');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
