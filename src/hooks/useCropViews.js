import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { cropStatus } from '../data/farmer';
import { daysBetween, addDaysTo } from '../utils/date';

/** Crops from context enriched with stage, progress and harvest info. */
export default function useCropViews() {
  const { crops, today } = useApp();
  return useMemo(() => crops.map((c) => ({ ...c, ...cropStatus(c, today, daysBetween, addDaysTo) })), [crops, today]);
}
