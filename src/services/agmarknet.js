/**
 * Agmarknet – "Current Daily Price of Various Commodities from Various Markets (Mandi)"
 * Official source: data.gov.in (resource 9ef84268-d588-465a-a308-a864a43d0070).
 * Called through the /proxy/datagov dev proxy, which adds the API key server-side.
 *
 * Returns { source: 'live' | 'cache' | 'sample' | 'none', rows, scope, fetchedAt, error }.
 * Order: live → last saved prices → clearly labelled sample prices (data/samplePrices.js) → none.
 * Sample prices are never cached, so they can never be mistaken for live data later.
 * Rows: { id, market, district, state, variety, date, min, max, modal }  (₹ / quintal)
 */
import { marketCrops, matchesCrop } from '../data/markets';
import { samplePrices } from '../data/samplePrices';

export const AGMARKNET_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';
export const AGMARKNET_PAGE = 'https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi';
const BASE = `/proxy/datagov/resource/${AGMARKNET_RESOURCE}`;
const CACHE_PREFIX = 'ks-agm-v3-'; // v3: rows checked against the crop's commodity names
const FRESH_MS = 6 * 3600 * 1000;

/** Agmarknet commodity names for our crops. */
export const COMMODITY = Object.fromEntries(Object.entries(marketCrops).map(([id, c]) => [id, c.commodity]));

const pick = (rec, keys) => {
  for (const k of keys) if (rec[k] != null && rec[k] !== '') return rec[k];
  return null;
};
const num = (v) => {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Normalise one API record (field names differ between dataset versions). */
export function parseRecord(rec, i) {
  const modal = num(pick(rec, ['modal_price', 'Modal_x0020_Price', 'Modal_Price', 'modal price']));
  if (!modal) return null;
  const date = pick(rec, ['arrival_date', 'Arrival_Date', 'arrival date']) || '';
  return {
    id: `${pick(rec, ['market', 'Market']) || 'm'}-${i}`,
    market: pick(rec, ['market', 'Market']) || '—',
    district: pick(rec, ['district', 'District']) || '',
    state: pick(rec, ['state', 'State']) || '',
    variety: pick(rec, ['variety', 'Variety']) || '',
    commodity: pick(rec, ['commodity', 'Commodity']) || '',
    date, // dd/mm/yyyy as published
    min: num(pick(rec, ['min_price', 'Min_x0020_Price', 'Min_Price', 'min price'])) ?? modal,
    max: num(pick(rec, ['max_price', 'Max_x0020_Price', 'Max_Price', 'max price'])) ?? modal,
    modal,
  };
}

async function query(params, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const qs = new URLSearchParams({ format: 'json', limit: '200', ...params });
    const res = await fetch(`${BASE}?${qs.toString()}`, { signal: ctrl.signal });
    if (res.status === 429) throw new Error('rate_limited');
    if (!res.ok) throw new Error(`http_${res.status}`);
    const json = await res.json();
    if (json?.error) throw new Error(String(json.error));
    return (json.records || []).map(parseRecord).filter(Boolean);
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'timeout' : e.message || 'network');
  } finally {
    clearTimeout(timer);
  }
}

const readCache = (cropId) => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_PREFIX + cropId));
  } catch {
    return null;
  }
};

/** Last prices saved for a crop (or null) – used offline and by the chat assistant. */
export const cachedPrices = (cropId) => readCache(cropId);

/**
 * Fetch live prices for a crop. Tries Karnataka first, then all-India.
 * { preferCache } – Data Saver: use a fresh cache instead of the network.
 */
export async function fetchMandiPrices(cropId, { preferCache = false, timeoutMs = 15000 } = {}) {
  const commodity = COMMODITY[cropId];
  if (!commodity) return { source: 'none', rows: [], scope: null, fetchedAt: null, error: 'no_records' };
  const cached = readCache(cropId);
  if (preferCache && cached?.rows?.length && Date.now() - cached.at < FRESH_MS) {
    return { source: 'cache', rows: cached.rows, scope: cached.scope, fetchedAt: cached.at, error: null };
  }
  try {
    let scope = 'Karnataka';
    // The API's filters can match loosely (a "Tur" query also returns other grams and dals):
    // keep only rows that really are this crop.
    const exact = (list) => list.filter((r) => matchesCrop(cropId, r.commodity));
    // The dataset has used both filter styles; try the keyword form, then the plain one.
    let rows = exact(await query({ 'filters[commodity.keyword]': commodity, 'filters[state.keyword]': 'Karnataka' }, timeoutMs).catch(() => []));
    if (!rows.length) rows = exact(await query({ 'filters[commodity]': commodity, 'filters[state]': 'Karnataka' }, timeoutMs).catch(() => []));
    if (!rows.length) {
      scope = 'India';
      rows = exact(await query({ 'filters[commodity]': commodity }, timeoutMs));
    }
    if (!rows.length) throw new Error('no_records');
    rows.sort((a, b) => b.modal - a.modal);
    const at = Date.now();
    try {
      localStorage.setItem(CACHE_PREFIX + cropId, JSON.stringify({ rows, scope, at }));
    } catch {
      /* cache optional */
    }
    return { source: 'live', rows, scope, fetchedAt: at, error: null };
  } catch (e) {
    if (cached?.rows?.length) return { source: 'cache', rows: cached.rows, scope: cached.scope, fetchedAt: cached.at, error: e.message };
    const sample = samplePrices(cropId);
    if (sample) return { source: 'sample', rows: sample.rows, scope: sample.scope, fetchedAt: null, error: e.message };
    return { source: 'none', rows: [], scope: null, fetchedAt: null, error: e.message };
  }
}
