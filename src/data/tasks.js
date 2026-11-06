

export const taskCategories = ['sowing', 'irrigation', 'fertilizer', 'inspection', 'harvest', 'weather', 'other'];

export const categoryStyle = {
  sowing: { bg: 'bg-moss-100', text: 'text-moss-600', dot: 'bg-moss-400' },
  irrigation: { bg: 'bg-navy-100', text: 'text-navy-500', dot: 'bg-navy-500' },
  fertilizer: { bg: 'bg-earth-100', text: 'text-earth-600', dot: 'bg-earth-500' },
  inspection: { bg: 'bg-forest-50', text: 'text-forest-600', dot: 'bg-forest-500' },
  harvest: { bg: 'bg-clay-100', text: 'text-clay-600', dot: 'bg-clay-500' },
  weather: { bg: 'bg-navy-100', text: 'text-navy-500', dot: 'bg-navy-500' },
  other: { bg: 'bg-cream-200', text: 'text-forest-700', dot: 'bg-forest-400' },
};

/**
 * Manual farm to-dos (Calendar → Farm tasks) start empty: crop work comes from the crop calendar
 * (data/cropSchedules.js) and the farmer adds anything else themselves.
 */
export const initialTasks = () => [];

/** Ids of the old placeholder crop tasks, removed once from saved data (see AppContext). */
export const LEGACY_DEMO_TASK_IDS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'];
