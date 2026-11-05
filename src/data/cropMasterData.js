/**
 * Crop master data – single source of truth for the 5 supported crops:
 * duration, growth-stage boundaries, NPK baselines and stage-specific recommendations.
 *
 * Used by My Crops (stage, progress, harvest date, recommendations), the Crop Calendar
 * (stage timeline), the Home card and the NPK calculator.
 *
 * Days are DAS (days after sowing; nursery sowing for transplanted crops).
 * Stage `end` is exclusive. Transplanted crops also have T (transplant day): DAP = DAS − T.
 * Recommendation windows are inclusive [from, to].
 */
const L = (en, hi, kn) => ({ en, hi, kn });
export const HA_PER_ACRE = 1 / 2.471;

/* ───────────── NPK baselines (kg/ha N : P₂O₅ : K₂O) ───────────── */
export const NPK_BASELINES = {
  maize: { crop: 'maize', N: 135, P: 65, K: 15, fymT: 25, name: L('Maize', 'मक्का', 'ಮೆಕ್ಕೆಜೋಳ') },
  ragiRainfed: { crop: 'ragi', N: 22.5, P: 22.5, K: 22.5, name: L('Ragi (rainfed)', 'रागी (वर्षा आधारित)', 'ರಾಗಿ (ಮಳೆ ಆಶ್ರಿತ)') },
  ragiIrrigated: { crop: 'ragi', N: 100, P: 50, K: 50, name: L('Ragi (irrigated, high yield)', 'रागी (सिंचित, अधिक उपज)', 'ರಾಗಿ (ನೀರಾವರಿ, ಹೆಚ್ಚು ಇಳುವರಿ)') },
  tomato: { crop: 'tomato', N: 75, P: 40, K: 25, fymT: 20, name: L('Tomato (standard)', 'टमाटर (सामान्य)', 'ಟೊಮೆಟೊ (ಸಾಮಾನ್ಯ)') },
  tomatoHybrid: { crop: 'tomato', N: 150, P: 100, K: 125, fymT: 20, name: L('Tomato (intensive hybrid)', 'टमाटर (संकर, सघन)', 'ಟೊಮೆಟೊ (ಹೈಬ್ರಿಡ್, ತೀವ್ರ)') },
  paddy: { crop: 'paddy', N: 90, P: 45, K: 45, name: L('Paddy (wetland)', 'धान (तराई)', 'ಭತ್ತ (ಗದ್ದೆ)') },
  groundnut: { crop: 'groundnut', N: 10, P: 75, K: 75, fymT: 2, name: L('Groundnut', 'मूंगफली', 'ಕಡಲೆಕಾಯಿ') },
};

/** Default NPK option for a field (ragi depends on irrigation). */
export function npkKeyFor(field) {
  if (!field?.cropId) return null;
  if (field.cropId === 'ragi') return field.irrigation === 'rainfed' ? 'ragiRainfed' : 'ragiIrrigated';
  if (field.cropId === 'jowar') return field.irrigation === 'rainfed' ? 'jowarRainfed' : 'jowarIrrigated';
  return NPK_BASELINES[field.cropId] ? field.cropId : null;
}

