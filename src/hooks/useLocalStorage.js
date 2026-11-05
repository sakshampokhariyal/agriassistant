import { useEffect, useRef, useState } from 'react';

/**
 * useState that persists to localStorage (safe against blocked storage).
 * Optional `onError` is called when a write fails (e.g. quota exceeded), so
 * callers holding large data (photos) can warn the user instead of losing it silently.
 */
export default function useLocalStorage(key, initial, { onError } = {}) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return typeof initial === 'function' ? initial() : initial;
  });
  const errRef = useRef(onError);
  errRef.current = onError;

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      errRef.current?.(e);
    }
  }, [key, value]);

  return [value, setValue];
}
