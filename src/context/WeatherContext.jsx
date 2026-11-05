import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_COORDS, fetchForecast, getPosition } from '../services/weather';
import { useApp } from './AppContext';
import { decideIrrigation, deriveAlerts, inputFromWeather } from '../utils/irrigation';

const WeatherContext = createContext(null);

/**
 * Single shared live-weather source for the whole app (Weather tab, Dashboard, Assistant).
 * status: 'loading' | 'refreshing' | 'ready' | 'error'
 */
const CACHE_KEY = 'ks-weather-cache-v1';
const CACHE_FRESH_MS = 3 * 3600 * 1000;
const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
};

export function WeatherProvider({ children }) {
  const { dataSaver } = useApp();
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
    // Data Saver: reuse a fresh cached forecast instead of downloading again.
    const c = readCache();
    if (dataSaver && c?.at && Date.now() - c.at < CACHE_FRESH_MS) return;
    load();
    // Only on first mount – later refreshes are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const value = useMemo(() => {
    const decision = state.data ? decideIrrigation(inputFromWeather(state.data)) : null;
    const alerts = state.data ? deriveAlerts(state.data.daily) : [];
    return { ...state, decision, alerts, refresh: load };
  }, [state, load]);

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export const useWeather = () => {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used inside WeatherProvider');
  return ctx;
};
