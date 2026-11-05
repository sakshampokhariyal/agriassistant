/**
 * Irrigation decision engine.
 * Evaluates the 24 h forecast with a strict rule hierarchy (first match wins):
 *  1. DO NOT IRRIGATE   (red)   – rain probability ≥ 60 % OR expected rain ≥ 4.0 mm
 *  2. POSTPONE WATERING (amber) – humidity > 85 % AND temperature < 22 °C
 *  3. SCHEDULED ONLY    (blue)  – temperature > 32 °C AND humidity < 40 %
 *  4. SAFE TO IRRIGATE  (green) – none of the above
 */
export const THRESHOLDS = {
  rainProb: 60,
  rainMm: 4.0,
  postponeHumidity: 85,
  postponeTemp: 22,
  heatTemp: 32,
  dryHumidity: 40,
};

export const STATUS_TONE = {
  doNot: 'red',
  postpone: 'amber',
  scheduled: 'blue',
  safe: 'green',
  unknown: 'gray',
};

/**
 * @param {{temp:number|null, humidity:number|null, prob:number|null, mm:number|null}} input
 * @returns {{status:string, tone:string, checks:Record<string,boolean>}}
 */
export function decideIrrigation({ temp, humidity, prob, mm }) {
  const has = (v) => typeof v === 'number' && Number.isFinite(v);
  const rain = (has(prob) && prob >= THRESHOLDS.rainProb) || (has(mm) && mm >= THRESHOLDS.rainMm);
  const postpone = has(humidity) && has(temp) && humidity > THRESHOLDS.postponeHumidity && temp < THRESHOLDS.postponeTemp;
  const scheduled = has(humidity) && has(temp) && temp > THRESHOLDS.heatTemp && humidity < THRESHOLDS.dryHumidity;
  const checks = { doNot: rain, postpone, scheduled };

  let status;
  if (rain) status = 'doNot';
  // Without rain data AND without temp/humidity we can't advise at all.
  else if (!has(temp) || !has(humidity)) status = has(prob) || has(mm) ? 'safe' : 'unknown';
  else if (postpone) status = 'postpone';
  else if (scheduled) status = 'scheduled';
  else status = 'safe';

  // Rain data entirely missing → we cannot rule out rain; be honest about it.
  if (status === 'safe' && !has(prob) && !has(mm)) status = 'unknown';

  return { status, tone: STATUS_TONE[status], checks: { ...checks, safe: status === 'safe' } };
}

/** Build the engine input from live data: current temp/humidity + today's (24 h) daily rain values. */
export function inputFromWeather(data) {
  const today = data?.daily?.[0] || {};
  return {
    temp: data?.current?.temp ?? null,
    humidity: data?.current?.humidity ?? null,
    prob: today.prob ?? null,
    mm: today.mm ?? null,
  };
}

/** Derive weather alerts from the live 7-day forecast (no mock data). */
export function deriveAlerts(daily = []) {
  const alerts = [];
  const rainDay = daily.find((d) => (d.prob ?? 0) >= THRESHOLDS.rainProb || (d.mm ?? 0) >= THRESHOLDS.rainMm);
  if (rainDay) alerts.push({ type: (rainDay.mm ?? 0) >= 15 ? 'heavy' : 'rain', level: (rainDay.mm ?? 0) >= 15 ? 'high' : 'medium', day: rainDay });
  const hotDay = daily.find((d) => (d.hi ?? 0) >= 35);
  if (hotDay) alerts.push({ type: 'heat', level: 'medium', day: hotDay });
  return alerts;
}
