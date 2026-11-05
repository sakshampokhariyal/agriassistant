import en from './en';
import hi from './hi';
import kn from './kn';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', locale: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', short: 'हिं', locale: 'hi-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ', short: 'ಕ', locale: 'kn-IN' },
];

export const dictionaries = { en, hi, kn };

export const localeOf = (lang) => LANGUAGES.find((l) => l.code === lang)?.locale || 'en-IN';

/** Translate a UI key. Falls back to English, then the key itself. */
export function translate(lang, key, vars) {
  let str = dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
  if (vars) Object.entries(vars).forEach(([k, v]) => (str = str.replace(`{${k}}`, v)));
  return str;
}

/** Pick the right language from a localized content object ({en, hi, kn}) or return a plain string. */
export function loc(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value.en ?? '';
}
