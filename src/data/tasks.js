import { addDays } from '../utils/date';

const L = (en, hi, kn) => ({ en, hi, kn });

export const taskCategories = ['sowing', 'irrigation', 'fertilizer', 'inspection', 'harvest', 'weather', 'other'];

export const categoryStyle = {
  sowing: { bg: 'bg-moss-100', text: 'text-moss-600', dot: 'bg-moss-400' },
  irrigation: { bg: 'bg-sky-100', text: 'text-sky-500', dot: 'bg-sky-500' },
  fertilizer: { bg: 'bg-earth-100', text: 'text-earth-600', dot: 'bg-earth-500' },
  inspection: { bg: 'bg-forest-50', text: 'text-forest-600', dot: 'bg-forest-500' },
  harvest: { bg: 'bg-clay-100', text: 'text-clay-600', dot: 'bg-clay-500' },
  weather: { bg: 'bg-sky-100', text: 'text-sky-500', dot: 'bg-sky-500' },
  other: { bg: 'bg-cream-200', text: 'text-forest-700', dot: 'bg-forest-400' },
};

/**
 * Manual farm to-dos (Calendar → Farm tasks). Crop work (sowing, fertilizer, weeding, irrigation,
 * harvest) is no longer seeded here – it comes from the crop calendar (data/cropSchedules.js).
 */
export const initialTasks = () => [
  { id: 't8', title: L('Apply for Raita Siri millet incentive', 'रैता सिरी मोटा अनाज प्रोत्साहन के लिए आवेदन', 'ರೈತ ಸಿರಿ ಸಿರಿಧಾನ್ಯ ಪ್ರೋತ್ಸಾಹಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ'), date: addDays(9), category: 'other', cropId: 'ragi', done: false },
];

/** Ids of the old placeholder crop tasks, removed once from saved data (see AppContext). */
export const LEGACY_DEMO_TASK_IDS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't9', 't10', 't11', 't12'];
