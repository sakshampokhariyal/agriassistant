/**
 * Live agriculture news from newsdata.io (Indian sources, in the app's language).
 * Requests go to /proxy/newsdata (vite.config.js), which adds NEWSDATA_API_KEY server-side –
 * the key is never in the website bundle. In production, host an equivalent proxy.
 *
 * The free plan allows ~200 requests/day, so results are cached per language for 30 minutes
 * (Refresh bypasses the cache). On failure the last cached headlines are shown.
 *
 * Returns { source: 'live' | 'cache', items, fetchedAt, error }; throws when nothing is available.
 * Item: { id, title, description, link, image, source, sourceIcon, pubDate (ms), lang }
 */
export const NEWSDATA_URL = 'https://newsdata.io';
const CACHE_PREFIX = 'ks-news-v1-';
const FRESH_MS = 30 * 60 * 1000;

/** Headline keywords per language (searched in titles only, so results stay on-topic). */
const QUERY = {
  en: 'farmers OR farmer OR agriculture OR crop OR crops OR kisan OR mandi OR MSP OR monsoon',
  hi: 'किसान OR किसानों OR कृषि OR फसल OR खेती OR मंडी',
  kn: 'ರೈತ OR ರೈತರು OR ರೈತರ OR ಕೃಷಿ OR ಬೆಳೆ',
};

const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//i.test(u) ? u : null);
const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n).replace(/\s+\S*$/, '')}…` : t;
};
/** newsdata gives "YYYY-MM-DD HH:mm:ss" plus a timezone (UTC). */
const parseDate = (d, tz) => {
  if (!d) return null;
  const ms = Date.parse(`${d.replace(' ', 'T')}${!tz || /utc/i.test(tz) ? 'Z' : ''}`);
  return Number.isNaN(ms) ? null : ms;
};

export function normalizeArticles(results, lang) {
  const seen = new Set();
  return (Array.isArray(results) ? results : [])
    .filter((a) => a && a.title && !a.duplicate)
    .map((a) => ({
      id: a.article_id || a.link,
      title: clip(a.title, 220),
      description: clip(a.description, 260),
      link: safeUrl(a.link),
      image: safeUrl(a.image_url),
      source: a.source_name || a.source_id || '',
      sourceIcon: safeUrl(a.source_icon),
      pubDate: parseDate(a.pubDate, a.pubDateTZ),
      lang,
    }))
    .filter((a) => {
      const k = a.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      if (!a.link || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0));
}

const readCache = (lang) => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_PREFIX + lang));
  } catch {
    return null;
  }
};

/** Map HTTP / API failures to short codes the UI translates. */
function errorCode(status, body) {
  if (status === 503) return 'not_configured';
  if (status === 401 || status === 403) return 'key';
  if (status === 429) return 'rate';
  const msg = JSON.stringify(body?.results || body || '').toLowerCase();
  if (msg.includes('apikey') || msg.includes('unauthor')) return 'key';
  if (msg.includes('rate') || msg.includes('limit')) return 'rate';
  return status >= 500 ? 'server' : 'network';
}

export async function fetchAgriNews(lang = 'en', { force = false, timeoutMs = 15000 } = {}) {
  const l = QUERY[lang] ? lang : 'en';
  const cached = readCache(l);
  if (!force && cached?.items?.length && Date.now() - cached.at < FRESH_MS) {
    return { source: 'live', items: cached.items, fetchedAt: cached.at, error: null };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const qs = new URLSearchParams({ country: 'in', language: l, qInTitle: QUERY[l], removeduplicate: '1' });
    const res = await fetch(`/proxy/newsdata/latest?${qs}`, { signal: ctrl.signal });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.status !== 'success') throw new Error(errorCode(res.status, body));
    const items = normalizeArticles(body.results, l);
    if (!items.length) throw new Error('empty');
    const at = Date.now();
    try {
      localStorage.setItem(CACHE_PREFIX + l, JSON.stringify({ items, at }));
    } catch {
      /* cache optional */
    }
    return { source: 'live', items, fetchedAt: at, error: null };
  } catch (e) {
    const err = e.name === 'AbortError' ? 'timeout' : e.message || 'network';
    if (cached?.items?.length) return { source: 'cache', items: cached.items, fetchedAt: cached.at, error: err };
    throw new Error(err);
  } finally {
    clearTimeout(timer);
  }
}
