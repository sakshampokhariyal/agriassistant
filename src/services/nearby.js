/**
 * Nearby agricultural services from OpenStreetMap (free, no API key):
 *  - Nominatim search (fast): named agro / fertilizer shops, KVKs, Raitha Samparka Kendras, APMC yards
 *  - Overpass (slow on public servers, loaded in the background): shops tagged shop=agrarian / garden_centre
 * OSM coverage of rural India is thin, so the page also offers Google Maps searches around the
 * same point. Results are cached per place + radius for a day.
 * Data © OpenStreetMap contributors (ODbL).
 */
import { distanceKm } from './location';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const CACHE_PREFIX = 'ks-nearby-v1-';
const GEO_CACHE = 'ks-geocode-v1';
const DAY = 24 * 3600 * 1000;
/** Nominatim usage policy: at most one request per second. */
const NOMINATIM_GAP_MS = 1100;
const QUERIES = ['agro', 'fertilizer', 'seeds', 'Krishi', 'Raitha Samparka', 'APMC'];
const SKIP_CLASSES = ['highway', 'place', 'boundary', 'natural', 'waterway', 'railway', 'route'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJSON = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch {
    return null;
  }
};
const writeJSON = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* optional */
  }
};

/* ───────────── Where to search from ───────────── */

/** Forward-geocode the profile's village/district/state (cached), for when device location is unavailable. */
export async function geocodeProfile(profile) {
  const q = [profile.village, profile.district, profile.state, 'India'].filter(Boolean).join(', ');
  const cache = readJSON(GEO_CACHE) || {};
  if (cache[q]) return cache[q];
  const qs = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'in' });
  const res = await fetch(`${NOMINATIM}/search?${qs}`);
  if (!res.ok) throw new Error(`geocode_http_${res.status}`);
  const [hit] = await res.json();
  if (!hit) throw new Error('geocode_empty');
  const point = { lat: Number(hit.lat), lon: Number(hit.lon) };
  writeJSON(GEO_CACHE, { ...cache, [q]: point });
  return point;
}

/* ───────────── Classification ───────────── */
const RX = {
  kvk: /krishi\s*vigyan|\bkvk\b/i,
  govt: /raith|raita|rythu|samparka|krishi\s*bhavan|agricultur(e|al)\s*(dept|department|office)|horticultur/i,
  market: /\bapmc\b|mandi|market\s*yard|krishi\s*upaj|regulated\s*market/i,
  store: /agro|agri|fertili[sz]er|seed|pesticide|krishi|kisan|raith|nursery|garden/i,
};

function classify(name, tags = {}) {
  if (RX.kvk.test(name)) return 'kvk';
  if (RX.govt.test(name) && !/agro|fertili|seed/i.test(name)) return 'govt';
  if (tags.amenity === 'marketplace' || RX.market.test(name)) return 'market';
  if (tags.shop === 'agrarian' || tags.shop === 'garden_centre' || RX.store.test(name)) return 'store';
  return null;
}

/* ───────────── Opening hours ("Mo-Sa 09:00-20:00; Su off") ───────────── */
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const dayIndex = (d) => DAYS.indexOf(d);

function daysMatch(spec, today) {
  return spec.split(',').some((part) => {
    const [a, b] = part.trim().split('-');
    const ia = dayIndex(a);
    if (ia < 0) return false;
    if (!b) return ia === today;
    const ib = dayIndex(b);
    if (ib < 0) return false;
    return ia <= ib ? today >= ia && today <= ib : today >= ia || today <= ib; // e.g. Sa-Mo wraps
  });
}

/**
 * Simple OSM opening_hours check for the common formats. Returns 'open' | 'closed' | 'unknown'.
 * Unusual syntax (public holidays, months, sunrise…) is reported as 'unknown' rather than guessed.
 */
