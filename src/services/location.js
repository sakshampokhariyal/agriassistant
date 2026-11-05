/**
 * Device location → place name.
 * Position: browser Geolocation API. Place: BigDataCloud's free client-side reverse-geocoding
 * endpoint (no key, CORS-enabled). The detected place is saved in localStorage so it survives
 * reloads and is reused while the farmer stays in roughly the same spot.
 *
 * Place: { lat, lon, city, district, state, country, label, at }
 */
import { getPosition } from './weather';

const CACHE_KEY = 'ks-location-v1';
const REUSE_KM = 2; // don't reverse-geocode again unless the device moved more than this
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export function readSavedPlace() {
  try {
    const p = JSON.parse(localStorage.getItem(CACHE_KEY));
    return p && typeof p.lat === 'number' && p.label ? p : null;
  } catch {
    return null;
  }
}

function savePlace(p) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(p));
  } catch {
    /* storage optional */
  }
}

/** Great-circle distance in km. */
export function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Saved place label for coordinates within `km` of the saved spot (used by weather labels). */
export function savedPlaceNear(coords, km = 10) {
  const p = readSavedPlace();
  return p && coords && distanceKm(p, coords) <= km ? p : null;
}

/** "Bengaluru, Karnataka" style label from BigDataCloud's response. */
export async function reverseGeocode(lat, lon, { timeoutMs = 10000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const qs = new URLSearchParams({ latitude: String(lat), longitude: String(lon), localityLanguage: 'en' });
    const res = await fetch(`${REVERSE_URL}?${qs}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`geocode_http_${res.status}`);
    const j = await res.json();
    const admin = j?.localityInfo?.administrative || [];
    // India: adminLevel 5 is usually the district (e.g. "Bangalore Urban", "Mandya").
    const district = (admin.find((a) => a.adminLevel === 5) || {}).name || '';
    const city = (j.city || j.locality || '').trim();
    const state = (j.principalSubdivision || '').trim();
    if (!city && !state) throw new Error('geocode_empty');
    const parts = [city, state].filter(Boolean);
    return {
      lat,
      lon,
      city,
      locality: (j.locality || '').trim(),
      district: district.replace(/ district$/i, ''),
      state,
      country: (j.countryName || '').trim(),
      label: [...new Set(parts)].join(', '),
      at: Date.now(),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the browser for the position and name the place.
 * Resolves { status: 'ready', place } or { status: 'denied' | 'unavailable' | 'error', place: saved|null }.
 */
export async function detectPlace({ force = false } = {}) {
  const saved = readSavedPlace();
  let coords;
  try {
    coords = await getPosition(10000);
  } catch (e) {
    return { status: e?.code === 'denied' ? 'denied' : 'unavailable', place: saved };
  }
  if (!force && saved && distanceKm(saved, coords) <= REUSE_KM) return { status: 'ready', place: saved };
  try {
    const place = await reverseGeocode(coords.lat, coords.lon);
    savePlace(place);
    return { status: 'ready', place };
  } catch {
    return { status: 'error', place: saved };
  }
}
