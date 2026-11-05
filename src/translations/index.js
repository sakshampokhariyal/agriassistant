import en from './en';
import hi from './hi';
import kn from './kn';
import weatherLive from './weatherLive';
import insurance from './insurance';
import chat from './chat';
import features from './features';
import liveFeeds from './liveFeeds';
import authEmail from './authEmail';
import community from './community';
import phoneAuth from './phoneAuth';
import schedule from './schedule';
import { APP_NAME } from '../config/brand';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', locale: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', short: 'हिं', locale: 'hi-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ', short: 'ಕ', locale: 'kn-IN' },
];

/** Feature modules keep their own string tables; they are merged into one dictionary per language. */
const modules = [weatherLive, insurance, chat, features, liveFeeds, authEmail, community, phoneAuth, schedule];
export const dictionaries = Object.fromEntries(
  Object.entries({ en, hi, kn }).map(([code, base]) => [code, Object.assign({}, base, ...modules.map((m) => m[code] || {}))])
);

export const localeOf = (lang) => LANGUAGES.find((l) => l.code === lang)?.locale || 'en-IN';

/** Translate a UI key. Falls back to English, then the key itself. */
export function translate(lang, key, vars) {
  let str = dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
  if (vars) Object.entries(vars).forEach(([k, v]) => (str = str.split(`{${k}}`).join(v)));
  // Brand token: every string writes {app}, so the product name lives only in config/brand.js.
  return str.split('{app}').join(APP_NAME);
}

/** Pick the right language from a localized content object ({en, hi, kn}) or return a plain string. */
export function loc(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value.en ?? '';
}
