import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_COORDS, fetchForecast, getPosition } from '../services/weather';
import { useApp } from './AppContext';
import { toISO } from '../utils/date';
import { decideIrrigation, deriveAlerts, inputFromWeather } from '../utils/irrigation';

const WeatherContext = createContext(null);

/**
 * Single shared live-weather source for the whole app (Weather tab, Dashboard, Assistant).
 * status: 'loading' | 'refreshing' | 'ready' | 'error'
 */
const CACHE_KEY = 'ks-weather-cache-v1';
const CACHE_FRESH_MS = 3 * 3600 * 1000;
/** Background refresh while the app is open (longer with Data Saver on). */
const REFRESH_MS = 30 * 60 * 1000;
const STALE_ON_FOCUS_MS = 15 * 60 * 1000;
const dayOf = (ms) => (ms ? toISO(new Date(ms)) : null);
const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
};

export function WeatherProvider({ children }) {
  const { dataSaver, today } = useApp();
  // Offline-first: start from the last cached forecast (if any) so the app works without network.
  const [state, setState] = useState(() => {
    const c = readCache();
    return c?.data
      ? { status: 'ready', data: c.data, error: null, coords: c.coords, source: c.source, locIssue: null, updatedAt: c.at, fromCache: true }
      : { status: 'loading', data: null, error: null, coords: null, source: null, locIssue: null, updatedAt: null, fromCache: false };
  });
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState((s) => ({ ...s, status: s.data ? 'refreshing' : 'loading', error: null }));

    let coords = DEFAULT_COORDS;
    let source = 'default';
    let locIssue = null;
    try {
      coords = await getPosition();
      source = 'gps';
    } catch (e) {
      locIssue = e?.code === 'denied' ? 'denied' : 'unavailable';
    }

    try {
      const data = await fetchForecast(coords.lat, coords.lon);
      const at = Date.now();
      setState({ status: 'ready', data, error: null, coords, source, locIssue, updatedAt: at, fromCache: false });
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, coords, source, at }));
      } catch {
        /* storage full – cache is optional */
      }
    } catch (e) {
      // Keep any previous data visible; surface the error.
      setState((s) => ({ ...s, status: 'error', error: e?.message || 'Network error', coords, source, locIssue }));
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // Data Saver: reuse a cached forecast from today that is still fresh instead of downloading again.
    const c = readCache();
    if (dataSaver && c?.at && dayOf(c.at) === toISO(new Date()) && Date.now() - c.at < CACHE_FRESH_MS) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  // Keep the forecast live: refresh on a timer, when the tab comes back after a while, and as soon
  // as the date changes (a forecast fetched yesterday describes the wrong days).
  const updatedRef = useRef(state.updatedAt);
  updatedRef.current = state.updatedAt;
  useEffect(() => {
    const every = dataSaver ? CACHE_FRESH_MS : REFRESH_MS;
    const id = setInterval(() => !document.hidden && load(), every);
    const onShow = () => {
      const at = updatedRef.current;
      if (document.hidden) return;
      if (!at || dayOf(at) !== toISO(new Date()) || Date.now() - at > (dataSaver ? CACHE_FRESH_MS : STALE_ON_FOCUS_MS)) load();
    };
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener('focus', onShow);
    window.addEventListener('online', load);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onShow);
      window.removeEventListener('focus', onShow);
      window.removeEventListener('online', load);
    };
  }, [load, dataSaver]);

  const firstDay = useRef(today);
  useEffect(() => {
    if (today !== firstDay.current) {
      firstDay.current = today;
      load();
    }
  }, [today, load]);

  const value = useMemo(() => {
    // Never show days that are already over: daily[0] is always today, so "today's" advice,
    // alerts and the 7-day list follow the calendar even before the next refresh arrives.
    const data = state.data ? { ...state.data, daily: state.data.daily.filter((d) => d.date >= today).slice(0, 7) } : null;
    const usable = data && data.daily.length ? data : null;
    const decision = usable ? decideIrrigation(inputFromWeather(usable)) : null;
    const alerts = usable ? deriveAlerts(usable.daily) : [];
    return { ...state, data: usable, decision, alerts, refresh: load };
  }, [state, load, today]);

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export const useWeather = () => {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used inside WeatherProvider');
  return ctx;
};