/* ───────────── Crops ───────────── */
export const CROP_MASTER = {
  maize: {
    duration: 100,
    range: '90–110',
    stages: () => [
      { key: 'emergence', start: 0, end: 21, name: L('Emergence & seedling', 'अंकुरण व पौध', 'ಮೊಳಕೆ ಮತ್ತು ಸಸಿ') },
      { key: 'kneeHigh', start: 21, end: 46, name: L('Early vegetative (knee-high)', 'प्रारंभिक वृद्धि (घुटने तक)', 'ಆರಂಭಿಕ ಬೆಳವಣಿಗೆ (ಮೊಣಕಾಲು ಎತ್ತರ)') },
      { key: 'silking', start: 46, end: 71, name: L('Tasseling & silking', 'झंडा व रेशा निकलना', 'ತೆನೆ ಗೊಂಚಲು ಮತ್ತು ರೇಷ್ಮೆ') },
      { key: 'grainFill', start: 71, end: 91, name: L('Grain filling & dough stage', 'दाना भरना व दूधिया अवस्था', 'ಕಾಳು ತುಂಬುವಿಕೆ ಮತ್ತು ಹಾಲುಗಾಳು') },
      { key: 'maturity', start: 91, end: 101, name: L('Physiological maturity', 'परिपक्वता', 'ಪಕ್ವತೆ') },
    ],
    recs: ({ D }) => [
      {
        key: 'establish', from: 0, to: 20, kind: 'action',
        text: L('Give a second light irrigation on day 3 for even germination. First hoeing and weeding is due on day 21.', 'एक समान अंकुरण के लिए तीसरे दिन दूसरी हल्की सिंचाई करें। पहली गुड़ाई-निराई 21वें दिन।', 'ಸಮ ಮೊಳಕೆಗಾಗಿ 3ನೇ ದಿನ ಎರಡನೇ ಹಗುರ ನೀರು ಕೊಡಿ. ಮೊದಲ ಎಡೆಕುಂಟೆ ಮತ್ತು ಕಳೆ 21ನೇ ದಿನ.'),
      },
      {
        key: 'kneeHigh', from: 21, to: 45, kind: 'action',
        text: L('Hand hoe and weed. Apply the second split of nitrogen (45 kg/ha ≈ 40 kg urea per acre) and earth up plants into ridges.', 'हाथ से गुड़ाई-निराई करें। नाइट्रोजन की दूसरी किस्त (45 किग्रा/हे. ≈ 40 किग्रा यूरिया प्रति एकड़) दें और पौधों पर मेड़ बनाकर मिट्टी चढ़ाएं।', 'ಕೈ ಎಡೆಕುಂಟೆ ಮತ್ತು ಕಳೆ ತೆಗೆಯಿರಿ. ಸಾರಜನಕದ ಎರಡನೇ ಕಂತು (45 ಕೆಜಿ/ಹೆ ≈ ಎಕರೆಗೆ 40 ಕೆಜಿ ಯೂರಿಯಾ) ಕೊಟ್ಟು ಸಾಲಿಗೆ ಮಣ್ಣು ಏರಿಸಿ.'),
      },
      {
        key: 'faw', from: 15, to: 60, kind: 'pest',
        text: L('Scout for fall armyworm and stem borer whorl feeding in the early morning; spray Chlorantraniliprole 18.5 SC (as per label) if dead hearts appear.', 'सुबह जल्दी गुच्छों में फॉल आर्मीवर्म और तना छेदक देखें; डेड हार्ट दिखें तो क्लोरेंट्रानिलिप्रोल 18.5 SC (लेबल अनुसार) छिड़कें।', 'ಬೆಳಿಗ್ಗೆ ಬೇಗ ಸುರುಳಿಯಲ್ಲಿ ಸೈನಿಕ ಹುಳು ಮತ್ತು ಕಾಂಡ ಕೊರಕ ಪರೀಕ್ಷಿಸಿ; ಸುಳಿ ಒಣಗಿದರೆ ಕ್ಲೋರಾಂಟ್ರಾನಿಲಿಪ್ರೋಲ್ 18.5 SC (ಲೇಬಲ್ ಪ್ರಕಾರ) ಸಿಂಪಡಿಸಿ.'),
      },
      {
        key: 'silking', from: 46, to: 70, kind: 'critical',
        text: L('Top dress the final split of nitrogen (45 kg/ha). Critical moisture phase – do not allow water stress.', 'नाइट्रोजन की अंतिम किस्त (45 किग्रा/हे.) दें। नमी का महत्वपूर्ण समय – पानी की कमी न होने दें।', 'ಸಾರಜನಕದ ಕೊನೆಯ ಕಂತು (45 ಕೆಜಿ/ಹೆ) ಕೊಡಿ. ತೇವಾಂಶದ ನಿರ್ಣಾಯಕ ಹಂತ – ನೀರಿನ ಕೊರತೆ ಆಗದಿರಲಿ.'),
      },
      {
        key: 'harvest', from: D - 10, to: D + 5, kind: 'harvest',
        text: L('Harvest when the husks dry out and grains are firm with clearly falling moisture.', 'जब छिलके सूखें और दाने सख्त हों, नमी साफ़ घटे तब कटाई करें।', 'ಸಿಪ್ಪೆ ಒಣಗಿ ಕಾಳು ಗಟ್ಟಿಯಾಗಿ ತೇವಾಂಶ ಇಳಿದಾಗ ಕೊಯ್ಲು ಮಾಡಿ.'),
      },
    ],
  },

  ragi: {
    duration: 110,
    range: '100–120',
    T: 21,
    stages: () => [
      { key: 'nursery', start: 0, end: 22, name: L('Nursery', 'नर्सरी', 'ಸಸಿಮಡಿ') },
      { key: 'tillering', start: 22, end: 46, name: L('Vegetative tillering', 'कल्ले निकलना', 'ಕವಲೊಡೆಯುವ ಹಂತ') },
      { key: 'heading', start: 46, end: 71, name: L('Stem elongation & heading', 'तना बढ़ना व बाली निकलना', 'ಕಾಂಡ ಬೆಳವಣಿಗೆ ಮತ್ತು ತೆನೆ') },
      { key: 'flowering', start: 71, end: 96, name: L('Flowering & grain filling', 'फूल व दाना भरना', 'ಹೂ ಮತ್ತು ಕಾಳು ತುಂಬುವಿಕೆ') },
      { key: 'maturity', start: 96, end: 111, name: L('Brown head maturation', 'बाली पकना', 'ತೆನೆ ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗುವ ಪಕ್ವತೆ') },
    ],
    recs: ({ T }) => [
      {
        key: 'nursery', from: 0, to: T, kind: 'action',
        text: L('Nursery of about 200 m² per acre with FYM. Apply ammonium sulphate @ 1 kg per 100 m² on day 14, then transplant 3-week-old seedlings at 25 × 15 cm.', 'लगभग 200 वर्ग मी. प्रति एकड़ नर्सरी, गोबर खाद के साथ। 14वें दिन 1 किग्रा अमोनियम सल्फेट प्रति 100 वर्ग मी. दें, फिर 3 सप्ताह की पौध 25 × 15 सेमी पर रोपें।', 'ಎಕರೆಗೆ ಸುಮಾರು 200 ಚ.ಮೀ ಸಸಿಮಡಿ, ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರದೊಂದಿಗೆ. 14ನೇ ದಿನ 100 ಚ.ಮೀಗೆ 1 ಕೆಜಿ ಅಮೋನಿಯಂ ಸಲ್ಫೇಟ್ ಕೊಟ್ಟು, 3 ವಾರದ ಸಸಿಯನ್ನು 25 × 15 ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿ ನಾಟಿ ಮಾಡಿ.'),
      },
      {
        key: 'tillering', from: T + 20, to: T + 25, kind: 'action',
        text: L('Complete the first weeding. Top dress 22.5 kg N/ha (≈ 20 kg urea per acre); keep the soil workable.', 'पहली निराई पूरी करें। 22.5 किग्रा N/हे. (≈ 20 किग्रा यूरिया प्रति एकड़) दें; मिट्टी काम लायक रखें।', 'ಮೊದಲ ಕಳೆ ತೆಗೆಯುವುದನ್ನು ಮುಗಿಸಿ. 22.5 ಕೆಜಿ N/ಹೆ (≈ ಎಕರೆಗೆ 20 ಕೆಜಿ ಯೂರಿಯಾ) ಕೊಡಿ; ಮಣ್ಣು ಕೆಲಸಕ್ಕೆ ಹದವಾಗಿರಲಿ.'),
      },
      {
        key: 'blast', from: 46, to: 95, kind: 'pest',
        text: L('Scout for blast (spindle-shaped grey lesions) after humid days. If the threshold is exceeded, apply Mancozeb @ 750–1000 g/ha (300–400 g per acre).', 'नम दिनों के बाद ब्लास्ट (तकुए जैसे धूसर धब्बे) देखें। सीमा पार हो तो मैंकोज़ेब 750–1000 ग्राम/हे. (300–400 ग्राम प्रति एकड़) दें।', 'ತೇವದ ದಿನಗಳ ನಂತರ ಬೆಂಕಿರೋಗ (ಬೂದು ಉದ್ದ ಕಲೆ) ಪರೀಕ್ಷಿಸಿ. ಮಿತಿ ಮೀರಿದರೆ ಮ್ಯಾಂಕೋಜೆಬ್ 750–1000 ಗ್ರಾಂ/ಹೆ (ಎಕರೆಗೆ 300–400 ಗ್ರಾಂ) ಕೊಡಿ.'),
      },
      {
        key: 'water', from: T + 50, to: T + 60, kind: 'action',
        text: L('Irrigate every week during ear emergence and grain filling; do not let the soil crack.', 'बाली निकलने और दाना भरने के समय हर सप्ताह सिंचाई करें; मिट्टी फटने न दें।', 'ತೆನೆ ಮೂಡುವ ಮತ್ತು ಕಾಳು ತುಂಬುವಾಗ ವಾರಕ್ಕೊಮ್ಮೆ ನೀರು ಕೊಡಿ; ಮಣ್ಣು ಬಿರುಕು ಬಿಡದಿರಲಿ.'),
      },
      {
        key: 'harvest', from: 96, to: 115, kind: 'harvest',
        text: L('Harvest when earheads turn a distinct yellowish-brown; dry the harvested sheaves under straw for 2–3 days before threshing.', 'जब बालियां साफ़ पीली-भूरी हों तब कटाई करें; कटे गट्ठर 2–3 दिन भूसे के नीचे सुखाकर गहाई करें।', 'ತೆನೆಗಳು ಸ್ಪಷ್ಟ ಹಳದಿ-ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿದಾಗ ಕೊಯ್ಲು ಮಾಡಿ; ಕಟ್ಟುಗಳನ್ನು 2–3 ದಿನ ಹುಲ್ಲಿನ ಕೆಳಗೆ ಒಣಗಿಸಿ ಒಕ್ಕಣೆ ಮಾಡಿ.'),
      },
    ],
  },

  tomato: {
    duration: 125,
    range: '110–135',
    T: 28,
    stages: () => [
      { key: 'nursery', start: 0, end: 29, name: L('Nursery & seedling', 'नर्सरी व पौध', 'ಸಸಿಮಡಿ ಮತ್ತು ಸಸಿ') },
      { key: 'vegetative', start: 29, end: 56, name: L('Vegetative & bush establishment', 'वृद्धि व झाड़ी बनना', 'ಬೆಳವಣಿಗೆ ಮತ್ತು ಪೊದೆ ಸ್ಥಾಪನೆ') },
      { key: 'fruitSet', start: 56, end: 81, name: L('Flowering & fruit set', 'फूल व फल लगना', 'ಹೂ ಮತ್ತು ಕಾಯಿ ಕಟ್ಟುವಿಕೆ') },
      { key: 'fruitDev', start: 81, end: 111, name: L('Fruit development & breaker stage', 'फल बढ़ना व रंग बदलना', 'ಕಾಯಿ ಬೆಳವಣಿಗೆ ಮತ್ತು ಬಣ್ಣ ಬದಲಾವಣೆ') },
      { key: 'harvest', start: 111, end: 126, name: L('Staggered harvesting', 'क्रमिक तुड़ाई', 'ಹಂತ ಹಂತದ ಕೊಯ್ಲು') },
    ],
    recs: ({ T, D }) => [
      {
        key: 'nursery', from: 0, to: T, kind: 'action',
        text: L('Raise seedlings on raised beds with Trichoderma/Pseudomonas seed treatment. Transplant 25–30-day seedlings at 60 × 60 or 60 × 45 cm with FYM 20 t/ha.', 'उठी क्यारियों पर ट्राइकोडर्मा/स्यूडोमोनास से उपचारित बीज की पौध उगाएं। 25–30 दिन की पौध 60 × 60 या 60 × 45 सेमी पर, गोबर खाद 20 टन/हे. के साथ रोपें।', 'ಟ್ರೈಕೋಡರ್ಮಾ/ಸ್ಯೂಡೋಮೊನಾಸ್ ಉಪಚಾರದೊಂದಿಗೆ ಎತ್ತರಿಸಿದ ಮಡಿಯಲ್ಲಿ ಸಸಿ ಬೆಳೆಸಿ. 25–30 ದಿನದ ಸಸಿಯನ್ನು 60 × 60 ಅಥವಾ 60 × 45 ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿ, ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ 20 ಟ/ಹೆ ಜೊತೆ ನಾಟಿ ಮಾಡಿ.'),
      },
      {
        key: 'vegetative', from: T + 20, to: T + 25, kind: 'action',
        text: L('Weed lightly and earth up. Apply a 25% nitrogen top dressing.', 'हल्की निराई करें और मिट्टी चढ़ाएं। 25% नाइट्रोजन ऊपर से दें।', 'ಹಗುರವಾಗಿ ಕಳೆ ತೆಗೆದು ಮಣ್ಣು ಏರಿಸಿ. 25% ಸಾರಜನಕ ಮೇಲುಗೊಬ್ಬರ ಕೊಡಿ.'),
      },
      {
        key: 'fruitSet', from: T + 50, to: T + 55, kind: 'action',
        text: L('Stake plants to lift heavy clusters above the soil. Apply the remaining K₂O and N split to improve fruit weight.', 'भारी गुच्छों को मिट्टी से ऊपर रखने के लिए पौधों को सहारा दें। फल का वज़न बढ़ाने के लिए बचा K₂O और N दें।', 'ಭಾರದ ಗೊಂಚಲುಗಳು ಮಣ್ಣಿಗೆ ತಾಕದಂತೆ ಗಿಡಗಳಿಗೆ ಕೋಲು ಆಸರೆ ಕೊಡಿ. ಕಾಯಿ ತೂಕ ಹೆಚ್ಚಲು ಉಳಿದ K₂O ಮತ್ತು N ಕೊಡಿ.'),
      },
      {
        key: 'protection', from: T + 1, to: D, kind: 'pest',
        text: L('Inspect the underside of leaves for whiteflies and early blight lesions. Give uniform shallow irrigation every 3–4 days to avoid blossom-end rot.', 'पत्तियों के नीचे सफ़ेद मक्खी और अगेती झुलसा के धब्बे देखें। ब्लॉसम-एंड रॉट से बचने के लिए हर 3–4 दिन एक समान हल्की सिंचाई करें।', 'ಎಲೆಗಳ ಕೆಳಭಾಗದಲ್ಲಿ ಬಿಳಿನೊಣ ಮತ್ತು ಆರಂಭಿಕ ಅಂಗಮಾರಿ ಕಲೆ ಪರೀಕ್ಷಿಸಿ. ಹೂ ತುದಿ ಕೊಳೆತ ತಪ್ಪಿಸಲು 3–4 ದಿನಕ್ಕೊಮ್ಮೆ ಸಮವಾಗಿ ಹಗುರ ನೀರು ಕೊಡಿ.'),
      },
      {
        key: 'harvest', from: T + 70, to: D, kind: 'harvest',
        text: L('Pick mature-green or breaker-stage fruits every 4–5 days (staggered harvest).', 'हर 4–5 दिन परिपक्व-हरे या रंग बदलते फल तोड़ें (क्रमिक तुड़ाई)।', '4–5 ದಿನಕ್ಕೊಮ್ಮೆ ಬಲಿತ ಹಸಿರು ಅಥವಾ ಬಣ್ಣ ಬದಲಾಗುವ ಕಾಯಿ ಕೀಳಿ (ಹಂತ ಹಂತದ ಕೊಯ್ಲು).'),
      },
    ],
  },

  paddy: {
    duration: 120,
    range: '115–135',
    T: 22,
    stages: () => [
      { key: 'nursery', start: 0, end: 23, name: L('Wet nursery bed', 'गीली नर्सरी', 'ತೇವ ಸಸಿಮಡಿ') },
      { key: 'tillering', start: 23, end: 51, name: L('Establishment & active tillering', 'स्थापना व कल्ले निकलना', 'ಸ್ಥಾಪನೆ ಮತ್ತು ಕವಲೊಡೆಯುವಿಕೆ') },
      { key: 'panicle', start: 51, end: 76, name: L('Stem elongation & panicle initiation', 'तना बढ़ना व बाली बनना', 'ಕಾಂಡ ಬೆಳವಣಿಗೆ ಮತ್ತು ತೆನೆ ಮೂಡುವಿಕೆ') },
      { key: 'flowering', start: 76, end: 96, name: L('Booting, heading & flowering', 'गोभ, बाली निकलना व फूल', 'ಗರ್ಭ, ತೆನೆ ಮತ್ತು ಹೂ') },
      { key: 'maturity', start: 96, end: 121, name: L('Dough stage & grain hardening', 'दूधिया अवस्था व दाना सख्त होना', 'ಹಾಲುಗಾಳು ಮತ್ತು ಕಾಳು ಗಟ್ಟಿಯಾಗುವಿಕೆ') },
    ],
    recs: ({ T, D }) => [
      {
        key: 'nursery', from: 0, to: T, kind: 'action',
        text: L('Keep the nursery bed moist; top dress urea @ 1 kg per 100 m² only if seedlings yellow. Pull seedlings at 4–5 leaves and plant 2–3 per hill.', 'नर्सरी नम रखें; पौध पीली हो तभी 1 किग्रा यूरिया प्रति 100 वर्ग मी. दें। 4–5 पत्ती पर पौध उखाड़कर प्रति स्थान 2–3 लगाएं।', 'ಸಸಿಮಡಿ ತೇವವಾಗಿರಲಿ; ಸಸಿ ಹಳದಿಯಾದರೆ ಮಾತ್ರ 100 ಚ.ಮೀಗೆ 1 ಕೆಜಿ ಯೂರಿಯಾ ಕೊಡಿ. 4–5 ಎಲೆ ಹಂತದಲ್ಲಿ ಸಸಿ ಕಿತ್ತು ಗುಣಿಗೆ 2–3 ನೆಡಿ.'),
      },
      {
        key: 'tillering', from: T + 20, to: T + 25, kind: 'action',
        text: L('Weed thoroughly. Top dress the second split of N (1/3 of total). Maintain 5 cm continuous submergence.', 'अच्छी तरह निराई करें। N की दूसरी किस्त (कुल का 1/3) दें। लगातार 5 सेमी पानी रखें।', 'ಚೆನ್ನಾಗಿ ಕಳೆ ತೆಗೆಯಿರಿ. N ನ ಎರಡನೇ ಕಂತು (ಒಟ್ಟು 1/3) ಕೊಡಿ. ನಿರಂತರ 5 ಸೆಂ.ಮೀ ನೀರು ನಿಲ್ಲಿಸಿ.'),
      },
      {
        key: 'panicle', from: T + 45, to: T + 55, kind: 'action',
        text: L('Apply the final split of N + 1/2 of the potash. Check the base of hills for brown planthopper (BPH) and keep alleyways open.', 'N की अंतिम किस्त + 1/2 पोटाश दें। पौधों के निचले हिस्से पर भूरा फुदका (BPH) देखें और बीच के रास्ते खुले रखें।', 'N ನ ಕೊನೆಯ ಕಂತು + 1/2 ಪೊಟ್ಯಾಷ್ ಕೊಡಿ. ಗುಣಿಗಳ ಬುಡದಲ್ಲಿ ಕಂದು ಜಿಗಿಹುಳು (BPH) ಪರೀಕ್ಷಿಸಿ, ನಡುವಿನ ದಾರಿ ತೆರೆದಿಡಿ.'),
      },
      {
        key: 'drain', from: D - 13, to: D - 10, kind: 'critical',
        text: L('Drain standing water completely 10–13 days before harvest to hasten uniform maturity.', 'एक समान पकने के लिए कटाई से 10–13 दिन पहले सारा खड़ा पानी निकाल दें।', 'ಸಮವಾಗಿ ಪಕ್ವವಾಗಲು ಕೊಯ್ಲಿಗೆ 10–13 ದಿನ ಮುನ್ನ ನಿಂತ ನೀರನ್ನು ಸಂಪೂರ್ಣ ಬಸಿಯಿರಿ.'),
      },
      {
        key: 'harvest', from: D - 5, to: D + 5, kind: 'harvest',
        text: L('Harvest when 80% of the grains in the panicles have turned golden.', 'जब बालियों के 80% दाने सुनहरे हो जाएं तब कटाई करें।', 'ತೆನೆಗಳ 80% ಕಾಳು ಬಂಗಾರದ ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿದಾಗ ಕೊಯ್ಲು ಮಾಡಿ.'),
      },
    ],
  },

  groundnut: {
    duration: 110,
    range: '100–115',
    stages: () => [
      { key: 'emergence', start: 0, end: 16, name: L('Emergence & early vegetative', 'अंकुरण व प्रारंभिक वृद्धि', 'ಮೊಳಕೆ ಮತ್ತು ಆರಂಭಿಕ ಬೆಳವಣಿಗೆ') },
      { key: 'branching', start: 16, end: 36, name: L('Branching & early flowering', 'शाखाएं व प्रारंभिक फूल', 'ಕವಲು ಮತ್ತು ಆರಂಭಿಕ ಹೂ') },
      { key: 'pegging', start: 36, end: 56, name: L('Pegging', 'सुई बनना', 'ಬಿಳಲು ಇಳಿಯುವಿಕೆ') },
      { key: 'pods', start: 56, end: 91, name: L('Pod enlargement & kernel formation', 'फली व दाना बनना', 'ಕಾಯಿ ಮತ್ತು ಬೀಜ ರಚನೆ') },
      { key: 'maturity', start: 91, end: 111, name: L('Harvest maturity', 'खुदाई योग्य', 'ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧ') },
    ],
    recs: ({ D }) => [
      {
        key: 'weeding', from: 10, to: 15, kind: 'action',
        text: L('Light hoeing and hand weeding around the young plants.', 'छोटे पौधों के आसपास हल्की गुड़ाई और हाथ से निराई।', 'ಎಳೆಯ ಗಿಡಗಳ ಸುತ್ತ ಹಗುರ ಎಡೆಕುಂಟೆ ಮತ್ತು ಕೈ ಕಳೆ.'),
      },
      {
        key: 'gypsum', from: 30, to: 40, kind: 'action',
        text: L('Apply agricultural gypsum/lime @ 1.0–1.5 t/ha (400–600 kg per acre) around the roots with light raking.', 'कृषि जिप्सम/चूना 1.0–1.5 टन/हे. (400–600 किग्रा प्रति एकड़) जड़ों के पास हल्की रेक से मिलाएं।', 'ಕೃಷಿ ಜಿಪ್ಸಂ/ಸುಣ್ಣ 1.0–1.5 ಟ/ಹೆ (ಎಕರೆಗೆ 400–600 ಕೆಜಿ) ಬೇರುಗಳ ಸುತ್ತ ಹಗುರ ಕುಂಟೆಯಿಂದ ಸೇರಿಸಿ.'),
      },
      {
        key: 'noSoil', from: 45, to: D, kind: 'critical',
        text: L('STRICT CEASE OF SOIL DISTURBANCE: do not weed or cultivate after day 45 – the penetrating pegs will sever.', 'मिट्टी को बिल्कुल न छेड़ें: 45वें दिन के बाद निराई या गुड़ाई न करें – मिट्टी में जाती सुइयां कट जाएंगी।', 'ಮಣ್ಣು ಕೆದಕುವುದನ್ನು ಸಂಪೂರ್ಣ ನಿಲ್ಲಿಸಿ: 45ನೇ ದಿನದ ನಂತರ ಕಳೆ ಅಥವಾ ಉಳುಮೆ ಬೇಡ – ಮಣ್ಣಿಗೆ ಇಳಿಯುವ ಬಿಳಲುಗಳು ಕತ್ತರಿಸುತ್ತವೆ.'),
      },
      {
        key: 'pods', from: 45, to: 90, kind: 'pest',
        text: L('Irrigate every 7 days during pod development and check for leaf miner and tikka leaf spot.', 'फली बनते समय हर 7 दिन सिंचाई करें और लीफ माइनर व टिक्का पत्ती धब्बा देखें।', 'ಕಾಯಿ ಬೆಳವಣಿಗೆ ಸಮಯದಲ್ಲಿ 7 ದಿನಕ್ಕೊಮ್ಮೆ ನೀರು ಕೊಟ್ಟು ಎಲೆ ಸುರಂಗ ಹುಳು ಮತ್ತು ಟಿಕ್ಕಾ ಚುಕ್ಕೆ ಪರೀಕ್ಷಿಸಿ.'),
      },
      {
        key: 'harvest', from: D - 15, to: D + 5, kind: 'harvest',
        text: L('Sample 2–3 pods; harvest when the inside of the pod wall turns dark brown.', '2–3 फलियां तोड़कर देखें; छिलके का अंदरूनी भाग गहरा भूरा हो तब खुदाई करें।', '2–3 ಕಾಯಿ ಒಡೆದು ನೋಡಿ; ಸಿಪ್ಪೆಯ ಒಳಭಾಗ ಗಾಢ ಕಂದು ಆದಾಗ ಕೊಯ್ಲು ಮಾಡಿ.'),
      },
    ],
  },
};

