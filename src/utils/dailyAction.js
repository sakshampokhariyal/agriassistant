/**
 * "Today's action" agent – a transparent, rule-based prioritiser.
 * Inputs: live weather (+ irrigation decision), field stages and due tasks.
 * Output: actions sorted by priority, each with i18n keys + vars and the reasons used.
 */
import { todayISO } from './date';

const DISEASE_PRONE = ['ragi', 'tomato', 'paddy', 'groundnut'];

export function buildDailyActions({ weather, fields, tasks, fieldName }) {
  const out = [];
  const today = todayISO();
  const d0 = weather?.data?.daily?.[0];
  const cur = weather?.data?.current;
  const status = weather?.decision?.status;
  const rainy = status === 'doNot';

  if (rainy && d0) {
    out.push({ id: 'rain-protect', icon: 'rain', priority: 100, key: 'rainProtect', vars: { prob: d0.prob ?? '–', mm: d0.mm != null ? d0.mm.toFixed(1) : '–' }, reasons: ['weather'] });
  }
  if (!rainy && d0?.hi != null && d0.hi >= 32) {
    out.push({ id: 'spray-evening', icon: 'sun', priority: 90, key: 'sprayEvening', vars: { temp: Math.round(d0.hi) }, reasons: ['weather'] });
  }
  if (cur?.humidity != null && cur.humidity > 80) {
    const f = fields.find((x) => DISEASE_PRONE.includes(x.cropId));
    if (f) out.push({ id: `scout-${f.id}`, icon: 'leaf', priority: 85, key: 'scoutDisease', vars: { field: fieldName(f), hum: Math.round(cur.humidity) }, reasons: ['weather', 'stage'] });
  }
  tasks
    .filter((x) => !x.done && x.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2)
    .forEach((x) => out.push({ id: `task-${x.id}`, icon: 'task', priority: x.date < today ? 80 : 70, key: 'finishTask', vars: { task: x.title }, reasons: ['calendar'], taskId: x.id }));
  fields.forEach((f) => {
    if (!rainy && f.age >= 28 && f.age <= 38) out.push({ id: `topdress-${f.id}`, icon: 'fert', priority: 75, key: 'topDress', vars: { field: fieldName(f), age: f.age }, reasons: ['stage'] });
    if (f.daysToHarvest <= 7) out.push({ id: `harvest-${f.id}`, icon: 'harvest', priority: 72, key: 'prepareHarvest', vars: { field: fieldName(f), days: f.daysToHarvest }, reasons: ['stage'] });
  });
  if (status === 'safe' || status === 'scheduled') {
    out.push({ id: 'irrigate', icon: 'water', priority: status === 'scheduled' ? 60 : 40, key: status === 'scheduled' ? 'irrigateCool' : 'irrigateNormal', vars: {}, reasons: ['weather'] });
  }
  out.push({ id: 'walk-fields', icon: 'leaf', priority: 10, key: 'walkFields', vars: {}, reasons: ['routine'] });
  return out.sort((a, b) => b.priority - a.priority);
}
