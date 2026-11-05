import { addDays } from '../utils/date';
import { scheduleParams, schedulePhases } from './cropSchedules';

const L = (en, hi, kn) => ({ en, hi, kn });

export const demoProfile = {
  name: '', // generic: filled in by the farmer (or from auth) – never a hardcoded person
  schema: 2,
  phone: '',
  village: 'Kikkeri',
  district: 'Mandya',
  state: 'Karnataka',
  landSize: 3,
  landType: 'mixed',
  soil: 'red',
  irrigation: 'borewell',
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

export const initialCrops = () => [
  { id: 'c1', cropId: 'ragi', acres: 2, sowDate: addDays(-40), health: 'healthy' },
  { id: 'c2', cropId: 'tomato', acres: 0.5, sowDate: addDays(-52), health: 'watch' },
  { id: 'c3', cropId: 'maize', acres: 0.5, sowDate: addDays(-25), health: 'healthy' },
];

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
