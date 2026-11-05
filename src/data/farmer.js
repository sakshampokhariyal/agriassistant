import { addDays } from '../utils/date';

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
    duration: 110,
    waterNeed: L('Moderate – 3 to 4 irrigations', 'मध्यम – 3 से 4 सिंचाई', 'ಮಧ್ಯಮ – 3 ರಿಂದ 4 ನೀರಾವರಿ'),
    stages: [
      { until: 12, name: L('Germination', 'अंकुरण', 'ಮೊಳಕೆ') },
      { until: 45, name: L('Tillering', 'कल्ले निकलना', 'ಟಿಲ್ಲರಿಂಗ್ (ಕವಲೊಡೆಯುವ ಹಂತ)') },
      { until: 75, name: L('Panicle initiation', 'बाली बनना', 'ತೆನೆ ಬರುವ ಹಂತ') },
      { until: 100, name: L('Grain filling', 'दाना भरना', 'ಕಾಳು ತುಂಬುವ ಹಂತ') },
      { until: 999, name: L('Maturity', 'पकना', 'ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧ') },
    ],
    tips: [
      L('Hold irrigation while rain is forecast; ragi tolerates short wet spells.', 'बारिश का पूर्वानुमान हो तो सिंचाई रोकें; रागी थोड़ी नमी सह लेती है।', 'ಮಳೆ ಮುನ್ಸೂಚನೆ ಇರುವಾಗ ನೀರಾವರಿ ನಿಲ್ಲಿಸಿ; ರಾಗಿ ಸ್ವಲ್ಪ ತೇವವನ್ನು ತಡೆದುಕೊಳ್ಳುತ್ತದೆ.'),
      L('Top-dress nitrogen 30–35 days after sowing, once the field is workable.', 'बुवाई के 30–35 दिन बाद नाइट्रोजन की ऊपरी खाद दें, जब खेत में काम हो सके।', 'ಬಿತ್ತನೆಯಾದ 30–35 ದಿನಗಳ ನಂತರ ಹೊಲದಲ್ಲಿ ಕೆಲಸ ಮಾಡುವಂತಾದಾಗ ಸಾರಜನಕ ಮೇಲುಗೊಬ್ಬರ ನೀಡಿ.'),
      L('Scout leaves twice a week for blast spots after cloudy, humid days.', 'बादल और नमी वाले दिनों के बाद हफ्ते में दो बार पत्तों पर ब्लास्ट के धब्बे देखें।', 'ಮೋಡ, ತೇವದ ದಿನಗಳ ನಂತರ ವಾರಕ್ಕೆ ಎರಡು ಬಾರಿ ಎಲೆಗಳಲ್ಲಿ ಬೆಂಕಿರೋಗದ ಕಲೆಗಳನ್ನು ಗಮನಿಸಿ.'),
    ],
  },
  tomato: {
    id: 'tomato',
    art: 'tomato',
    name: L('Tomato', 'टमाटर', 'ಟೊಮೆಟೊ'),
    duration: 120,
    waterNeed: L('High – frequent light irrigation', 'अधिक – बार-बार हल्की सिंचाई', 'ಹೆಚ್ಚು – ಆಗಾಗ ಹಗುರ ನೀರಾವರಿ'),
    stages: [
      { until: 20, name: L('Seedling', 'पौध', 'ಸಸಿ ಹಂತ') },
      { until: 45, name: L('Vegetative growth', 'वानस्पतिक वृद्धि', 'ಕಾಂಡ ಬೆಳವಣಿಗೆ') },
      { until: 70, name: L('Flowering', 'फूल आना', 'ಹೂ ಬಿಡುವ ಹಂತ') },
      { until: 110, name: L('Fruiting', 'फल लगना', 'ಕಾಯಿ ಕಟ್ಟುವ ಹಂತ') },
      { until: 999, name: L('Harvest', 'तुड़ाई', 'ಕೊಯ್ಲು') },
    ],
    tips: [
      L('Stake plants and remove lower leaves touching the soil.', 'पौधों को सहारा दें और मिट्टी छूते निचले पत्ते हटा दें।', 'ಗಿಡಗಳಿಗೆ ಆಧಾರ ಕೊಡಿ ಮತ್ತು ಮಣ್ಣಿಗೆ ತಾಕುವ ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ತೆಗೆಯಿರಿ.'),
      L('Humid weather raises early blight risk. Check lower leaves for brown rings.', 'नमी वाले मौसम में अगेती झुलसा का खतरा बढ़ता है। निचले पत्तों पर भूरे छल्ले देखें।', 'ತೇವದ ಹವೆಯಲ್ಲಿ ಆರಂಭಿಕ ಅಂಗಮಾರಿ ಅಪಾಯ ಹೆಚ್ಚು. ಕೆಳಗಿನ ಎಲೆಗಳಲ್ಲಿ ಕಂದು ಉಂಗುರಗಳನ್ನು ನೋಡಿ.'),
    ],
  },
  maize: {
    id: 'maize',
    art: 'maize',
    name: L('Maize', 'मक्का', 'ಮೆಕ್ಕೆಜೋಳ'),
    duration: 105,
    waterNeed: L('Moderate – critical at tasseling', 'मध्यम – झंडा निकलते समय ज़रूरी', 'ಮಧ್ಯಮ – ತೆನೆ ಬರುವ ಸಮಯದಲ್ಲಿ ಮುಖ್ಯ'),
    stages: [
      { until: 10, name: L('Emergence', 'अंकुरण', 'ಮೊಳಕೆ') },
      { until: 45, name: L('Vegetative growth', 'वानस्पतिक वृद्धि', 'ಕಾಂಡ ಬೆಳವಣಿಗೆ') },
      { until: 65, name: L('Tasseling', 'झंडा निकलना', 'ಹೂ ಗೊಂಚಲು ಹಂತ') },
      { until: 95, name: L('Grain filling', 'दाना भरना', 'ಕಾಳು ತುಂಬುವ ಹಂತ') },
      { until: 999, name: L('Maturity', 'पकना', 'ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧ') },
    ],
    tips: [
      L('Watch for fall armyworm in whorls; check early morning.', 'पत्तियों के गुच्छे में फॉल आर्मीवर्म देखें; सुबह जल्दी जांचें।', 'ಎಲೆ ಸುರುಳಿಗಳಲ್ಲಿ ಸೈನಿಕ ಹುಳು ಇದೆಯೇ ಎಂದು ಬೆಳಿಗ್ಗೆ ಬೇಗ ಪರೀಕ್ಷಿಸಿ.'),
      L('Earth up the base after the first top-dressing.', 'पहली ऊपरी खाद के बाद पौधों की जड़ पर मिट्टी चढ़ाएं।', 'ಮೊದಲ ಮೇಲುಗೊಬ್ಬರದ ನಂತರ ಬುಡಕ್ಕೆ ಮಣ್ಣು ಏರಿಸಿ.'),
    ],
  },
  paddy: {
    id: 'paddy',
    art: 'ragi',
    name: L('Paddy', 'धान', 'ಭತ್ತ'),
    duration: 120,
    waterNeed: L('High – standing water', 'अधिक – खड़ा पानी', 'ಹೆಚ್ಚು – ನಿಂತ ನೀರು'),
    stages: [
      { until: 25, name: L('Nursery', 'नर्सरी', 'ಸಸಿಮಡಿ') },
      { until: 60, name: L('Tillering', 'कल्ले निकलना', 'ಕವಲೊಡೆಯುವ ಹಂತ') },
      { until: 90, name: L('Panicle initiation', 'बाली बनना', 'ತೆನೆ ಬರುವ ಹಂತ') },
      { until: 110, name: L('Grain filling', 'दाना भरना', 'ಕಾಳು ತುಂಬುವ ಹಂತ') },
      { until: 999, name: L('Maturity', 'पकना', 'ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧ') },
    ],
    tips: [L('Maintain 2–5 cm water during tillering.', 'कल्ले निकलते समय 2–5 सेमी पानी रखें।', 'ಕವಲೊಡೆಯುವ ಹಂತದಲ್ಲಿ 2–5 ಸೆಂ.ಮೀ ನೀರು ಇರಲಿ.')],
  },
  groundnut: {
    id: 'groundnut',
    art: 'maize',
    name: L('Groundnut', 'मूंगफली', 'ಕಡಲೆಕಾಯಿ'),
    duration: 110,
    waterNeed: L('Moderate – avoid waterlogging', 'मध्यम – जलभराव से बचें', 'ಮಧ್ಯಮ – ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿ'),
    stages: [
      { until: 15, name: L('Germination', 'अंकुरण', 'ಮೊಳಕೆ') },
      { until: 40, name: L('Vegetative growth', 'वानस्पतिक वृद्धि', 'ಕಾಂಡ ಬೆಳವಣಿಗೆ') },
      { until: 70, name: L('Pegging', 'सुई बनना', 'ಬಿಳಲು ಇಳಿಯುವ ಹಂತ') },
      { until: 100, name: L('Pod filling', 'फली भरना', 'ಕಾಯಿ ತುಂಬುವ ಹಂತ') },
      { until: 999, name: L('Maturity', 'पकना', 'ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧ') },
    ],
    tips: [L('Apply gypsum at flowering for better pod filling.', 'बेहतर फली भराव के लिए फूल आने पर जिप्सम डालें।', 'ಉತ್ತಮ ಕಾಯಿ ತುಂಬಲು ಹೂ ಬಿಡುವಾಗ ಜಿಪ್ಸಂ ಹಾಕಿ.')],
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

/** Compute stage / progress info for a crop instance. */
export function cropStatus(crop, todayISO, daysBetween, addDaysTo) {
  const cat = cropCatalog[crop.cropId];
  const age = Math.max(0, daysBetween(crop.sowDate, todayISO));
  const stageIdx = Math.max(0, cat.stages.findIndex((s) => age < s.until));
  const harvestDate = addDaysTo(crop.sowDate, cat.duration);
  const progress = Math.min(100, Math.round((age / cat.duration) * 100));
  return { cat, age, stage: cat.stages[stageIdx].name, stageIdx, harvestDate, progress, daysToHarvest: Math.max(0, cat.duration - age) };
}
