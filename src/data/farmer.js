import { scheduleParams, schedulePhases } from './cropSchedules';
import { CROP_MASTER, STAGE_NAMES, seasonForMonth } from './cropMasterData';

const L = (en, hi, kn) => ({ en, hi, kn });

/**
 * Starting profile for a new farmer: nothing is invented. Name, land and location are filled in
 * by the farmer (Profile) or detected from the device (LocationContext).
 */
export const defaultProfile = {
  name: '',
  schema: 3,
  phone: '',
  village: '',
  district: '',
  state: '',
  landSize: '',
  landType: '',
  soil: '',
  irrigation: '',
  language: 'kn',
};

/** Catalog of crops a farmer can add. `art` selects the illustration, `until` are cumulative day thresholds. */
export const cropCatalog = {
  ragi: {
    id: 'ragi',
    art: 'ragi',
    name: L('Ragi (Finger Millet)', 'रागी (मंडुआ)', 'ರಾಗಿ'),
    waterNeed: L('Moderate – 3 to 4 irrigations', 'मध्यम – 3 से 4 सिंचाई', 'ಮಧ್ಯಮ – 3 ರಿಂದ 4 ನೀರಾವರಿ'),
  },
  tomato: {
    id: 'tomato',
    art: 'tomato',
    name: L('Tomato', 'टमाटर', 'ಟೊಮೆಟೊ'),
    waterNeed: L('High – frequent light irrigation', 'अधिक – बार-बार हल्की सिंचाई', 'ಹೆಚ್ಚು – ಆಗಾಗ ಹಗುರ ನೀರಾವರಿ'),
  },
  maize: {
    id: 'maize',
    art: 'maize',
    name: L('Maize', 'मक्का', 'ಮೆಕ್ಕೆಜೋಳ'),
    waterNeed: L('Moderate – critical at tasseling', 'मध्यम – झंडा निकलते समय ज़रूरी', 'ಮಧ್ಯಮ – ತೆನೆ ಬರುವ ಸಮಯದಲ್ಲಿ ಮುಖ್ಯ'),
  },
  paddy: {
    id: 'paddy',
    art: 'ragi',
    name: L('Paddy (Rice)', 'धान (चावल)', 'ಭತ್ತ (ಅಕ್ಕಿ)'),
    waterNeed: L('High – standing water', 'अधिक – खड़ा पानी', 'ಹೆಚ್ಚು – ನಿಂತ ನೀರು'),
  },
  groundnut: {
    id: 'groundnut',
    art: 'maize',
    name: L('Groundnut', 'मूंगफली', 'ಕಡಲೆಕಾಯಿ'),
    waterNeed: L('Moderate – avoid waterlogging', 'मध्यम – जलभराव से बचें', 'ಮಧ್ಯಮ – ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿ'),
  },
};

