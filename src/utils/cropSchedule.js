/**
 * Crop calendar engine: turns the relative schedules in data/cropSchedules.js into dated,
 * status-tracked tasks for a field ({ id, cropId, sowDate, variant? }).
 *
 * Day 0 = sowing date (nursery sowing for transplanted crops). DAP = DAS − T.
 * Status: 'done' | 'today' (today falls inside the task window) | 'overdue' | 'upcoming'.
 */
import { cropSchedules, scheduleParams } from '../data/cropSchedules';
import { addDaysTo, daysBetween, todayISO } from './date';

export const EXPENSE_CATEGORIES = ['seed', 'fertilizer', 'pesticide', 'labour', 'irrigation', 'machinery', 'other'];
const PRIORITY_RANK = { critical: 0, high: 1, normal: 2 };

/** Fill {var} placeholders in every language of a localized object. Var values may be strings or {en,hi,kn}. */
const fill = (obj, vars) =>
  Object.fromEntries(
    Object.entries(obj).map(([lang, s]) => [
      lang,
      Object.entries(vars).reduce((t, [v, x]) => t.split(`{${v}}`).join(typeof x === 'object' ? x[lang] ?? x.en : x), s),
    ])
  );

/** Day bounds (DAS) for a task template. */
function window(tpl, p) {
  const val = (x) => (x === 'T' ? p.T : x === 'tEnd' ? p.tEnd : x);
  if (tpl.dap != null) return [p.T + tpl.dap, p.T + (tpl.dapEnd ?? tpl.dap)];
  if (tpl.fromHarvest != null) return [p.D - tpl.fromHarvest, p.D - (tpl.fromHarvestEnd ?? tpl.fromHarvest)];
  const start = val(tpl.day);
  return [start, tpl.end != null ? val(tpl.end) : start];
}

/** Expand templates into concrete tasks (repeating tasks become one task per interval). */
function expand(field, p) {
  const s = cropSchedules[field.cropId];
  const vars = { spacing: p.spacing || '', variant: p.name || '' };
  const out = [];
  s.tasks.forEach((tpl) => {
    const [start, end] = window(tpl, p);
    const base = { key: tpl.key, type: tpl.type, priority: tpl.priority, title: tpl.title, detail: fill(tpl.detail, vars) };
    if (tpl.repeat) {
      let n = 1;
      // Each round is due for up to 3 days (or until the next round starts, if sooner).
      for (let d = start; d <= end; d += tpl.repeat, n++) out.push({ ...base, id: `${tpl.key}#${n}`, startDay: d, endDay: Math.min(d + Math.min(2, tpl.repeat - 1), end), round: n });
    } else {
      out.push({ ...base, id: tpl.key, startDay: start, endDay: end });
    }
  });
  return out;
}

/**
 * Full plan for a field.
 * doneMap: { [taskId]: true } for this field.
 */
export function buildSchedule(field, doneMap = {}, today = todayISO()) {
  const p = scheduleParams(field);
  if (!p || !field.sowDate) return null;
  const s = cropSchedules[field.cropId];
  const das = daysBetween(field.sowDate, today);
  const transplanted = s.establishment === 'transplant';
  const dap = transplanted && das >= p.T ? das - p.T : null;

  const phases = s.phases(p).map((ph) => ({ ...ph, startDate: addDaysTo(field.sowDate, ph.start), endDate: addDaysTo(field.sowDate, ph.end - 1) }));
  const currentPhase = das < 0 ? null : phases.find((ph) => das >= ph.start && das < ph.end) || phases[phases.length - 1];

  const tasks = expand(field, p)
    .map((x) => {
      const start = addDaysTo(field.sowDate, x.startDay);
      const end = addDaysTo(field.sowDate, x.endDay);
      const status = doneMap[x.id] ? 'done' : today >= start && today <= end ? 'today' : today > end ? 'overdue' : 'upcoming';
      return {
        ...x,
        fieldId: field.id,
        cropId: field.cropId,
        start,
        end,
        dapStart: transplanted && x.startDay >= p.T ? x.startDay - p.T : null,
        inDays: daysBetween(today, start),
        status,
        phaseKey: (phases.find((ph) => x.startDay >= ph.start && x.startDay < ph.end) || phases[phases.length - 1]).key,
      };
    })
    .sort((a, b) => a.startDay - b.startDay || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  const constraints = (s.constraints || [])
    .map((c) => ({ ...c, toDay: c.to === 'D' ? p.D : c.to }))
    .filter((c) => das >= c.from && das <= c.toDay);

  return {
    params: p,
    schedule: s,
    das,
    dap,
    transplanted,
    harvestDate: addDaysTo(field.sowDate, p.D),
    phases,
    currentPhase,
    tasks,
    constraints,
    today: tasks.filter((x) => x.status === 'today'),
    /** Everything whose window includes today, completed or not (for the Home checklist). */
    dueToday: tasks.filter((x) => today >= x.start && today <= x.end),
    next: tasks.find((x) => x.status === 'upcoming') || null,
  };
}

/** Tasks across all fields: today's (sorted by priority) and the nearest upcoming one. */
export function scheduleOverview(fields, doneAll = {}, today = todayISO()) {
  const plans = fields.map((f) => ({ field: f, plan: buildSchedule(f, doneAll[f.id], today) })).filter((x) => x.plan);
  const byPriority = (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  const withField = (field, plan) => (x) => ({ ...x, field, das: plan.das, dap: plan.dap });
  const todayTasks = plans.flatMap(({ field, plan }) => plan.today.map(withField(field, plan))).sort(byPriority);
  const todayAll = plans.flatMap(({ field, plan }) => plan.dueToday.map(withField(field, plan))).sort(byPriority);
  const next = plans
    .map(({ field, plan }) => plan.next && { ...plan.next, field, das: plan.das })
    .filter(Boolean)
    .sort((a, b) => a.inDays - b.inDays || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])[0] || null;
  const constraints = plans.flatMap(({ field, plan }) => plan.constraints.map((c) => ({ ...c, field })));
  return { plans, todayTasks, todayAll, next, constraints, hasSchedules: plans.length > 0 };
}

/** Ids of tasks whose window ended more than `graceDays` ago (used to pre-complete history). */
export function pastTaskIds(field, today = todayISO(), graceDays = 3) {
  const plan = buildSchedule(field, {}, today);
  if (!plan) return [];
  return plan.tasks.filter((x) => daysBetween(x.end, today) > graceDays).map((x) => x.id);
}
