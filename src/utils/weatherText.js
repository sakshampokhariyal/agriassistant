import { fmtDate, todayISO } from './date';

/** Human label for where the weather is from. */
export function placeLabel(w, t) {
  if (w?.source === 'gps' && w.coords) {
    return t('wx.locGps', { lat: w.coords.lat.toFixed(2), lon: w.coords.lon.toFixed(2) });
  }
  return t('wx.locDefault');
}

/** "Today" / "Tomorrow" / "Fri, 7 Nov" for a forecast ISO date. */
export function dayLabel(iso, t, lang) {
  const today = todayISO();
  const diff = Math.round((new Date(iso) - new Date(today)) / 86400000);
  if (diff === 0) return t('common.today');
  if (diff === 1) return t('common.tomorrow');
  return fmtDate(iso, lang, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Localised title/body for a derived alert. */
export function alertText(a, t, lang) {
  const vars = {
    day: dayLabel(a.day.date, t, lang),
    prob: a.day.prob ?? '–',
    mm: a.day.mm != null ? a.day.mm.toFixed(1) : '–',
    temp: a.day.hi != null ? Math.round(a.day.hi) : '–',
  };
  return { title: t(`wx.alert.${a.type}`, vars), body: t(`wx.alert.${a.type}Body`, vars) };
}

export const fmt = (v, digits = 0) => (v == null ? '–' : Number(v).toFixed(digits));
