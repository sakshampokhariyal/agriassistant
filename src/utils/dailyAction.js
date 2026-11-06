/**
 * "Today's action" agent – a transparent, rule-based prioritiser.
 * Inputs: live weather (+ irrigation decision), the crop calendar's tasks due today,
 * and the farmer's own Farm tasks.
 * Output: actions sorted by priority, each with i18n keys + vars and the reasons used.
 */
import { todayISO } from './date';

const DISEASE_PRONE = ['ragi', 'tomato', 'paddy', 'groundnut'];
const CAL_PRIORITY = { critical: 95, high: 78, normal: 62 };
const CAL_ICON = {
  fertilizer: 'fert', irrigation: 'water', harvest: 'harvest', weeding: 'leaf', protection: 'leaf',
  caution: 'alert', nursery: 'sprout', sowing: 'sprout', transplanting: 'sprout', other: 'task',
};
/** Work that rain spoils: fertilizer and sprays wash off. */
const RAIN_SENSITIVE = ['fertilizer', 'protection'];

/**
 * calendarTasks: crop-calendar tasks due today (not done), from scheduleOverview().todayTasks.
 * calendarText(task) → { label, title, detail } already localized.
 */
export function buildDailyActions({ weather, fields, tasks, fieldName, calendarTasks = [], calendarText }) {
  const out = [];
  const today = todayISO();
  const d0 = weather?.data?.daily?.[0];
  const cur = weather?.data?.current;
  const status = weather?.decision?.status;
  const rainy = status === 'doNot';
  // Field advice needs a field: with none added, only the farmer's own to-dos are listed.
  const hasFields = fields.length > 0;

  if (hasFields && rainy && d0) {
    out.push({ id: 'rain-protect', icon: 'rain', priority: 100, key: 'rainProtect', vars: { prob: d0.prob ?? '–', mm: d0.mm != null ? d0.mm.toFixed(1) : '–' }, reasons: ['weather'] });
  }
  if (hasFields && !rainy && d0?.hi != null && d0.hi >= 32) {
    out.push({ id: 'spray-evening', icon: 'sun', priority: 90, key: 'sprayEvening', vars: { temp: Math.round(d0.hi) }, reasons: ['weather'] });
  }
  if (cur?.humidity != null && cur.humidity > 80) {
    const f = fields.find((x) => DISEASE_PRONE.includes(x.cropId));
    if (f) out.push({ id: `scout-${f.id}`, icon: 'leaf', priority: 85, key: 'scoutDisease', vars: { field: fieldName(f), hum: Math.round(cur.humidity) }, reasons: ['weather', 'stage'] });
  }

  // Crop calendar: every task scheduled for today, ranked by its agronomic priority.
  calendarTasks.forEach((x) => {
    const txt = calendarText(x);
    const rainDelay = rainy && RAIN_SENSITIVE.includes(x.type);
    out.push({
      id: `sch-${x.fieldId}-${x.id}`,
      icon: CAL_ICON[x.type] || 'task',
      // Rain-sensitive work drops below "protect from rain" and carries a wait-for-dry-weather note.
      priority: rainDelay ? 58 : CAL_PRIORITY[x.priority] ?? 62,
      key: rainDelay ? 'calendarTaskRain' : 'calendarTask',
      vars: txt,
      reasons: rainDelay ? ['calendar', 'weather'] : ['calendar', 'stage'],
      schedule: { fieldId: x.fieldId, taskId: x.id },
    });
  });

  // The farmer's own to-dos (Calendar → Farm tasks).
  tasks
    .filter((x) => !x.done && x.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2)
    .forEach((x) => out.push({ id: `task-${x.id}`, icon: 'task', priority: x.date < today ? 80 : 70, key: 'finishTask', vars: { task: x.title }, reasons: ['calendar'], taskId: x.id }));

  if (hasFields && (status === 'safe' || status === 'scheduled')) {
    out.push({ id: 'irrigate', icon: 'water', priority: status === 'scheduled' ? 60 : 40, key: status === 'scheduled' ? 'irrigateCool' : 'irrigateNormal', vars: {}, reasons: ['weather'] });
  }
  if (hasFields) out.push({ id: 'walk-fields', icon: 'leaf', priority: 10, key: 'walkFields', vars: {}, reasons: ['routine'] });
  return out.sort((a, b) => b.priority - a.priority);
}
