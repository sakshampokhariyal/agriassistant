/**
 * Seasonal market cycles for the Hold vs Sell advisor.
 *
 * Mandi prices in India follow the arrival calendar: they are usually lowest while the new
 * harvest floods the markets ("arrivals") and highest in the lean months before the next one.
 * Months below are the main arrival and lean periods for South-Indian / national markets, from
 * Agmarknet arrival patterns and state marketing-board crop calendars. They describe a typical
 * year – weather, imports and procurement can shift them – so the advisor states them as
 * tendencies, never as price forecasts.
 *
 *   arrivals  months when new-crop arrivals peak (prices usually at their seasonal low)
 *   lean      months when stocks are thin (prices usually at their seasonal high)
 *   storage   'good' (dry grain, pulses, oilseeds, spices), 'none' (perishable) or 'mill' (sold to a mill at a fixed price)
 *   moisture  safe moisture % for storage (grain / pods / berries)
 */
export const MARKET_SEASONS = {
  paddy: { arrivals: [10, 11, 12], lean: [6, 7, 8, 9], storage: 'good', moisture: 14, kind: 'grain' },
  ragi: { arrivals: [12, 1, 2], lean: [7, 8, 9, 10], storage: 'good', moisture: 12, kind: 'grain' },
  maize: { arrivals: [10, 11, 12], lean: [6, 7, 8], storage: 'good', moisture: 12, kind: 'grain' },
  wheat: { arrivals: [3, 4, 5], lean: [10, 11, 12, 1], storage: 'good', moisture: 12, kind: 'grain' },
  jowar: { arrivals: [10, 11, 12], lean: [6, 7, 8], storage: 'good', moisture: 12, kind: 'grain' },
  bajra: { arrivals: [9, 10, 11], lean: [5, 6, 7], storage: 'good', moisture: 12, kind: 'grain' },
  redgram: { arrivals: [12, 1, 2, 3], lean: [8, 9, 10, 11], storage: 'good', moisture: 10, kind: 'pulse' },
  greengram: { arrivals: [8, 9, 10], lean: [1, 2, 3, 4], storage: 'good', moisture: 10, kind: 'pulse' },
  blackgram: { arrivals: [9, 10, 11], lean: [4, 5, 6, 7], storage: 'good', moisture: 10, kind: 'pulse' },
  cowpea: { arrivals: [9, 10, 11], lean: [4, 5, 6, 7], storage: 'good', moisture: 10, kind: 'pulse' },
  groundnut: { arrivals: [10, 11, 12], lean: [6, 7, 8], storage: 'good', moisture: 8, kind: 'oilseed' },
  soybean: { arrivals: [10, 11, 12], lean: [6, 7, 8, 9], storage: 'good', moisture: 10, kind: 'oilseed' },
  mustard: { arrivals: [3, 4, 5], lean: [10, 11, 12, 1], storage: 'good', moisture: 8, kind: 'oilseed' },
  cotton: { arrivals: [11, 12, 1, 2], lean: [6, 7, 8, 9], storage: 'good', moisture: 8, kind: 'fibre' },
  jute: { arrivals: [7, 8, 9], lean: [2, 3, 4, 5], storage: 'good', moisture: 14, kind: 'fibre' },
  pepper: { arrivals: [1, 2, 3, 4], lean: [8, 9, 10, 11], storage: 'good', moisture: 11, kind: 'spice' },
  coconut: { arrivals: [3, 4, 5, 6], lean: [10, 11, 12, 1], storage: 'good', moisture: 6, kind: 'copra' },
  rubber: { arrivals: [10, 11, 12, 1], lean: [2, 3, 4], storage: 'good', moisture: null, kind: 'sheet' },
  tomato: { arrivals: [], lean: [], storage: 'none', kind: 'perishable' },
  sugarcane: { arrivals: [], lean: [], storage: 'mill', kind: 'mill' },
};

const monthsBefore = (start, n) => Array.from({ length: n }, (_, i) => ((start - 2 - i + 12) % 12) + 1);

/**
 * Where a crop's market is in its yearly cycle for a given month (1–12):
 *   'arrivals'    harvest arriving – prices near their seasonal low
 *   'recovery'    arrivals over – prices usually climb towards the lean season
 *   'lean'        stocks thin – prices near their seasonal high
 *   'preArrival'  the next harvest is 1–2 months away – prices usually start to ease
 */
export function seasonPhase(cropId, month) {
  const s = MARKET_SEASONS[cropId];
  if (!s || !s.arrivals.length) return null;
  if (s.arrivals.includes(month)) return 'arrivals';
  if (s.lean.includes(month)) return 'lean';
  if (monthsBefore(s.arrivals[0], 2).includes(month)) return 'preArrival';
  return 'recovery';
}

/** Expected direction of prices over the next 4–6 weeks for each phase. */
export const PHASE_TREND = { arrivals: 'down', recovery: 'up', lean: 'peak', preArrival: 'down' };

/* ───────────── Observed prices: one median per crop per day, from live Agmarknet loads ───────────── */
const HIST_KEY = 'ks-mkt-hist-v1';
const readHist = () => {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY)) || {};
  } catch {
    return {};
  }
};

/** Record today's median modal price for a crop (keeps ~4 months). */
export function recordPrice(cropId, dateISO, median) {
  if (!median) return;
  const h = readHist();
  const list = (h[cropId] || []).filter((p) => p.d !== dateISO);
  list.push({ d: dateISO, p: median });
  list.sort((a, b) => (a.d < b.d ? -1 : 1));
  h[cropId] = list.slice(-120);
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(h));
  } catch {
    /* history is optional */
  }
}

/** Observed change between the latest saved median and one at least 7 days older (or null). */
export function observedTrend(cropId) {
  const list = readHist()[cropId] || [];
  if (list.length < 2) return null;
  const last = list[list.length - 1];
  const lastT = new Date(last.d).getTime();
  const older = [...list].reverse().find((p) => lastT - new Date(p.d).getTime() >= 7 * 86400000);
  if (!older) return null;
  const pct = ((last.p - older.p) / older.p) * 100;
  return { pct, from: older.d, to: last.d, days: Math.round((lastT - new Date(older.d).getTime()) / 86400000) };
}
