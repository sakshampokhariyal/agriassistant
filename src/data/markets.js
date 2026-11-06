/**
 * Crops with a market on Agmarknet, the commodity name used by the data.gov.in mandi-price
 * dataset, and the Minimum Support Price (₹/quintal) where the Government of India announces one.
 *
 * MSP sources (CACP / PIB press releases):
 *   Kharif marketing season 2025-26 – paddy, jowar, bajra, ragi, maize, tur, moong, urad,
 *   groundnut, soybean, cotton (medium staple).
 *   Rabi marketing season 2026-27 – wheat, rapeseed & mustard.
 *   Raw jute 2025-26; milling copra 2025 (coconut); sugarcane FRP 2025-26.
 * Prices themselves are never generated here – they always come live from Agmarknet.
 */
const L = (en, hi, kn) => ({ en, hi, kn });

export const marketCrops = {
  ragi: { name: L('Ragi', 'रागी', 'ರಾಗಿ'), commodity: 'Ragi (Finger Millet)', msp: 4886, mspSeason: '2025-26' },
  paddy: { name: L('Paddy', 'धान', 'ಭತ್ತ'), commodity: 'Paddy(Dhan)(Common)', msp: 2369, mspSeason: '2025-26' },
  maize: { name: L('Maize', 'मक्का', 'ಮೆಕ್ಕೆಜೋಳ'), commodity: 'Maize', msp: 2400, mspSeason: '2025-26' },
  wheat: { name: L('Wheat', 'गेहूं', 'ಗೋಧಿ'), commodity: 'Wheat', msp: 2585, mspSeason: '2026-27' },
  jowar: { name: L('Jowar', 'ज्वार', 'ಜೋಳ'), commodity: 'Jowar(Sorghum)', msp: 3699, mspSeason: '2025-26' },
  bajra: { name: L('Bajra', 'बाजरा', 'ಸಜ್ಜೆ'), commodity: 'Bajra(Pearl Millet/Cumbu)', msp: 2775, mspSeason: '2025-26' },
  redgram: { name: L('Tur (Red gram)', 'अरहर (तूर)', 'ತೊಗರಿ'), commodity: 'Arhar (Tur/Red Gram)(Whole)', msp: 8000, mspSeason: '2025-26' },
  greengram: { name: L('Moong (Green gram)', 'मूंग', 'ಹೆಸರು'), commodity: 'Green Gram (Moong)(Whole)', msp: 8768, mspSeason: '2025-26' },
  blackgram: { name: L('Urad (Black gram)', 'उड़द', 'ಉದ್ದು'), commodity: 'Black Gram (Urd Beans)(Whole)', msp: 7800, mspSeason: '2025-26' },
  cowpea: { name: L('Cowpea', 'लोबिया', 'ಅಲಸಂದೆ'), commodity: 'Cowpea(Lobia/Karamani)', msp: null },
  groundnut: { name: L('Groundnut', 'मूंगफली', 'ಕಡಲೆಕಾಯಿ'), commodity: 'Groundnut', msp: 7263, mspSeason: '2025-26' },
  soybean: { name: L('Soybean', 'सोयाबीन', 'ಸೋಯಾಬೀನ್'), commodity: 'Soyabean', msp: 5328, mspSeason: '2025-26' },
  mustard: { name: L('Mustard', 'सरसों', 'ಸಾಸಿವೆ'), commodity: 'Mustard', msp: 6200, mspSeason: '2026-27' },
  cotton: { name: L('Cotton', 'कपास', 'ಹತ್ತಿ'), commodity: 'Cotton', msp: 7710, mspSeason: '2025-26' },
  jute: { name: L('Jute', 'जूट', 'ಸೆಣಬು'), commodity: 'Jute', msp: 5650, mspSeason: '2025-26' },
  sugarcane: { name: L('Sugarcane', 'गन्ना', 'ಕಬ್ಬು'), commodity: 'Sugarcane', msp: 355, mspSeason: 'FRP 2025-26' },
  tomato: { name: L('Tomato', 'टमाटर', 'ಟೊಮೆಟೊ'), commodity: 'Tomato', msp: null },
  coconut: { name: L('Coconut', 'नारियल', 'ತೆಂಗು'), commodity: 'Coconut', msp: null },
  pepper: { name: L('Black pepper', 'काली मिर्च', 'ಕರಿಮೆಣಸು'), commodity: 'Black pepper', msp: null },
  rubber: { name: L('Rubber', 'रबड़', 'ರಬ್ಬರ್'), commodity: 'Rubber', msp: null },
};

/**
 * How each crop is named in Agmarknet records. The API's commodity filter matches loosely
 * (a "Tur" query also returns black gram, green gram and dals), so rows are checked again here.
 */
export const COMMODITY_MATCH = {
  ragi: [/ragi|finger millet/i],
  paddy: [/paddy|dhan/i],
  maize: [/maize/i],
  wheat: [/^wheat/i],
  jowar: [/jowar|sorghum/i],
  bajra: [/bajra|pearl millet|cumbu/i],
  redgram: [/arhar|red ?gram|\btur\b/i, /dal|turmeric/i],
  greengram: [/green ?gram|moong/i, /dal/i],
  blackgram: [/black ?gram|urd|urad/i, /dal/i],
  cowpea: [/cowpea|lobia|karamani|alasande/i, /dal/i],
  groundnut: [/groundnut/i],
  soybean: [/soya/i],
  mustard: [/mustard/i, /oil/i],
  cotton: [/cotton/i, /seed/i],
  jute: [/jute/i],
  sugarcane: [/sugarcane/i],
  tomato: [/tomato/i],
  coconut: [/coconut|copra/i, /oil/i],
  pepper: [/pepper/i, /green|chilli|capsicum/i],
  rubber: [/rubber/i],
};

/** True when an Agmarknet commodity name belongs to the crop (unknown names are kept). */
export const matchesCrop = (cropId, name) => {
  const m = COMMODITY_MATCH[cropId];
  if (!m || !name) return true;
  const [inc, exc] = m;
  return inc.test(name) && !(exc && exc.test(name));
};

/** Median of a list of numbers (robust "typical" mandi price). */
export const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
