/**
 * Auto-generated crop plan for a field: stage timeline + scheduled tasks.
 * Stage boundaries are fractions of the crop duration, so every crop in the
 * catalog gets a sensible timeline. Task offsets are days from sowing.
 */
import { cropCatalog } from '../data/farmer';
import { addDaysTo, daysBetween, todayISO } from './date';

export const PLAN_STAGES = ['landPrep', 'sowing', 'vegetative', 'flowering', 'harvest'];

/** [startDay, endDay) relative to sowing, as fractions of duration (land prep is before sowing). */
const STAGE_SPAN = (d) => ({
  landPrep: [-15, 0],
  sowing: [0, Math.round(d * 0.1)],
  vegetative: [Math.round(d * 0.1), Math.round(d * 0.5)],
  flowering: [Math.round(d * 0.5), Math.round(d * 0.85)],
  harvest: [Math.round(d * 0.85), d + 7],
});

export function stageTimeline(field, today = todayISO()) {
  const cat = cropCatalog[field.cropId];
  if (!cat) return { stages: [], current: null, age: 0, duration: 0 };
  const span = STAGE_SPAN(cat.duration);
  const age = daysBetween(field.sowDate, today);
  const stages = PLAN_STAGES.map((key) => {
    const [s, e] = span[key];
    return { key, startDay: s, endDay: e, start: addDaysTo(field.sowDate, s), end: addDaysTo(field.sowDate, e - 1) };
  });
  const current = stages.find((s) => age >= s.startDay && age < s.endDay)?.key || (age < -15 ? 'landPrep' : 'harvest');
  return { stages, current, age, duration: cat.duration, totalStart: -15, totalEnd: cat.duration + 7 };
}

/** Task templates – key, category, day offset (from sowing) and whether it applies to the crop. */
function templates(cropId, d) {
  const list = [
    { key: 'plough', cat: 'sowing', day: -10 },
    { key: 'basal', cat: 'fertilizer', day: 0 },
    { key: 'weed1', cat: 'inspection', day: 20 },
    { key: 'topdress', cat: 'fertilizer', day: Math.round(d * 0.3) },
    { key: 'weed2', cat: 'inspection', day: 40 },
    { key: 'irrigFlower', cat: 'irrigation', day: Math.round(d * 0.5) },
    { key: 'harvest', cat: 'harvest', day: d },
  ];
  // Pest & disease scouting every 10 days from day 15 until 85% of the cycle.
  for (let day = 15, i = 1; day < d * 0.85; day += 10, i++) list.push({ key: `scout${i}`, cat: 'inspection', day, scout: true });
  if (cropId === 'tomato') list.push({ key: 'staking', cat: 'other', day: 25 });
  if (cropId === 'maize') list.push({ key: 'earthUp', cat: 'other', day: 35 });
  return list.sort((a, b) => a.day - b.day);
}

/**
 * Scheduled tasks with status: 'done' | 'overdue' | 'due' (today–next 2 days) | 'upcoming'.
 * doneMap: { [taskKey]: true } for this field.
 */
export function planTasks(field, doneMap = {}, today = todayISO()) {
  const cat = cropCatalog[field.cropId];
  if (!cat) return [];
  return templates(field.cropId, cat.duration).map((tpl) => {
    const date = addDaysTo(field.sowDate, tpl.day);
    const diff = daysBetween(today, date);
    const status = doneMap[tpl.key] ? 'done' : diff < 0 ? 'overdue' : diff <= 2 ? 'due' : 'upcoming';
    return { ...tpl, date, diff, status };
  });
}

export const EXPENSE_CATEGORIES = ['seed', 'fertilizer', 'pesticide', 'labour', 'irrigation', 'machinery', 'other'];