/* ───────────── 20-crop knowledge base (KAU Package of Practices 2016 + ICAR baselines) ───────────── */

/** Crop categories used to group the crop picker. */
export const CROP_CATEGORIES = ['cereal', 'millet', 'pulse', 'oilseed', 'commercial', 'plantation', 'spice', 'vegetable'];

/** Shared growth-stage names (translated once, reused across crops). */
export const STAGE_NAMES = {
  emergence: L('Germination & emergence', 'अंकुरण', 'ಮೊಳಕೆ'),
  vegetative: L('Vegetative growth', 'वानस्पतिक वृद्धि', 'ಸಸ್ಯ ಬೆಳವಣಿಗೆ'),
  tillering: L('Tillering', 'कल्ले निकलना', 'ಕವಲೊಡೆಯುವಿಕೆ'),
  jointing: L('Stem elongation & booting', 'तना बढ़ना व गोभ', 'ಕಾಂಡ ಬೆಳವಣಿಗೆ ಮತ್ತು ಗರ್ಭ'),
  heading: L('Heading & flowering', 'बाली व फूल', 'ತೆನೆ ಮತ್ತು ಹೂ'),
  flowering: L('Flowering', 'फूल आना', 'ಹೂ ಬಿಡುವಿಕೆ'),
  podding: L('Pod formation & filling', 'फली बनना व भरना', 'ಕಾಯಿ ಕಟ್ಟುವಿಕೆ ಮತ್ತು ತುಂಬುವಿಕೆ'),
  grainFill: L('Grain filling', 'दाना भरना', 'ಕಾಳು ತುಂಬುವಿಕೆ'),
  maturity: L('Maturity & harvest', 'पकना व कटाई', 'ಪಕ್ವತೆ ಮತ್ತು ಕೊಯ್ಲು'),
  germination: L('Germination', 'अंकुरण', 'ಮೊಳಕೆಯೊಡೆಯುವಿಕೆ'),
  grandGrowth: L('Grand growth', 'तीव्र वृद्धि', 'ತೀವ್ರ ಬೆಳವಣಿಗೆ'),
  ripening: L('Ripening', 'पकना', 'ಹಣ್ಣಾಗುವಿಕೆ'),
  squaring: L('Squaring & flowering', 'कली व फूल', 'ಮೊಗ್ಗು ಮತ್ತು ಹೂ'),
  bolls: L('Boll development & picking', 'टिंडे बनना व चुनाई', 'ಕಾಯಿ ಬೆಳವಣಿಗೆ ಮತ್ತು ಬಿಡಿಸುವಿಕೆ'),
  establish: L('Transplant establishment', 'रोपाई के बाद स्थापना', 'ನಾಟಿ ನಂತರ ಸ್ಥಾಪನೆ'),
  topping: L('Topping & leaf bulking', 'टॉपिंग व पत्ती बढ़वार', 'ಕುಡಿ ಚಿವುಟುವಿಕೆ ಮತ್ತು ಎಲೆ ಬೆಳವಣಿಗೆ'),
  priming: L('Leaf harvest (priming)', 'पत्ती तुड़ाई', 'ಎಲೆ ಕೊಯ್ಲು'),
  dry1: L('Dry season (Jan–Mar)', 'शुष्क मौसम (जन–मार्च)', 'ಒಣ ಹಂಗಾಮು (ಜನ–ಮಾರ್ಚ್)'),
  preMonsoon: L('Pre-monsoon (Apr–May)', 'मानसून-पूर्व (अप्रैल–मई)', 'ಮುಂಗಾರು ಪೂರ್ವ (ಏಪ್ರಿ–ಮೇ)'),
  monsoon: L('SW monsoon (Jun–Sep)', 'दक्षिण-पश्चिम मानसून (जून–सितं)', 'ನೈಋತ್ಯ ಮುಂಗಾರು (ಜೂನ್–ಸೆಪ್ಟೆಂ)'),
  postMonsoon: L('Post-monsoon (Oct–Nov)', 'मानसून-बाद (अक्टू–नवं)', 'ಹಿಂಗಾರು (ಅಕ್ಟೋ–ನವೆಂ)'),
  dry2: L('Dry season (Dec)', 'शुष्क मौसम (दिसं)', 'ಒಣ ಹಂಗಾಮು (ಡಿಸೆಂ)'),
};