/** The 15 knowledge-base crops (art reuses the three illustrations). */
const KB_CATALOG = {
  wheat: ['ragi', L('Wheat', 'गेहूं', 'ಗೋಧಿ'), L('Moderate – 4 to 5 irrigations, critical at CRI', 'मध्यम – 4 से 5 सिंचाई, CRI पर ज़रूरी', 'ಮಧ್ಯಮ – 4 ರಿಂದ 5 ನೀರಾವರಿ, CRI ಹಂತದಲ್ಲಿ ಮುಖ್ಯ')],
  jowar: ['maize', L('Jowar (Sorghum)', 'ज्वार', 'ಜೋಳ'), L('Low to moderate – critical at boot leaf', 'कम से मध्यम – गोभ पर ज़रूरी', 'ಕಡಿಮೆಯಿಂದ ಮಧ್ಯಮ – ಗರ್ಭ ಹಂತದಲ್ಲಿ ಮುಖ್ಯ')],
  bajra: ['ragi', L('Bajra (Pearl Millet)', 'बाजरा', 'ಸಜ್ಜೆ'), L('Low – drought tolerant', 'कम – सूखा सहनशील', 'ಕಡಿಮೆ – ಬರ ಸಹಿಷ್ಣು')],
  cowpea: ['tomato', L('Cowpea', 'लोबिया', 'ಅಲಸಂದೆ'), L('Low – critical at flowering', 'कम – फूल पर ज़रूरी', 'ಕಡಿಮೆ – ಹೂ ಹಂತದಲ್ಲಿ ಮುಖ್ಯ')],
  blackgram: ['tomato', L('Black Gram (Urad)', 'उड़द', 'ಉದ್ದು'), L('Low – keep moist at flowering', 'कम – फूल पर नमी रखें', 'ಕಡಿಮೆ – ಹೂ ಹಂತದಲ್ಲಿ ತೇವ ಇರಲಿ')],
  greengram: ['tomato', L('Green Gram (Moong)', 'मूंग', 'ಹೆಸರು'), L('Low – avoid waterlogging', 'कम – जलभराव से बचें', 'ಕಡಿಮೆ – ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿ')],
  redgram: ['maize', L('Red Gram (Tur)', 'अरहर (तूर)', 'ತೊಗರಿ'), L('Low – mostly rainfed', 'कम – ज़्यादातर वर्षा आधारित', 'ಕಡಿಮೆ – ಹೆಚ್ಚಾಗಿ ಮಳೆಯಾಶ್ರಿತ')],
  soybean: ['tomato', L('Soybean', 'सोयाबीन', 'ಸೋಯಾಬೀನ್'), L('Moderate – critical at flowering', 'मध्यम – फूल पर ज़रूरी', 'ಮಧ್ಯಮ – ಹೂ ಹಂತದಲ್ಲಿ ಮುಖ್ಯ')],
  mustard: ['ragi', L('Rapeseed & Mustard', 'सरसों', 'ಸಾಸಿವೆ'), L('Low – 2 to 3 irrigations', 'कम – 2 से 3 सिंचाई', 'ಕಡಿಮೆ – 2 ರಿಂದ 3 ನೀರಾವರಿ')],
  sugarcane: ['maize', L('Sugarcane', 'गन्ना', 'ಕಬ್ಬು'), L('Very high – regular irrigation', 'बहुत अधिक – नियमित सिंचाई', 'ಬಹಳ ಹೆಚ್ಚು – ನಿಯಮಿತ ನೀರಾವರಿ')],
  cotton: ['tomato', L('Cotton', 'कपास', 'ಹತ್ತಿ'), L('Moderate – critical at boll setting', 'मध्यम – टिंडे बनते समय ज़रूरी', 'ಮಧ್ಯಮ – ಕಾಯಿ ಕಟ್ಟುವಾಗ ಮುಖ್ಯ')],
  jute: ['maize', L('Jute', 'जूट', 'ಸೆಣಬು'), L('High – but needs good drainage', 'अधिक – पर अच्छी जल निकासी ज़रूरी', 'ಹೆಚ್ಚು – ಆದರೆ ಉತ್ತಮ ಬಸಿಗಾಲುವೆ ಬೇಕು')],
  tobacco: ['tomato', L('Tobacco', 'तंबाकू', 'ಹೊಗೆಸೊಪ್ಪು'), L('Moderate – avoid excess water', 'मध्यम – ज़्यादा पानी न दें', 'ಮಧ್ಯಮ – ಹೆಚ್ಚು ನೀರು ಬೇಡ')],
  coconut: ['maize', L('Coconut', 'नारियल', 'ತೆಂಗು'), L('High – summer irrigation every 4–7 days', 'अधिक – गर्मी में हर 4–7 दिन सिंचाई', 'ಹೆಚ್ಚು – ಬೇಸಿಗೆಯಲ್ಲಿ 4–7 ದಿನಕ್ಕೊಮ್ಮೆ ನೀರು')],
  rubber: ['maize', L('Rubber', 'रबड़', 'ರಬ್ಬರ್'), L('Rainfed – high rainfall areas', 'वर्षा आधारित – अधिक वर्षा वाले क्षेत्र', 'ಮಳೆಯಾಶ್ರಿತ – ಹೆಚ್ಚು ಮಳೆ ಪ್ರದೇಶ')],
  pepper: ['tomato', L('Black Pepper', 'काली मिर्च', 'ಕರಿಮೆಣಸು'), L('Moderate – winter irrigation Nov–Mar', 'मध्यम – नवं–मार्च सर्दी की सिंचाई', 'ಮಧ್ಯಮ – ನವೆಂ–ಮಾರ್ಚ್ ಚಳಿಗಾಲದ ನೀರಾವರಿ')],
};
Object.entries(KB_CATALOG).forEach(([id, [art, name, waterNeed]]) => {
  cropCatalog[id] = { id, art, name, waterNeed };
});
Object.values(cropCatalog).forEach((c) => {
  c.category = CROP_MASTER[c.id]?.category || 'other';
  c.perennial = !!CROP_MASTER[c.id]?.perennial;
});

