/**
 * Live weather from Open-Meteo (free, no API key).
 * Base endpoint (as specified) plus a few extra fields needed for the
 * 7-day list and chart: daily max/min temperature, daily weather code and
 * current wind speed.
 */
export const DEFAULT_COORDS = { lat: 12.9716, lon: 77.5946 }; // Bengaluru

export function buildForecastUrl(lat, lon) {
  const p = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    daily: 'precipitation_sum,precipitation_probability_max,weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '8', // one spare: the first day can still be "yesterday" around midnight; the app trims past days
  });
  return `https://api.open-meteo.com/v1/forecast?${p.toString()}`;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Fetch and normalise the forecast. Throws on network/HTTP/shape errors. */
export async function fetchForecast(lat, lon, { timeoutMs = 12000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(buildForecastUrl(lat, lon), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const json = await res.json();
    if (!json?.current || !json?.daily?.time) throw new Error('Unexpected Open-Meteo response');
    const d = json.daily;
    return {
      current: {
        temp: num(json.current.temperature_2m),
        humidity: num(json.current.relative_humidity_2m),
        code: num(json.current.weather_code),
        wind: num(json.current.wind_speed_10m),
        time: json.current.time,
      },
      daily: d.time.map((date, i) => ({
        date,
        code: num(d.weather_code?.[i]),
        hi: num(d.temperature_2m_max?.[i]),
        lo: num(d.temperature_2m_min?.[i]),
        mm: num(d.precipitation_sum?.[i]),
        prob: num(d.precipitation_probability_max?.[i]),
      })),
      timezone: json.timezone,
    };
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Browser geolocation as a promise. Rejects with {code: 'denied'|'unavailable'}. */
export function getPosition(timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject({ code: 'unavailable' });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject({ code: err.code === 1 ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: false, timeout, maximumAge: 10 * 60 * 1000 }
    );
  });
}

/** WMO weather code → app condition key (used by WeatherIcon and `cond.*` translations). */
export function conditionFromCode(code) {
  if (code == null) return 'cloudy';
  if (code === 0) return 'sunny';
  if (code <= 2) return 'partly';
  if (code === 3 || code === 45 || code === 48) return 'cloudy';
  if (code >= 95) return 'thunder';
  if ([65, 67, 82].includes(code)) return 'heavyRain';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  return 'cloudy'; // snow & others – rare in this region
}
