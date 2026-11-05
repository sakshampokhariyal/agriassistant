import { addDays } from '../utils/date';

const L = (en, hi, kn) => ({ en, hi, kn });

export const marketCrops = {
  ragi: { name: L('Ragi', 'रागी', 'ರಾಗಿ'), base: 4350, trend: 7, msp: 4290, spread: 180 },
  maize: { name: L('Maize', 'मक्का', 'ಮೆಕ್ಕೆಜೋಳ'), base: 2250, trend: -2, msp: 2225, spread: 120 },
  tomato: { name: L('Tomato', 'टमाटर', 'ಟೊಮೆಟೊ'), base: 2400, trend: 14, msp: null, spread: 600 },
  paddy: { name: L('Paddy', 'धान', 'ಭತ್ತ'), base: 2350, trend: 1, msp: 2369, spread: 110 },
};

export const mandis = [
  { id: 'mandya', name: L('Mandya APMC', 'मांड्या एपीएमसी', 'ಮಂಡ್ಯ ಎಪಿಎಂಸಿ'), km: 8, offset: 0 },
  { id: 'mysuru', name: L('Mysuru APMC', 'मैसूरु एपीएमसी', 'ಮೈಸೂರು ಎಪಿಎಂಸಿ'), km: 47, offset: 60 },
  { id: 'bengaluru', name: L('Bengaluru (Yeshwanthpur)', 'बेंगलुरु (येशवंतपुर)', 'ಬೆಂಗಳೂರು (ಯಶವಂತಪುರ)'), km: 98, offset: 180 },
  { id: 'hassan', name: L('Hassan APMC', 'हासन एपीएमसी', 'ಹಾಸನ ಎಪಿಎಂಸಿ'), km: 104, offset: -40 },
  { id: 'tumakuru', name: L('Tumakuru APMC', 'तुमकुरु एपीएमसी', 'ತುಮಕೂರು ಎಪಿಎಂಸಿ'), km: 128, offset: 90 },
];

export const TRANSPORT_PER_KM = 1.2; // ₹ per quintal per km (demo)

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
};

/** Deterministic mock price series, newest last. */
export function getSeries(cropId, mandiId, days) {
  const c = marketCrops[cropId];
  const m = mandis.find((x) => x.id === mandiId);
  const seed = hash(cropId + mandiId);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const noise = Math.sin((seed % 17) + i * 0.9) * c.spread * 0.18 + Math.cos(i * 1.7 + (seed % 5)) * c.spread * 0.1;
    const modal = Math.round(c.base + m.offset - i * c.trend + noise);
    const spread = c.spread * (0.55 + ((seed + i) % 5) / 10);
    out.push({
      date: addDays(-i),
      modal,
      min: Math.round(modal - spread / 2),
      max: Math.round(modal + spread / 2),
    });
  }
  return out;
}

export function todayPrices(cropId) {
  return mandis.map((m) => {
    const s = getSeries(cropId, m.id, 8);
    const t = s[s.length - 1];
    const week = s[0];
    return { ...m, ...t, change: t.modal - week.modal, net: Math.round(t.modal - m.km * TRANSPORT_PER_KM) };
  });
}

const T = {
  en: ({ crop, mandi, net, gain, trend }) =>
    trend > 0
      ? `${crop} prices are rising (+₹${trend} this week). ${mandi} gives the best price after transport (≈ ₹${net}/quintal), ₹${gain} more than your local mandi. If you are close to harvest, plan to sell there or hold stock a few days.`
      : `${crop} prices are flat or easing. ${mandi} still gives the best price after transport (≈ ₹${net}/quintal), ₹${gain} more than your local mandi. Consider selling soon.`,
  hi: ({ crop, mandi, net, gain, trend }) =>
    trend > 0
      ? `${crop} के भाव बढ़ रहे हैं (इस हफ्ते +₹${trend})। ढुलाई के बाद ${mandi} में सबसे अच्छा भाव है (≈ ₹${net}/क्विंटल), स्थानीय मंडी से ₹${gain} अधिक। कटाई के पास हों तो वहीं बेचने की योजना बनाएं या कुछ दिन रोकें।`
      : `${crop} के भाव स्थिर या कम हो रहे हैं। ढुलाई के बाद भी ${mandi} में सबसे अच्छा भाव है (≈ ₹${net}/क्विंटल), स्थानीय मंडी से ₹${gain} अधिक। जल्द बेचने पर विचार करें।`,
  kn: ({ crop, mandi, net, gain, trend }) =>
    trend > 0
      ? `${crop} ಬೆಲೆ ಏರುತ್ತಿದೆ (ಈ ವಾರ +₹${trend}). ಸಾಗಣೆ ನಂತರ ${mandi} ನಲ್ಲಿ ಉತ್ತಮ ಬೆಲೆ (≈ ₹${net}/ಕ್ವಿಂಟಾಲ್), ಸ್ಥಳೀಯ ಮಂಡಿಗಿಂತ ₹${gain} ಹೆಚ್ಚು. ಕೊಯ್ಲು ಹತ್ತಿರವಿದ್ದರೆ ಅಲ್ಲಿ ಮಾರಲು ಯೋಜಿಸಿ ಅಥವಾ ಕೆಲವು ದಿನ ದಾಸ್ತಾನು ಇಡಿ.`
      : `${crop} ಬೆಲೆ ಸ್ಥಿರ ಅಥವಾ ಇಳಿಮುಖ. ಸಾಗಣೆ ನಂತರವೂ ${mandi} ನಲ್ಲಿ ಉತ್ತಮ ಬೆಲೆ (≈ ₹${net}/ಕ್ವಿಂಟಾಲ್), ಸ್ಥಳೀಯ ಮಂಡಿಗಿಂತ ₹${gain} ಹೆಚ್ಚು. ಬೇಗ ಮಾರುವುದನ್ನು ಪರಿಗಣಿಸಿ.`,
};

export function getRecommendation(lang, cropId) {
  const rows = todayPrices(cropId);
  const best = [...rows].sort((a, b) => b.net - a.net)[0];
  const local = rows.find((r) => r.id === 'mandya');
  const trend = rows.find((r) => r.id === 'mandya').change;
  const c = marketCrops[cropId];
  const text = T[lang]({
    crop: c.name[lang],
    mandi: best.name[lang],
    net: best.net,
    gain: Math.max(0, best.net - local.net),
    trend,
  });
  return { text, best, trend };
}