/** Label for the field's start date: sowing, transplanting (tobacco) or planting (plantations). */
export const dateLabelKey = (cropId) => (cropCatalog[cropId]?.perennial ? 'kb.plantDate' : cropId === 'tobacco' ? 'kb.transplantDate' : 'crops.sowDate');

/** A new farmer starts with no fields – they add their own on My Crops. */
export const initialCrops = () => [];

export const soilOptions = ['red', 'black', 'sandy', 'laterite'];
export const landTypeOptions = ['irrigated', 'rainfed', 'mixed'];
export const irrigationOptions = ['drip', 'sprinkler', 'flood', 'borewell', 'rainfed'];

const NOT_SOWN = L('Not sown yet', 'अभी बुवाई नहीं', 'ಇನ್ನೂ ಬಿತ್ತನೆ ಆಗಿಲ್ಲ');

/**
 * Stage / progress for a field. Duration and stage boundaries come from the crop master data
 * (data/cropMasterData.js, via the field's variant in data/cropSchedules.js), so My Crops, Home
 * and the Crop Calendar always agree.
 *   elapsed     = today − sowing date (negative before sowing)
 *   daysLeft    = duration − elapsed (never below 0)
 *   harvestDate = sowing date + duration
 *   progress    = min(100, elapsed / duration × 100)
 */
export function cropStatus(crop, todayISO, daysBetween, addDaysTo) {
  const cat = cropCatalog[crop.cropId];
  if (cat?.perennial) {
    // Plantations: the "stage" is the season of the year; there is no single harvest date.
    const elapsed = daysBetween(crop.sowDate, todayISO);
    const month = Number(todayISO.slice(5, 7));
    const key = seasonForMonth(month);
    const doy = daysBetween(`${todayISO.slice(0, 4)}-01-01`, todayISO);
    return {
      cat, perennial: true, age: Math.max(0, elapsed), elapsed, sowIn: elapsed < 0 ? -elapsed : 0,
      stage: elapsed < 0 ? NOT_SOWN : STAGE_NAMES[key], stageKey: elapsed < 0 ? null : key, stageIdx: 0,
      duration: 365, harvestDate: null, progress: Math.round((doy / 365) * 100), daysToHarvest: null,
    };
  }
  const elapsed = daysBetween(crop.sowDate, todayISO);
  const age = Math.max(0, elapsed);
  const duration = scheduleParams(crop)?.D ?? 100;
  const stages = schedulePhases(crop) ?? [{ start: 0, end: duration + 1, name: cat?.name || L(crop.cropId, crop.cropId, crop.cropId) }];
  const found = stages.findIndex((s) => age < s.end);
  const stageIdx = found === -1 ? stages.length - 1 : found;
  return {
    cat,
    age,
    elapsed,
    sowIn: elapsed < 0 ? -elapsed : 0,
    stage: elapsed < 0 ? NOT_SOWN : stages[stageIdx].name,
    stageKey: elapsed < 0 ? null : stages[stageIdx].key,
    stageIdx,
    duration,
    harvestDate: addDaysTo(crop.sowDate, duration),
    progress: Math.min(100, Math.round((age / duration) * 100)),
    daysToHarvest: Math.max(0, duration - elapsed),
  };
}
