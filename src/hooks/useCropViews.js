import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { cropStatus } from '../data/farmer';
import { todayISO, daysBetween, addDaysTo } from '../utils/date';

/** Crops from context enriched with stage, progress and harvest info. */
export default function useCropViews() {
  const { crops } = useApp();
  return useMemo(() => {
    const today = todayISO();
    return crops.map((c) => ({ ...c, ...cropStatus(c, today, daysBetween, addDaysTo) }));
  }, [crops]);
}