/** Stage list from [key, startDas, endDas) tuples using the shared names. */
const stagesOf = (rows) => () => rows.map(([key, start, end]) => ({ key, start, end, name: STAGE_NAMES[key] }));

/** Perennial "stages" are seasons of the calendar year (day-of-year bounds, Jan 1 = 0). */
export const SEASONS = [
  { key: 'dry1', months: [1, 2, 3] },
  { key: 'preMonsoon', months: [4, 5] },
  { key: 'monsoon', months: [6, 7, 8, 9] },
  { key: 'postMonsoon', months: [10, 11] },
  { key: 'dry2', months: [12] },
];
export const seasonForMonth = (m) => SEASONS.find((s) => s.months.includes(m)).key;

/** Profiles for the 15 crops added from the knowledge base (the original 5 are above). */
const KB_CROPS = {
  wheat: {
    category: 'cereal', duration: 120, range: '110–130', spacing: '20–22.5 cm rows',
    stages: stagesOf([['emergence', 0, 21], ['tillering', 21, 50], ['jointing', 50, 75], ['grainFill', 75, 105], ['maturity', 105, 121]]),
  },
  jowar: {
    category: 'millet', duration: 100, range: '90–105', spacing: '45 × 15 cm (2 seeds/hole)',
    stages: stagesOf([['emergence', 0, 20], ['vegetative', 20, 55], ['heading', 55, 75], ['grainFill', 75, 92], ['maturity', 92, 101]]),
  },
  bajra: {
    category: 'millet', duration: 85, range: '80–90', spacing: '45 × 12–15 cm',
    stages: stagesOf([['emergence', 0, 20], ['tillering', 20, 45], ['heading', 45, 60], ['grainFill', 60, 78], ['maturity', 78, 86]]),
  },
  cowpea: {
    category: 'pulse', duration: 75, range: '65–75', spacing: '25 × 15 cm (bush: 30 × 15 cm)',
    stages: stagesOf([['emergence', 0, 15], ['vegetative', 15, 35], ['flowering', 35, 45], ['podding', 45, 65], ['maturity', 65, 76]]),
  },
  blackgram: {
    category: 'pulse', duration: 70, range: '65–75', spacing: '25 × 15 cm',
    stages: stagesOf([['emergence', 0, 15], ['vegetative', 15, 30], ['flowering', 30, 40], ['podding', 40, 62], ['maturity', 62, 71]]),
  },
  greengram: {
    category: 'pulse', duration: 65, range: '60–70', spacing: '25 × 15 cm',
    stages: stagesOf([['emergence', 0, 15], ['vegetative', 15, 28], ['flowering', 28, 38], ['podding', 38, 58], ['maturity', 58, 66]]),
  },
  redgram: {
    category: 'pulse', duration: 160, range: '150–180', spacing: '35 cm rows (or 3 m as intercrop)',
    stages: stagesOf([['emergence', 0, 21], ['vegetative', 21, 75], ['flowering', 75, 110], ['podding', 110, 150], ['maturity', 150, 161]]),
  },
  soybean: {
    category: 'oilseed', duration: 120, range: '110–125', spacing: '45 × 10–20 cm',
    stages: stagesOf([['emergence', 0, 15], ['vegetative', 15, 50], ['flowering', 50, 70], ['podding', 70, 110], ['maturity', 110, 121]]),
  },
  mustard: {
    category: 'oilseed', duration: 110, range: '100–120', spacing: '30 × 10 cm',
    stages: stagesOf([['emergence', 0, 15], ['vegetative', 15, 35], ['flowering', 35, 60], ['podding', 60, 100], ['maturity', 100, 111]]),
  },
  sugarcane: {
    category: 'commercial', duration: 360, range: '330–390', spacing: '75–90 cm furrows (3-bud setts)',
    stages: stagesOf([['germination', 0, 45], ['tillering', 45, 120], ['grandGrowth', 120, 270], ['ripening', 270, 330], ['maturity', 330, 361]]),
  },
  cotton: {
    category: 'commercial', duration: 165, range: '150–180', spacing: '75 × 45 cm (hybrids 120 × 60 cm)',
    stages: stagesOf([['emergence', 0, 20], ['vegetative', 20, 50], ['squaring', 50, 80], ['bolls', 80, 150], ['maturity', 150, 166]]),
  },
  jute: {
    category: 'commercial', duration: 125, range: '120–135', spacing: '30 × 7 cm',
    stages: stagesOf([['emergence', 0, 20], ['vegetative', 20, 50], ['grandGrowth', 50, 100], ['flowering', 100, 115], ['maturity', 115, 126]]),
  },
  tobacco: {
    category: 'commercial', duration: 110, range: '110 (after transplanting)', spacing: '60 × 60 cm', dateIsTransplant: true,
    stages: stagesOf([['establish', 0, 20], ['vegetative', 20, 55], ['topping', 55, 90], ['priming', 90, 111]]),
  },
  coconut: { category: 'plantation', perennial: true, duration: 365, range: 'Perennial', spacing: '7.6 × 7.6 m to 8 × 8 m (170–198 palms/ha)' },
  rubber: { category: 'plantation', perennial: true, duration: 365, range: 'Perennial (tapping from year 7)', spacing: '6.1 × 3.0 m to 6.7 × 3.4 m (445–520 trees/ha)' },
  pepper: { category: 'spice', perennial: true, duration: 365, range: 'Perennial (bearing from year 3)', spacing: '3 × 3 m on live standards' },
};
Object.entries(KB_CROPS).forEach(([id, c]) => {
  CROP_MASTER[id] = c;
});
['paddy', 'maize'].forEach((id) => (CROP_MASTER[id].category = 'cereal'));
CROP_MASTER.ragi.category = 'millet';
CROP_MASTER.groundnut.category = 'oilseed';
CROP_MASTER.tomato.category = 'vegetable';
CROP_MASTER.paddy.spacing = '20 × 15 cm (medium) / 15 × 10 cm (short)';
CROP_MASTER.maize.spacing = '60 × 23 cm';
CROP_MASTER.ragi.spacing = '25 × 15 cm';
CROP_MASTER.groundnut.spacing = '15 × 15 cm';
CROP_MASTER.tomato.spacing = '60 × 60 or 60 × 45 cm';

