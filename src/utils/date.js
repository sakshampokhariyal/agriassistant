import { localeOf } from '../translations';

const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISO(new Date());

/** ISO date `n` days from today (negative = past). */
export const addDays = (n, from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const addDaysTo = (iso, n) => addDays(n, parseISO(iso));

export const daysBetween = (aISO, bISO) =>
  Math.round((parseISO(bISO) - parseISO(aISO)) / 86400000);

export const fmtDate = (iso, lang, opts = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat(localeOf(lang), opts).format(parseISO(iso));

export const fmtWeekday = (iso, lang, style = 'short') =>
  new Intl.DateTimeFormat(localeOf(lang), { weekday: style }).format(parseISO(iso));

export const fmtLong = (lang, d = new Date()) =>
  new Intl.DateTimeFormat(localeOf(lang), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);

export const fmtNum = (n, lang) => new Intl.NumberFormat(localeOf(lang)).format(n);