export function openStatus(oh, now = new Date()) {
  if (!oh || typeof oh !== 'string') return 'unknown';
  const s = oh.trim();
  if (s === '24/7') return 'open';
  if (/PH|SH|sunrise|sunset|week|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\[|"/.test(s)) return 'unknown';
  const today = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  let decided = null;
  for (const rule of s.split(';').map((r) => r.trim()).filter(Boolean)) {
    const m = rule.match(/^((?:[A-Z][a-z](?:-[A-Z][a-z])?,?)+)?\s*(.*)$/);
    if (!m) return 'unknown';
    const [, days, times] = m;
    if (days && !daysMatch(days, today)) continue;
    if (/^(off|closed)$/i.test(times)) {
      decided = 'closed';
      continue;
    }
    const ranges = times.split(',').map((r) => r.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/));
    if (!ranges.length || ranges.some((r) => !r)) return 'unknown';
    // Later rules override earlier ones for the same day (OSM semantics).
    decided = ranges.some(([, h1, m1, h2, m2]) => {
      const a = +h1 * 60 + +m1;
      const b = +h2 * 60 + +m2;
      return b > a ? mins >= a && mins < b : mins >= a || mins < b; // past-midnight ranges
    })
      ? 'open'
      : 'closed';
  }
  return decided || 'closed';
}

/* ───────────── Normalisation ───────────── */
const firstPhone = (tags = {}) => {
  const raw = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.mobile || '';
  const p = raw.split(/[;,/]/)[0].trim();
  return p.replace(/[^\d+]/g, '').length >= 8 ? p : '';
};

function addressFromTags(t = {}) {
  const line = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  return [line, t['addr:suburb'], t['addr:village'] || t['addr:city'] || t['addr:town'], t['addr:postcode']].filter(Boolean).join(', ');
}

function addressFromNominatim(a = {}) {
  return [a.road, a.suburb || a.neighbourhood, a.village || a.town || a.city, a.postcode].filter(Boolean).join(', ');
}

function makeItem({ id, name, lat, lon, tags, address }, origin) {
  const category = classify(name, tags);
  if (!category) return null;
  return {
    id,
    name,
    category,
    lat,
    lon,
    address,
    phone: firstPhone(tags),
    hours: tags?.opening_hours || '',
    km: distanceKm(origin, { lat, lon }),
    osmUrl: `https://www.openstreetmap.org/${id}`,
  };
}

/* ───────────── Sources ───────────── */

/** Nominatim free-text searches inside a box around the origin (sequential, 1 req/s). */
export async function searchNominatim(origin, radiusKm, { signal, onItems } = {}) {
  const box = (km) => {
    const dLat = km / 111;
    const dLon = km / (111 * Math.cos((origin.lat * Math.PI) / 180));
    return [origin.lon - dLon, origin.lat + dLat, origin.lon + dLon, origin.lat - dLat].map((n) => n.toFixed(4)).join(',');
  };
  // Nominatim ranks by importance and drops close-by matches in big boxes, so wide searches
  // also cover each smaller step (10 / 25 km) – the nearest shops matter most. Nearest box first.
  const boxes = [10, 25].filter((r) => r < radiusKm).concat(radiusKm);
  const jobs = boxes.flatMap((km) => QUERIES.map((q) => [q, box(km)]));
  const all = [];
  for (const [i, [q, viewbox]] of jobs.entries()) {
    if (signal?.aborted) break;
    if (i) await sleep(NOMINATIM_GAP_MS);
    try {
      const qs = new URLSearchParams({ q, format: 'jsonv2', viewbox, bounded: '1', limit: '10', extratags: '1', addressdetails: '1', countrycodes: 'in' });
      const res = await fetch(`${NOMINATIM}/search?${qs}`, { signal });
      if (!res.ok) continue;
      const items = (await res.json())
        .filter((e) => !SKIP_CLASSES.includes(e.category))
        .map((e) =>
          makeItem(
            {
              id: `${e.osm_type}/${e.osm_id}`,
              name: (e.name || e.display_name.split(',')[0] || '').trim(),
              lat: Number(e.lat),
              lon: Number(e.lon),
              tags: { ...(e.extratags || {}), [e.category]: e.type },
              address: addressFromNominatim(e.address),
            },
            origin
          )
        )
        .filter((x) => x && x.km <= radiusKm * 1.05);
      all.push(...items);
      onItems?.(items);
    } catch (e) {
      if (e.name === 'AbortError') break;
    }
  }
  return all;
}

/** Overpass: shops tagged as agri-input / nursery. Slow on public servers – tries a mirror on failure. */
export async function searchOverpass(origin, radiusKm, { signal, timeoutMs = 25000 } = {}) {
  const r = Math.round(radiusKm * 1000);
  const q = `[out:json][timeout:30];nwr["shop"~"^(agrarian|garden_centre)$"](around:${r},${origin.lat},${origin.lon});out center tags 60;`;
  for (const url of OVERPASS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const onAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort);
    try {
      const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), signal: ctrl.signal });
      if (!res.ok) continue;
      const j = await res.json();
      return (j.elements || [])
        .map((e) => {
          const lat = e.lat ?? e.center?.lat;
          const lon = e.lon ?? e.center?.lon;
          const name = (e.tags?.name || '').trim();
          if (!name || lat == null) return null;
          return makeItem({ id: `${e.type}/${e.id}`, name, lat, lon, tags: e.tags, address: addressFromTags(e.tags) }, origin);
        })
        .filter(Boolean);
    } catch {
      if (signal?.aborted) return [];
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
  throw new Error('overpass_unavailable');
}

/** Merge lists, de-duplicate by OSM id and by name+proximity, nearest first. */
export function mergeResults(...lists) {
  const byId = new Map();
  lists.flat().forEach((x) => {
    if (!x || byId.has(x.id)) return;
    const dupe = [...byId.values()].find((y) => y.name.toLowerCase() === x.name.toLowerCase() && distanceKm(x, y) < 0.3);
    if (dupe) {
      // keep the richer record
      if (!dupe.phone && x.phone) dupe.phone = x.phone;
      if (!dupe.hours && x.hours) dupe.hours = x.hours;
      if (!dupe.address && x.address) dupe.address = x.address;
      return;
    }
    byId.set(x.id, { ...x });
  });
  return [...byId.values()].sort((a, b) => a.km - b.km);
}

export const cacheKey = (origin, radiusKm) => `${CACHE_PREFIX}${origin.lat.toFixed(2)},${origin.lon.toFixed(2)},${radiusKm}`;
export function readCachedResults(origin, radiusKm) {
  const c = readJSON(cacheKey(origin, radiusKm));
  return c && Date.now() - c.at < DAY ? c : null;
}
export function cacheResults(origin, radiusKm, items, overpassDone) {
  writeJSON(cacheKey(origin, radiusKm), { items, at: Date.now(), overpassDone });
}

/* ───────────── Links ───────────── */
export const directionsUrl = (x) => `https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lon}`;
/** Google Maps search centred on the farmer's point (real local results, phones, hours). */
export const mapsSearchUrl = (query, origin) => `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${origin.lat},${origin.lon},13z`;
export const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;
