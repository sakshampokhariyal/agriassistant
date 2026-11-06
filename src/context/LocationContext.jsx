import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './AppContext';
import { detectPlace, readSavedPlace } from '../services/location';

const LocationContext = createContext(null);

/**
 * Detected device location, shared app-wide.
 * On load it asks the browser for the position, reverse-geocodes it (BigDataCloud) and copies
 * town / district / state into the farmer profile – unless the farmer typed their location in
 * Profile (`locationSource: 'manual'`). If access is denied the profile keeps its last value
 * (a new farmer starts with no location until it is detected or entered).
 */
export function LocationProvider({ children }) {
  const { profile, setProfile } = useApp();
  const [state, setState] = useState(() => ({ status: 'detecting', place: readSavedPlace() }));
  const manualRef = useRef(profile.locationSource === 'manual');
  manualRef.current = profile.locationSource === 'manual';

  const applyToProfile = useCallback(
    (place, { overrideManual = false } = {}) => {
      if (!place || (manualRef.current && !overrideManual)) return;
      setProfile((p) => ({
        ...p,
        village: place.city || place.locality || p.village,
        district: place.district || p.district,
        state: place.state || p.state,
        locationSource: 'gps',
      }));
    },
    [setProfile]
  );

  /** force: re-geocode even if the device hasn't moved; overrideManual: "Use my current location". */
  const refresh = useCallback(
    async ({ force = false, overrideManual = false } = {}) => {
      setState((s) => ({ ...s, status: 'detecting' }));
      const res = await detectPlace({ force });
      setState(res);
      if (res.status === 'ready') applyToProfile(res.place, { overrideManual });
      return res;
    },
    [applyToProfile]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export const useFarmLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useFarmLocation must be used inside LocationProvider');
  return ctx;
};

/** Short place text for headers: detected "City, State", else the profile's "Village, District". */
export function placeText(profile, location) {
  if (profile.locationSource === 'gps') {
    if (location?.place?.label) return location.place.label;
    return [...new Set([profile.village, profile.state].filter(Boolean))].join(', ');
  }
  return [...new Set([profile.village, profile.district].filter(Boolean))].join(', ');
}