/** NPK baselines for the knowledge-base crops (kg/ha N : P₂O₅ : K₂O; perennials per plant → per ha). */
Object.assign(NPK_BASELINES, {
  wheat: { crop: 'wheat', N: 120, P: 60, K: 40, name: L('Wheat', 'गेहूं', 'ಗೋಧಿ') },
  jowarIrrigated: { crop: 'jowar', N: 90, P: 45, K: 45, fymT: 5, name: L('Jowar (irrigated)', 'ज्वार (सिंचित)', 'ಜೋಳ (ನೀರಾವರಿ)') },
  jowarRainfed: { crop: 'jowar', N: 45, P: 25, K: 25, fymT: 5, name: L('Jowar (rainfed)', 'ज्वार (वर्षा आधारित)', 'ಜೋಳ (ಮಳೆ ಆಶ್ರಿತ)') },
  bajra: { crop: 'bajra', N: 80, P: 40, K: 40, name: L('Bajra', 'बाजरा', 'ಸಜ್ಜೆ') },
  cowpea: { crop: 'cowpea', N: 20, P: 30, K: 10, extra: L('+ lime 250 kg/ha', '+ चूना 250 किग्रा/हे.', '+ ಸುಣ್ಣ 250 ಕೆಜಿ/ಹೆ'), name: L('Cowpea', 'लोबिया', 'ಅಲಸಂದೆ') },
  blackgram: { crop: 'blackgram', N: 20, P: 30, K: 30, extra: L('+ lime 250 kg/ha', '+ चूना 250 किग्रा/हे.', '+ ಸುಣ್ಣ 250 ಕೆಜಿ/ಹೆ'), name: L('Black gram', 'उड़द', 'ಉದ್ದು') },
  greengram: { crop: 'greengram', N: 20, P: 30, K: 30, extra: L('+ lime 250 kg/ha', '+ चूना 250 किग्रा/हे.', '+ ಸುಣ್ಣ 250 ಕೆಜಿ/ಹೆ'), name: L('Green gram', 'मूंग', 'ಹೆಸರು') },
  redgram: { crop: 'redgram', N: 40, P: 80, K: 0, fymT: 3, extra: L('+ lime 500 kg/ha', '+ चूना 500 किग्रा/हे.', '+ ಸುಣ್ಣ 500 ಕೆಜಿ/ಹೆ'), name: L('Red gram', 'अरहर', 'ತೊಗರಿ') },
  soybean: { crop: 'soybean', N: 20, P: 30, K: 10, name: L('Soybean', 'सोयाबीन', 'ಸೋಯಾಬೀನ್') },
  mustard: { crop: 'mustard', N: 80, P: 40, K: 40, extra: L('+ sulphur 25 kg/ha', '+ गंधक 25 किग्रा/हे.', '+ ಗಂಧಕ 25 ಕೆಜಿ/ಹೆ'), name: L('Rapeseed & mustard', 'सरसों', 'ಸಾಸಿವೆ') },
  sugarcane: { crop: 'sugarcane', N: 165, P: 82.5, K: 82.5, fymT: 10, name: L('Sugarcane', 'गन्ना', 'ಕಬ್ಬು') },
  cotton: { crop: 'cotton', N: 70, P: 35, K: 35, fymT: 12.5, extra: L('35 kg N basal + 35 kg N top dressing', '35 किग्रा N मूल + 35 किग्रा N ऊपरी', '35 ಕೆಜಿ N ಮೂಲ + 35 ಕೆಜಿ N ಮೇಲುಗೊಬ್ಬರ'), name: L('Cotton', 'कपास', 'ಹತ್ತಿ') },
  jute: { crop: 'jute', N: 60, P: 30, K: 30, name: L('Jute', 'जूट', 'ಸೆಣಬು') },
  tobacco: { crop: 'tobacco', N: 100, P: 50, K: 100, fymT: 15, potash: 'sop', extra: L('Use potassium sulphate (SOP), never MOP', 'पोटैशियम सल्फेट (SOP) दें, MOP कभी नहीं', 'ಪೊಟ್ಯಾಷಿಯಂ ಸಲ್ಫೇಟ್ (SOP) ಬಳಸಿ, MOP ಎಂದೂ ಬೇಡ'), name: L('Tobacco', 'तंबाकू', 'ಹೊಗೆಸೊಪ್ಪು') },
  // Per-plant doses converted with a typical density (shown alongside).
  coconut: {
    crop: 'coconut', N: 87.5, P: 56, K: 210, perPlant: L('Per palm per year: 500 g N, 320 g P₂O₅, 1200 g K₂O + 50 kg FYM (175 palms/ha)', 'प्रति पेड़ प्रति वर्ष: 500 ग्राम N, 320 ग्राम P₂O₅, 1200 ग्राम K₂O + 50 किग्रा गोबर खाद (175 पेड़/हे.)', 'ಪ್ರತಿ ಮರಕ್ಕೆ ವರ್ಷಕ್ಕೆ: 500 ಗ್ರಾಂ N, 320 ಗ್ರಾಂ P₂O₅, 1200 ಗ್ರಾಂ K₂O + 50 ಕೆಜಿ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ (175 ಮರ/ಹೆ)'),
    name: L('Coconut', 'नारियल', 'ತೆಂಗು'),
  },
  rubber: { crop: 'rubber', N: 30, P: 30, K: 30, perPlant: L('Per year for tapping trees, in two splits (pre- and post-monsoon)', 'टैपिंग वाले पेड़ों के लिए प्रति वर्ष, दो किस्तों में (मानसून से पहले व बाद)', 'ಟ್ಯಾಪಿಂಗ್ ಮರಗಳಿಗೆ ವರ್ಷಕ್ಕೆ, ಎರಡು ಕಂತುಗಳಲ್ಲಿ (ಮುಂಗಾರು ಮುನ್ನ ಮತ್ತು ನಂತರ)'), name: L('Rubber', 'रबड़', 'ರಬ್ಬರ್') },
  pepper: {
    crop: 'pepper', N: 111, P: 44, K: 156, perPlant: L('Per vine per year: 100 g N, 40 g P₂O₅, 140 g K₂O + 10 kg FYM (≈1,100 vines/ha)', 'प्रति बेल प्रति वर्ष: 100 ग्राम N, 40 ग्राम P₂O₅, 140 ग्राम K₂O + 10 किग्रा गोबर खाद (≈1,100 बेल/हे.)', 'ಪ್ರತಿ ಬಳ್ಳಿಗೆ ವರ್ಷಕ್ಕೆ: 100 ಗ್ರಾಂ N, 40 ಗ್ರಾಂ P₂O₅, 140 ಗ್ರಾಂ K₂O + 10 ಕೆಜಿ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ (≈1,100 ಬಳ್ಳಿ/ಹೆ)'),
    name: L('Black pepper', 'काली मिर्च', 'ಕರಿಮೆಣಸು'),
  },
});

/**
 * Stage list for a crop. Shorter/longer duration variants (e.g. short-duration paddy)
 * scale the reference boundaries to the variant's duration.
 */
export function cropStages(cropId, D) {
  const m = CROP_MASTER[cropId];
  if (!m || m.perennial) return null;
  const stages = m.stages();
  const f = D && D !== m.duration ? D / m.duration : 1;
  if (f === 1) return stages;
  return stages.map((s, i) => ({
    ...s,
    start: i === 0 ? 0 : Math.round(s.start * f),
    end: i === stages.length - 1 ? D + 1 : Math.round(s.end * f),
  }));
}

/** Recommendations for a crop with resolved params { T, D }. */
export function cropRecommendations(cropId, params) {
  const m = CROP_MASTER[cropId];
  if (!m?.recs) return [];
  return m.recs({ T: params?.T ?? m.T ?? 0, D: params?.D ?? m.duration });
}
