/**
 * Press Information Bureau (PIB) press-release RSS.
 * Official source: https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1&reg=1
 * Fetched through the /proxy/pib dev proxy (PIB sends no CORS headers).
 *
 * Returns { source: 'live' | 'cache', items, fetchedAt, error }  or throws when nothing is available.
 * Item: { id, title, link, pubDate|null, agri, dept }
 */
export const PIB_FEED_URL = 'https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1&reg=1';
const PROXY_URL = '/proxy/pib/RssMain.aspx?ModId=6&Lang=1&Regid=1&reg=1';
const CACHE_KEY = 'ks-pib-v1';

/** Agriculture & rural-livelihood topics (matched against the release title). */
const AGRI = /\b(agri\w*|farm(er|ers|ing)?|kisan|krishi|crop\w*|fertili[sz]er\w*|msp|minimum support price|horticultur\w*|fisher\w*|aquacultur\w*|dairy|animal husbandry|livestock|seeds?|irrigation|millets?|shree anna|pm-?kisan|pmfby|fasal|food processing|cooperative\w*|soil|kharif|rabi|pulses|oilseeds?|wheat|rice|paddy|sugarcane|cotton|procurement|natural farming|organic|e-?nam|mandi|drought|monsoon|rural)\b/i;
/** Releases from (or about) the Agriculture Ministry / Department. */
const DEPT = /(ministry of agriculture|department of agriculture|agriculture (and|&) farmers'? welfare|agriculture minister|union minister of agriculture|icar\b|krishi)/i;

const text = (el, tag) => el.getElementsByTagName(tag)[0]?.textContent?.trim() || '';

/** Parse RSS XML text into items. Uses DOMParser (no HTML is ever injected into the page). */
export function parseRss(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('bad_xml');
  return Array.from(doc.getElementsByTagName('item'))
    .map((it, i) => {
      const title = text(it, 'title');
      const link = text(it, 'link');
      if (!title) return null;
      // Only allow official PIB links.
      const safeLink = /^https:\/\/(www\.)?pib\.gov\.in\//i.test(link) ? link : null;
      const prid = link.match(/PRID=(\d+)/i)?.[1];
      const pub = text(it, 'pubDate');
      const pubDate = pub && !Number.isNaN(Date.parse(pub)) ? Date.parse(pub) : null;
      return { id: prid || `pib-${i}`, prid: prid ? Number(prid) : null, title, link: safeLink, pubDate, agri: AGRI.test(title), dept: DEPT.test(title) };
    })
    .filter(Boolean)
    .sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0) || (b.prid || 0) - (a.prid || 0));
}

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
};

export async function fetchPibFeed({ timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(PROXY_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`http_${res.status}`);
    const fresh = parseRss(await res.text());
    if (!fresh.length) throw new Error('no_records');
    const at = Date.now();
    // The feed only carries the latest ~20 releases from all ministries, so keep a rolling
    // history on this device (newest first, max 150) – agriculture items aren't lost.
    const seen = new Map();
    [...fresh, ...(readCache()?.items || [])].forEach((i) => !seen.has(i.id) && seen.set(i.id, i));
    const items = [...seen.values()]
      .sort((a, b) => (b.pubDate || 0) - (a.pubDate || 0) || (b.prid || 0) - (a.prid || 0))
      .slice(0, 150);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ items, at }));
    } catch {
      /* optional */
    }
    return { source: 'live', items, fetchedAt: at, error: null };
  } catch (e) {
    const err = e.name === 'AbortError' ? 'timeout' : e.message || 'network';
    const c = readCache();
    if (c?.items?.length) return { source: 'cache', items: c.items, fetchedAt: c.at, error: err };
    const fail = new Error(err);
    throw fail;
  } finally {
    clearTimeout(timer);
  }
}
