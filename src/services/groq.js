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
 * Models, tried in order; one the account can't use (404 model_not_found) is skipped and the
 * first that works is remembered per mode for the session. Groq's catalogue changes over time.
 *  - text:   llama-3.3-70b-versatile first (falls through to gpt-oss-120b if the account lacks it)
 *  - vision: qwen/qwen3.8-27b reads attached crop photos (image_url with a base64 data URL)
 */
export const GROQ_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
export const VISION_MODELS = ['qwen/qwen3.8-27b'];
const working = { text: null, vision: null };
const unavailable = new Set();
/** Model that answered last in a mode (useful when debugging). */
export const activeModel = (mode = 'text') => working[mode];
const ENDPOINT = '/proxy/groq/chat/completions';
const TIMEOUT_MS = 20000;
const VISION_TIMEOUT_MS = 40000;
const HISTORY_TURNS = 8;

const LANG_NAME = { en: 'English', hi: 'Hindi (Devanagari script)', kn: 'Kannada (Kannada script)' };

const ROLE = `You are ${APP_NAME}'s AI Crop Doctor and Agricultural Assistant. Help Indian farmers diagnose crop diseases, analyze plant health, and provide actionable remedies and preventive care.`;

/** Build the system prompt, including live context so answers fit the farmer's day. */
export function systemPrompt({ lang = 'en', context = '', image = false } = {}) {
  return [
    `${ROLE} You also answer questions on irrigation, weather, soil and fertilizer, market (mandi) prices and government schemes such as PMFBY and the Kisan Credit Card. Answer clearly and concisely.`,
    `Reply in ${LANG_NAME[lang] || 'English'}, using simple words a farmer understands. Keep answers under about ${image ? 200 : 150} words.`,
    'Format: short paragraphs; use lines starting with "• " for lists and **bold** for key actions. No tables, no headings.',
    image &&
      'The farmer has attached a photo. First say which crop it looks like and the most likely disease, pest or nutrient problem (or that it looks healthy), with your confidence (high / medium / low) and the visible signs that led you there. Then give organic and chemical remedies and prevention. If the photo is blurry, too far away or not a plant, say so and ask for a close daylight photo of one affected leaf instead of guessing.',
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
 * One chat-completions call with model fallback. Returns the raw message content or throws
 * (no key → 503, offline, timeout, rate limit, every model unavailable).
 */
async function callGroq({ mode, messages, maxTokens, temperature = 0.4, signal }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), mode === 'vision' ? VISION_TIMEOUT_MS : TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort);
  const list = mode === 'vision' ? VISION_MODELS : GROQ_MODELS;
  const candidates = working[mode] ? [working[mode]] : list.filter((m) => !unavailable.has(m));
  try {
    for (const model of candidates) {
      const reasoning = model.startsWith('openai/gpt-oss');
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          model,
          temperature,
          // Reasoning models spend part of the budget thinking before they answer.
          max_tokens: reasoning ? Math.max(1500, maxTokens * 2) : maxTokens,
          ...(reasoning ? { reasoning_effort: 'low' } : {}),
          messages,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) throw new Error(`Groq HTTP ${res.status}`);
      const data = await res.json();
      if (res.status === 404 || data?.error?.code === 'model_not_found') {
        unavailable.add(model);
        if (working[mode] === model) working[mode] = null;
        continue; // try the next model
      }
      // Free tier has tokens-per-minute limits (vision ≈ 8k TPM) – surface it so the UI can say "busy".
      if (res.status === 429) throw new Error('rate_limited');
      if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${data?.error?.message || ''}`);
      const content = data?.choices?.[0]?.message?.content;
      if (!content || !String(content).trim()) throw new Error('Groq: empty reply');
      working[mode] = model;
      return String(content);
    }
    throw new Error('Groq: no available model');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * Ask Groq. `history` is [{ role: 'user'|'assistant', content }] (oldest first), ending with the
 * new user question. With `image` (a base64 data URL) the last user turn becomes multimodal
 * (text + image_url) and the vision model answers. Returns the normalized reply text or throws.
 */
export async function askGroq(history, { lang, context, image, signal } = {}) {
  const turns = history.slice(-HISTORY_TURNS * 2);
  if (image) {
    const last = turns[turns.length - 1];
    const question = last?.role === 'user' && last.content ? last.content : 'Please check this crop photo.';
    turns[turns.length - 1] = {
      role: 'user',
      content: [
        { type: 'text', text: question },
        { type: 'image_url', image_url: { url: image } },
      ],
    };
  }
  const messages = [{ role: 'system', content: systemPrompt({ lang, context, image: Boolean(image) }) }, ...turns];
  const raw = await callGroq({ mode: image ? 'vision' : 'text', messages, maxTokens: image ? 800 : 600, signal });
  const text = normalizeReply(raw);
  if (!text) throw new Error('Groq: empty reply');
  return text;
}

/* ───────────── Crop Doctor: structured photo diagnosis ───────────── */
/** Short notes for photo diagnosis – keeps vision requests inside the free per-minute token limit. */
const PEST_NOTES = pestGuides.map((g) => `• ${g.crop.en} – ${g.name.en}: ${g.signs.en}`).join('\n');
const SEVERITY = ['low', 'medium', 'high'];
const str = (x, n = 400) => (typeof x === 'string' ? x.trim().slice(0, n) : '');
const strList = (x, max = 5) => (Array.isArray(x) ? x.map((s) => str(s, 300)).filter(Boolean).slice(0, max) : []);
const doseList = (x) =>
  (Array.isArray(x) ? x : [])
    .map((d) => ({ name: str(d?.name, 120), dose: str(d?.dose, 60), perAcre: str(d?.perAcre ?? d?.per_acre, 80) }))
    .filter((d) => d.name)
    .slice(0, 3);

/** Pull the JSON object out of a model reply (handles ```json fences and <think> blocks). */
export function parseJsonReply(text) {
  const t = String(text || '').replace(/<think>[\s\S]*?<\/think>/g, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Groq: no JSON in reply');
  return JSON.parse(t.slice(start, end + 1));
}

/**
 * Diagnose a crop photo for the Crop Doctor page. Returns a report in the page's shape:
 * { source:'ai', name, symptoms, severity, confidence, affected, healthy, notPlant, cropSeen,
 *   traditional[], organic[{name,dose,perAcre}], chemical[...], prevention[] } – text in `lang`.
 */
export async function diagnoseCropImage(image, { lang = 'en', cropName = '' } = {}) {
  const language = LANG_NAME[lang] || 'English';
  const system = [
    ROLE,
    'You look at one crop photo and return ONLY a JSON object – no prose, no code fences.',
    `Write every text value in ${language}, in simple words for a farmer. Doses per litre of water; per-acre amounts assume about 200 litres of spray per acre.`,
    'Schema: {"healthy": boolean, "notPlant": boolean, "cropSeen": string, "name": string (disease, pest or deficiency; or "Healthy"), "confidence": number 0-100, "severity": "low"|"medium"|"high", "affected": number 0-100 (approx. % of leaf area affected), "symptoms": string (visible signs, 1-2 sentences), "traditional": [string] (low-cost cultural steps, max 3), "organic": [{"name": string, "dose": string, "perAcre": string}] (max 2), "chemical": [{"name": string, "dose": string, "perAcre": string}] (max 2, only products registered in India), "prevention": [string] (max 3)}.',
    'If the photo is not a plant or too unclear to judge, set notPlant true (or confidence below 40) and explain in "symptoms" what photo to take instead; leave the remedy lists empty.',
    'If the plant looks healthy, set healthy true, name "Healthy", severity "low", affected 0 and give prevention tips only.',
    `Reference notes you may rely on:\n${PEST_NOTES}`,
  ].join('\n');
  const userText = cropName ? `This photo is from the farmer's ${cropName} field. Diagnose it.` : 'Diagnose this crop photo.';
  const raw = await callGroq({
    mode: 'vision',
    temperature: 0.2,
    maxTokens: 700,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: [{ type: 'text', text: userText }, { type: 'image_url', image_url: { url: image } }] },
    ],
  });
  const j = parseJsonReply(raw);
  const confidence = Math.max(0, Math.min(100, Math.round(Number(j.confidence) || 0)));
  return {
    source: 'ai',
    healthy: Boolean(j.healthy),
    notPlant: Boolean(j.notPlant) || confidence < 40,
    cropSeen: str(j.cropSeen, 60),
    name: str(j.name, 120) || (j.healthy ? 'Healthy' : '—'),
    symptoms: str(j.symptoms, 500),
    severity: SEVERITY.includes(j.severity) ? j.severity : 'medium',
    confidence,
    affected: Math.max(0, Math.min(100, Math.round(Number(j.affected) || 0))),
    traditional: strList(j.traditional, 3),
    organic: doseList(j.organic),
    chemical: doseList(j.chemical),
    prevention: strList(j.prevention, 3),
  };
}
