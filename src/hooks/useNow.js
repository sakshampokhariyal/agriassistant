import { useEffect, useState } from 'react';

/**
 * Current time that re-renders the caller every `stepMs` (and as soon as the tab is shown again),
 * so clocks, greetings and "updated" labels never go stale on a page left open.
 */
export default function useNow(stepMs = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, stepMs);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [stepMs]);
  return now;
}
