/**
 * Cultivation schedules for the 5 core crops, from standard package-of-practices
 * recommendations (TNAU / UAS / KAU agritech guidance). All timings are relative:
 *   - `day`/`end`  → days after sowing (DAS; nursery sowing for transplanted crops)
 *   - `dap`/`dapEnd` → days after transplanting (DAP); converted with the crop's transplant day T
 *   - `fromHarvest` → days before the end of the crop duration D
 * The engine in src/utils/cropSchedule.js turns these into calendar dates for a field.
 *
 * Fertilizer amounts are given per hectare (as in the source) with per-acre equivalents
 * (1 ha = 2.47 acres; urea = 46% N).
 */
const L = (en, hi, kn) => ({ en, hi, kn });

/** Task types (tag colour + icon in the UI). */
export const TASK_TYPES = ['nursery', 'sowing', 'transplanting', 'fertilizer', 'weeding', 'irrigation', 'protection', 'caution', 'harvest', 'other'];

/* ───────────────────────── Paddy ───────────────────────── */
const paddy = {
  sci: 'Oryza sativa',
  establishment: 'transplant',
  defaultVariant: 'medium',
  variants: {
    short: { D: 105, T: 18, tEnd: 20, spacing: '15 × 10 cm', range: '95–115', examples: 'Jyothi, Kairali', name: L('Short duration', 'कम अवधि', 'ಅಲ್ಪಾವಧಿ') },
    medium: { D: 125, T: 20, tEnd: 25, spacing: '20 × 15 cm', range: '115–135', examples: 'Jaya, Uma', name: L('Medium duration', 'मध्यम अवधि', 'ಮಧ್ಯಮಾವಧಿ') },
  },
  phases: ({ T, D }) => [
    { key: 'nursery', start: 0, end: T, name: L('Nursery', 'नर्सरी', 'ಸಸಿಮಡಿ') },
    { key: 'establish', start: T, end: T + 20, name: L('Transplanting & establishment', 'रोपाई व स्थापना', 'ನಾಟಿ ಮತ್ತು ಸ್ಥಾಪನೆ') },
    { key: 'tillering', start: T + 20, end: T + 45, name: L('Active tillering', 'कल्ले निकलना', 'ಕವಲೊಡೆಯುವ ಹಂತ') },
    { key: 'panicle', start: T + 45, end: D - 25, name: L('Panicle initiation & flowering', 'बाली बनना व फूल', 'ತೆನೆ ಮೂಡುವಿಕೆ ಮತ್ತು ಹೂ') },
    { key: 'maturity', start: D - 25, end: D + 5, name: L('Grain filling & maturity', 'दाना भरना व पकना', 'ಕಾಳು ತುಂಬುವಿಕೆ ಮತ್ತು ಪಕ್ವತೆ') },
  ],
  tasks: [
    {
      key: 'nursery', day: 0, type: 'nursery', priority: 'high',
      title: L('Prepare nursery and sow treated seed', 'नर्सरी तैयार करें और उपचारित बीज बोएं', 'ಸಸಿಮಡಿ ಸಿದ್ಧಪಡಿಸಿ ಉಪಚರಿಸಿದ ಬೀಜ ಬಿತ್ತಿ'),
      detail: L(
        'Wet or dry seedbed of about 400 m² per acre (1000 m²/ha). Treat seed with Carbendazim 2 g/kg or Pseudomonas fluorescens 10 g/kg. Mix FYM 1 kg per m² into the bed.',
        'लगभग 400 वर्ग मी. प्रति एकड़ (1000 वर्ग मी./हे.) की गीली या सूखी क्यारी। बीज को कार्बेन्डाज़िम 2 ग्राम/किग्रा या स्यूडोमोनास 10 ग्राम/किग्रा से उपचारित करें। क्यारी में 1 किग्रा प्रति वर्ग मी. गोबर खाद मिलाएं।',
        'ಎಕರೆಗೆ ಸುಮಾರು 400 ಚ.ಮೀ (1000 ಚ.ಮೀ/ಹೆ) ತೇವ ಅಥವಾ ಒಣ ಸಸಿಮಡಿ. ಬೀಜವನ್ನು ಕಾರ್ಬೆಂಡಜಿಮ್ 2 ಗ್ರಾಂ/ಕೆಜಿ ಅಥವಾ ಸ್ಯೂಡೋಮೊನಾಸ್ 10 ಗ್ರಾಂ/ಕೆಜಿ ಯಿಂದ ಉಪಚರಿಸಿ. ಮಡಿಗೆ ಚ.ಮೀಗೆ 1 ಕೆಜಿ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಬೆರೆಸಿ.'
      ),
    },
    {
      key: 'nurseryN', day: 10, type: 'fertilizer', priority: 'normal',
      title: L('Nursery urea – only if seedlings yellow', 'नर्सरी में यूरिया – केवल पौध पीली हो तो', 'ಸಸಿಮಡಿಗೆ ಯೂರಿಯಾ – ಸಸಿ ಹಳದಿಯಾದರೆ ಮಾತ್ರ'),
      detail: L(
        'If seedlings look pale yellow (nitrogen deficiency), top dress urea @ 1 kg per 100 m² of nursery.',
        'पौध हल्की पीली दिखे (नाइट्रोजन की कमी) तो नर्सरी में 1 किग्रा यूरिया प्रति 100 वर्ग मी. डालें।',
        'ಸಸಿಗಳು ತಿಳಿ ಹಳದಿಯಾಗಿದ್ದರೆ (ಸಾರಜನಕ ಕೊರತೆ) ಸಸಿಮಡಿಗೆ 100 ಚ.ಮೀಗೆ 1 ಕೆಜಿ ಯೂರಿಯಾ ಕೊಡಿ.'
      ),
    },
    {
      key: 'transplant', day: 'T', end: 'tEnd', type: 'transplanting', priority: 'critical',
      title: L('Transplant seedlings', 'पौध की रोपाई करें', 'ಸಸಿ ನಾಟಿ ಮಾಡಿ'),
      detail: L(
        'Pull seedlings at the 4–5 leaf stage. Plant 2–3 seedlings per hill at {spacing} ({variant}). Keep 1.5 cm water in the field.',
        '4–5 पत्ती की अवस्था में पौध उखाड़ें। {spacing} ({variant}) पर प्रति स्थान 2–3 पौधे लगाएं। खेत में 1.5 सेमी पानी रखें।',
        '4–5 ಎಲೆ ಹಂತದಲ್ಲಿ ಸಸಿ ಕೀಳಿ. {spacing} ({variant}) ಅಂತರದಲ್ಲಿ ಗುಣಿಗೆ 2–3 ಸಸಿ ನೆಡಿ. ಹೊಲದಲ್ಲಿ 1.5 ಸೆಂ.ಮೀ ನೀರು ಇರಲಿ.'
      ),
    },
    {
      key: 'weed1', dap: 20, dapEnd: 25, type: 'weeding', priority: 'high',
      title: L('Weeding – hand or cono weeder', 'निराई – हाथ या कोनो वीडर से', 'ಕಳೆ ತೆಗೆಯಿರಿ – ಕೈಯಿಂದ ಅಥವಾ ಕೋನೋ ವೀಡರ್'),
      detail: L(
        'Run a cono weeder between rows or weed by hand, pressing weeds into the mud.',
        'कतारों के बीच कोनो वीडर चलाएं या हाथ से निराई कर खरपतवार कीचड़ में दबा दें।',
        'ಸಾಲುಗಳ ನಡುವೆ ಕೋನೋ ವೀಡರ್ ಓಡಿಸಿ ಅಥವಾ ಕೈಯಿಂದ ಕಳೆ ತೆಗೆದು ಕೆಸರಿನಲ್ಲಿ ಒತ್ತಿ.'
      ),
    },
    {
      key: 'n2', dap: 20, dapEnd: 25, type: 'fertilizer', priority: 'high',
      title: L('Second nitrogen split (1/3 of N)', 'नाइट्रोजन की दूसरी किस्त (1/3 N)', 'ಸಾರಜನಕದ ಎರಡನೇ ಕಂತು (1/3 N)'),
      detail: L(
        'Top dress 1/3 of the recommended nitrogen. Use a Leaf Colour Chart – apply when leaves read below 4. Get your dose from the NPK calculator in My Crops.',
        'अनुशंसित नाइट्रोजन का 1/3 ऊपर से डालें। लीफ कलर चार्ट से जांचें – पत्ती 4 से कम हो तो डालें। मात्रा "मेरी फसलें" के NPK कैलकुलेटर से लें।',
        'ಶಿಫಾರಸು ಸಾರಜನಕದ 1/3 ಮೇಲುಗೊಬ್ಬರ ಕೊಡಿ. ಎಲೆ ಬಣ್ಣದ ಪಟ್ಟಿ (LCC) 4 ಕ್ಕಿಂತ ಕಡಿಮೆ ಇದ್ದಾಗ ಕೊಡಿ. ಪ್ರಮಾಣವನ್ನು "ನನ್ನ ಬೆಳೆಗಳು" NPK ಲೆಕ್ಕಾಚಾರದಿಂದ ಪಡೆಯಿರಿ.'
      ),
    },
    {
      key: 'water5', dap: 20, dapEnd: 25, type: 'irrigation', priority: 'normal',
      title: L('Raise water level to 5 cm', 'पानी का स्तर 5 सेमी तक बढ़ाएं', 'ನೀರಿನ ಮಟ್ಟವನ್ನು 5 ಸೆಂ.ಮೀಗೆ ಏರಿಸಿ'),
      detail: L('Increase standing water gradually to 5 cm during active tillering.', 'कल्ले निकलते समय खड़ा पानी धीरे-धीरे 5 सेमी तक बढ़ाएं।', 'ಕವಲೊಡೆಯುವಾಗ ನಿಂತ ನೀರನ್ನು ಕ್ರಮೇಣ 5 ಸೆಂ.ಮೀಗೆ ಏರಿಸಿ.'),
    },
    {
      key: 'n3', dap: 45, dapEnd: 55, type: 'fertilizer', priority: 'high',
      title: L('Final nitrogen + potash at panicle initiation', 'बाली बनते समय अंतिम नाइट्रोजन + पोटाश', 'ತೆನೆ ಮೂಡುವಾಗ ಕೊನೆಯ ಸಾರಜನಕ + ಪೊಟ್ಯಾಷ್'),
      detail: L(
        'Apply the last 1/3 of nitrogen and the remaining 1/2 of potash (K₂O).',
        'नाइट्रोजन का अंतिम 1/3 और बचा हुआ 1/2 पोटाश (K₂O) डालें।',
        'ಸಾರಜನಕದ ಕೊನೆಯ 1/3 ಮತ್ತು ಉಳಿದ 1/2 ಪೊಟ್ಯಾಷ್ (K₂O) ಕೊಡಿ.'
      ),
    },
    {
      key: 'submerge', dap: 45, dapEnd: 55, type: 'irrigation', priority: 'high',
      title: L('Keep 5 cm continuous submergence', 'लगातार 5 सेमी पानी भरा रखें', 'ನಿರಂತರ 5 ಸೆಂ.ಮೀ ನೀರು ನಿಲ್ಲಿಸಿ'),
      detail: L('Do not let the field dry during panicle initiation and flowering.', 'बाली बनने और फूल आने के समय खेत को सूखने न दें।', 'ತೆನೆ ಮೂಡುವ ಮತ್ತು ಹೂ ಬಿಡುವ ಸಮಯದಲ್ಲಿ ಹೊಲ ಒಣಗಲು ಬಿಡಬೇಡಿ.'),
    },
    {
      key: 'drain', fromHarvest: 13, fromHarvestEnd: 10, type: 'irrigation', priority: 'critical',
      title: L('Drain the field before harvest', 'कटाई से पहले खेत का पानी निकालें', 'ಕೊಯ್ಲಿಗೆ ಮುನ್ನ ಹೊಲದ ನೀರು ಬಸಿಯಿರಿ'),
      detail: L(
        'Drain all standing water 10–13 days before harvest so grains ripen evenly.',
        'कटाई से 10–13 दिन पहले सारा खड़ा पानी निकाल दें ताकि दाने एक समान पकें।',
        'ಕಾಳು ಒಂದೇ ರೀತಿ ಪಕ್ವವಾಗಲು ಕೊಯ್ಲಿಗೆ 10–13 ದಿನ ಮುನ್ನ ನಿಂತ ನೀರನ್ನೆಲ್ಲ ಬಸಿಯಿರಿ.'
      ),
    },
    {
      key: 'harvest', fromHarvest: 5, fromHarvestEnd: -5, type: 'harvest', priority: 'critical',
      title: L('Harvest paddy', 'धान की कटाई', 'ಭತ್ತದ ಕೊಯ್ಲು'),
      detail: L('Harvest when 80% of the grains in the panicles have turned golden.', 'जब बालियों के 80% दाने सुनहरे हो जाएं तब कटाई करें।', 'ತೆನೆಗಳ 80% ಕಾಳುಗಳು ಬಂಗಾರದ ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿದಾಗ ಕೊಯ್ಲು ಮಾಡಿ.'),
    },
  ],
};

/* ───────────────────────── Maize ───────────────────────── */
const maize = {
  sci: 'Zea mays',
  establishment: 'direct',
  variants: { std: { D: 100, range: '90–110', examples: 'Ganga, Deccan (hybrids); Kissan, Amber (composites)' } },
  defaultVariant: 'std',
  phases: ({ D }) => [
    { key: 'emergence', start: 0, end: 10, name: L('Sowing & emergence', 'बुवाई व अंकुरण', 'ಬಿತ್ತನೆ ಮತ್ತು ಮೊಳಕೆ') },
    { key: 'earlyVeg', start: 10, end: 30, name: L('Early vegetative', 'प्रारंभिक वृद्धि', 'ಆರಂಭಿಕ ಬೆಳವಣಿಗೆ') },
    { key: 'kneeHigh', start: 30, end: 55, name: L('Knee-high', 'घुटने तक ऊंचाई', 'ಮೊಣಕಾಲು ಎತ್ತರ') },
    { key: 'tassel', start: 55, end: 75, name: L('Tasseling & silking', 'झंडा व रेशा निकलना', 'ತೆನೆ ಗೊಂಚಲು ಮತ್ತು ರೇಷ್ಮೆ') },
    { key: 'maturity', start: 75, end: D + 5, name: L('Grain filling & maturity', 'दाना भरना व पकना', 'ಕಾಳು ತುಂಬುವಿಕೆ ಮತ್ತು ಪಕ್ವತೆ') },
  ],
  tasks: [
    {
      key: 'sow', day: 0, type: 'sowing', priority: 'critical',
      title: L('Prepare ridges and sow', 'मेड़-कूंड बनाकर बुवाई करें', 'ಸಾಲು-ಬೋದು ಮಾಡಿ ಬಿತ್ತನೆ'),
      detail: L('Form ridges and furrows. Dibble 1 seed per hole at 60 × 23 cm spacing.', 'मेड़ और कूंड बनाएं। 60 × 23 सेमी पर प्रति छेद 1 बीज डालें।', 'ಸಾಲು ಮತ್ತು ಬೋದು ಮಾಡಿ. 60 × 23 ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿ ಗುಣಿಗೆ 1 ಬೀಜ ಊರಿ.'),
    },
    {
      key: 'basal', day: 0, type: 'fertilizer', priority: 'high',
      title: L('Basal manure and fertilizer', 'मूल खाद और उर्वरक', 'ಮೂಲ ಗೊಬ್ಬರ ಮತ್ತು ರಸಗೊಬ್ಬರ'),
      detail: L(
        'FYM 25 t/ha (10 t/acre). Basal: full P 65 kg/ha, full K 15 kg/ha and 1/3 N 45 kg/ha – per acre about 26 kg P₂O₅, 6 kg K₂O and 18 kg N.',
        'गोबर खाद 25 टन/हे. (10 टन/एकड़)। मूल खाद: पूरा P 65 किग्रा/हे., पूरा K 15 किग्रा/हे. और 1/3 N 45 किग्रा/हे. – प्रति एकड़ लगभग 26 किग्रा P₂O₅, 6 किग्रा K₂O, 18 किग्रा N।',
        'ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ 25 ಟ/ಹೆ (10 ಟ/ಎಕರೆ). ಮೂಲ: ಪೂರ್ಣ P 65 ಕೆಜಿ/ಹೆ, ಪೂರ್ಣ K 15 ಕೆಜಿ/ಹೆ ಮತ್ತು 1/3 N 45 ಕೆಜಿ/ಹೆ – ಎಕರೆಗೆ ಸುಮಾರು 26 ಕೆಜಿ P₂O₅, 6 ಕೆಜಿ K₂O, 18 ಕೆಜಿ N.'
      ),
    },
    {
      key: 'irr0', day: 0, type: 'irrigation', priority: 'high',
      title: L('Irrigate right after sowing', 'बुवाई के तुरंत बाद सिंचाई', 'ಬಿತ್ತಿದ ತಕ್ಷಣ ನೀರು ಹಾಯಿಸಿ'),
      detail: L('Give the first irrigation immediately after sowing.', 'बुवाई के तुरंत बाद पहली सिंचाई करें।', 'ಬಿತ್ತಿದ ತಕ್ಷಣ ಮೊದಲ ನೀರು ಕೊಡಿ.'),
    },
    {
      key: 'irr3', day: 3, type: 'irrigation', priority: 'normal',
      title: L('Second light irrigation', 'दूसरी हल्की सिंचाई', 'ಎರಡನೇ ಹಗುರ ನೀರಾವರಿ'),
      detail: L('Give a light (life) irrigation on day 3 for even germination.', 'एक समान अंकुरण के लिए तीसरे दिन हल्की सिंचाई करें।', 'ಸಮ ಮೊಳಕೆಗಾಗಿ 3ನೇ ದಿನ ಹಗುರ ನೀರು ಕೊಡಿ.'),
    },
    {
      key: 'hoe', day: 21, type: 'weeding', priority: 'high',
      title: L('First hoeing and weeding', 'पहली गुड़ाई और निराई', 'ಮೊದಲ ಎಡೆಕುಂಟೆ ಮತ್ತು ಕಳೆ ತೆಗೆಯುವುದು'),
      detail: L('Hoe between rows and remove all weeds thoroughly.', 'कतारों के बीच गुड़ाई करें और सभी खरपतवार निकालें।', 'ಸಾಲುಗಳ ನಡುವೆ ಎಡೆಕುಂಟೆ ಹೊಡೆದು ಎಲ್ಲಾ ಕಳೆ ತೆಗೆಯಿರಿ.'),
    },
    {
      key: 'n2', day: 30, end: 40, type: 'fertilizer', priority: 'high',
      title: L('Second nitrogen split (knee-high)', 'नाइट्रोजन की दूसरी किस्त (घुटने तक)', 'ಸಾರಜನಕದ ಎರಡನೇ ಕಂತು (ಮೊಣಕಾಲು ಎತ್ತರ)'),
      detail: L('Top dress 45 kg N/ha – about 40 kg urea per acre – along the rows.', 'कतारों में 45 किग्रा N/हे. – लगभग 40 किग्रा यूरिया प्रति एकड़ – डालें।', 'ಸಾಲುಗಳಲ್ಲಿ 45 ಕೆಜಿ N/ಹೆ – ಎಕರೆಗೆ ಸುಮಾರು 40 ಕೆಜಿ ಯೂರಿಯಾ – ಕೊಡಿ.'),
    },
    {
      key: 'earthUp', day: 30, end: 40, type: 'weeding', priority: 'normal',
      title: L('Earth up and hand weed', 'मिट्टी चढ़ाएं और हाथ से निराई', 'ಮಣ್ಣು ಏರಿಸಿ ಮತ್ತು ಕೈ ಕಳೆ'),
      detail: L('Earth up soil into ridges to anchor the roots, then hand weed.', 'जड़ें मज़बूत करने के लिए मेड़ पर मिट्टी चढ़ाएं, फिर हाथ से निराई करें।', 'ಬೇರು ಗಟ್ಟಿಯಾಗಲು ಸಾಲಿಗೆ ಮಣ್ಣು ಏರಿಸಿ, ನಂತರ ಕೈಯಿಂದ ಕಳೆ ತೆಗೆಯಿರಿ.'),
    },
    {
      key: 'n3', day: 60, end: 70, type: 'fertilizer', priority: 'high',
      title: L('Final nitrogen split at tasseling', 'झंडा निकलते समय अंतिम नाइट्रोजन', 'ತೆನೆ ಗೊಂಚಲು ಹಂತದಲ್ಲಿ ಕೊನೆಯ ಸಾರಜನಕ'),
      detail: L('Apply the last 45 kg N/ha (about 40 kg urea per acre).', 'अंतिम 45 किग्रा N/हे. (लगभग 40 किग्रा यूरिया प्रति एकड़) डालें।', 'ಕೊನೆಯ 45 ಕೆಜಿ N/ಹೆ (ಎಕರೆಗೆ ಸುಮಾರು 40 ಕೆಜಿ ಯೂರಿಯಾ) ಕೊಡಿ.'),
    },
    {
      key: 'irrCritical', day: 60, end: 70, type: 'irrigation', priority: 'critical',
      title: L('Critical irrigation – tasseling & silking', 'महत्वपूर्ण सिंचाई – झंडा व रेशा', 'ಮುಖ್ಯ ನೀರಾವರಿ – ತೆನೆ ಗೊಂಚಲು ಮತ್ತು ರೇಷ್ಮೆ'),
      detail: L('Keep the soil moist. Water stress now sharply cuts grain set.', 'मिट्टी नम रखें। इस समय पानी की कमी से दाने बहुत कम बनते हैं।', 'ಮಣ್ಣು ತೇವವಾಗಿರಲಿ. ಈಗ ನೀರಿನ ಕೊರತೆಯಾದರೆ ಕಾಳು ಕಟ್ಟುವುದು ತೀವ್ರ ಕಡಿಮೆಯಾಗುತ್ತದೆ.'),
    },
    {
      key: 'harvest', day: 90, end: 105, type: 'harvest', priority: 'critical',
      title: L('Harvest maize', 'मक्के की कटाई', 'ಮೆಕ್ಕೆಜೋಳ ಕೊಯ್ಲು'),
      detail: L('Harvest when the husks dry out and grains are firm with clearly falling moisture.', 'जब छिलके सूख जाएं और दाने सख्त हों, नमी साफ़ घटी हो तब कटाई करें।', 'ಸಿಪ್ಪೆ ಒಣಗಿ ಕಾಳು ಗಟ್ಟಿಯಾಗಿ ತೇವಾಂಶ ಕಡಿಮೆಯಾದಾಗ ಕೊಯ್ಲು ಮಾಡಿ.'),
    },
  ],
};

/* ───────────────────────── Ragi ───────────────────────── */
const ragi = {
  sci: 'Eleusine coracana',
  establishment: 'transplant',
  variants: { std: { D: 110, T: 21, range: '100–120', examples: 'GPU-28, ML-365' } },
  defaultVariant: 'std',
  phases: ({ T, D }) => [
    { key: 'nursery', start: 0, end: T, name: L('Nursery', 'नर्सरी', 'ಸಸಿಮಡಿ') },
    { key: 'establish', start: T, end: T + 21, name: L('Transplanting & establishment', 'रोपाई व स्थापना', 'ನಾಟಿ ಮತ್ತು ಸ್ಥಾಪನೆ') },
    { key: 'tillering', start: T + 21, end: T + 50, name: L('Tillering', 'कल्ले निकलना', 'ಕವಲೊಡೆಯುವ ಹಂತ') },
    { key: 'heading', start: T + 50, end: 95, name: L('Heading & flowering', 'बाली व फूल', 'ತೆನೆ ಮತ್ತು ಹೂ') },
    { key: 'maturity', start: 95, end: D + 5, name: L('Grain filling & maturity', 'दाना भरना व पकना', 'ಕಾಳು ತುಂಬುವಿಕೆ ಮತ್ತು ಪಕ್ವತೆ') },
  ],
  tasks: [
    {
      key: 'nursery', day: 0, type: 'nursery', priority: 'high',
      title: L('Raise the ragi nursery', 'रागी की नर्सरी डालें', 'ರಾಗಿ ಸಸಿಮಡಿ ಮಾಡಿ'),
      detail: L('Nursery of about 200 m² per acre (480 m²/ha). Apply FYM @ 5 t/ha (2 t/acre).', 'लगभग 200 वर्ग मी. प्रति एकड़ (480 वर्ग मी./हे.) नर्सरी। गोबर खाद 5 टन/हे. (2 टन/एकड़) डालें।', 'ಎಕರೆಗೆ ಸುಮಾರು 200 ಚ.ಮೀ (480 ಚ.ಮೀ/ಹೆ) ಸಸಿಮಡಿ. ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ 5 ಟ/ಹೆ (2 ಟ/ಎಕರೆ) ಕೊಡಿ.'),
    },
    {
      key: 'nurseryN', day: 14, type: 'fertilizer', priority: 'normal',
      title: L('Nursery top dressing', 'नर्सरी में ऊपरी खाद', 'ಸಸಿಮಡಿಗೆ ಮೇಲುಗೊಬ್ಬರ'),
      detail: L('Apply ammonium sulphate @ 1 kg per 100 m², one week before pulling seedlings.', 'पौध उखाड़ने से एक सप्ताह पहले 1 किग्रा अमोनियम सल्फेट प्रति 100 वर्ग मी. डालें।', 'ಸಸಿ ಕೀಳುವ ಒಂದು ವಾರ ಮುನ್ನ 100 ಚ.ಮೀಗೆ 1 ಕೆಜಿ ಅಮೋನಿಯಂ ಸಲ್ಫೇಟ್ ಕೊಡಿ.'),
    },
    {
      key: 'transplant', day: 'T', type: 'transplanting', priority: 'critical',
      title: L('Transplant 3-week-old seedlings', '3 सप्ताह की पौध की रोपाई', '3 ವಾರದ ಸಸಿ ನಾಟಿ'),
      detail: L('Transplant at 25 × 15 cm spacing.', '25 × 15 सेमी की दूरी पर रोपाई करें।', '25 × 15 ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿ ನಾಟಿ ಮಾಡಿ.'),
    },
    {
      key: 'basal', day: 'T', type: 'fertilizer', priority: 'high',
      title: L('Basal fertilizer at transplanting', 'रोपाई पर मूल खाद', 'ನಾಟಿ ವೇಳೆ ಮೂಲ ಗೊಬ್ಬರ'),
      detail: L('Full P₂O₅ 22.5, full K₂O 22.5 and N 22.5 kg/ha – about 9 kg of each per acre.', 'पूरा P₂O₅ 22.5, पूरा K₂O 22.5 और N 22.5 किग्रा/हे. – प्रत्येक लगभग 9 किग्रा प्रति एकड़।', 'ಪೂರ್ಣ P₂O₅ 22.5, ಪೂರ್ಣ K₂O 22.5 ಮತ್ತು N 22.5 ಕೆಜಿ/ಹೆ – ಎಕರೆಗೆ ತಲಾ ಸುಮಾರು 9 ಕೆಜಿ.'),
    },
    {
      key: 'irrT', day: 'T', type: 'irrigation', priority: 'high',
      title: L('Irrigate on planting day', 'रोपाई के दिन सिंचाई', 'ನಾಟಿ ದಿನ ನೀರು ಹಾಯಿಸಿ'),
      detail: L('Irrigate the field on the day of transplanting.', 'रोपाई वाले दिन खेत की सिंचाई करें।', 'ನಾಟಿ ಮಾಡಿದ ದಿನವೇ ಹೊಲಕ್ಕೆ ನೀರು ಕೊಡಿ.'),
    },
    {
      key: 'weed1', dap: 21, type: 'weeding', priority: 'high',
      title: L('First hand weeding', 'पहली हाथ से निराई', 'ಮೊದಲ ಕೈ ಕಳೆ'),
      detail: L('Hand weed thoroughly, then top dress nitrogen the same day.', 'अच्छी तरह हाथ से निराई करें, फिर उसी दिन नाइट्रोजन डालें।', 'ಚೆನ್ನಾಗಿ ಕೈ ಕಳೆ ತೆಗೆದು ಅದೇ ದಿನ ಸಾರಜನಕ ಕೊಡಿ.'),
    },
    {
      key: 'n2', dap: 21, type: 'fertilizer', priority: 'high',
      title: L('Top dress nitrogen', 'नाइट्रोजन की ऊपरी खाद', 'ಸಾರಜನಕ ಮೇಲುಗೊಬ್ಬರ'),
      detail: L('Right after weeding, apply 22.5 kg N/ha (about 20 kg urea per acre).', 'निराई के तुरंत बाद 22.5 किग्रा N/हे. (लगभग 20 किग्रा यूरिया प्रति एकड़) डालें।', 'ಕಳೆ ತೆಗೆದ ತಕ್ಷಣ 22.5 ಕೆಜಿ N/ಹೆ (ಎಕರೆಗೆ ಸುಮಾರು 20 ಕೆಜಿ ಯೂರಿಯಾ) ಕೊಡಿ.'),
    },
    {
      key: 'irrWeekly', dap: 50, dapEnd: 60, repeat: 7, type: 'irrigation', priority: 'high',
      title: L('Weekly irrigation – heading & flowering', 'साप्ताहिक सिंचाई – बाली व फूल', 'ವಾರದ ನೀರಾವರಿ – ತೆನೆ ಮತ್ತು ಹೂ'),
      detail: L('Irrigate every week during ear emergence and grain filling; do not let the soil crack.', 'बाली निकलने और दाना भरने के समय हर सप्ताह सिंचाई करें; मिट्टी फटने न दें।', 'ತೆನೆ ಮೂಡುವ ಮತ್ತು ಕಾಳು ತುಂಬುವಾಗ ವಾರಕ್ಕೊಮ್ಮೆ ನೀರು ಕೊಡಿ; ಮಣ್ಣು ಬಿರುಕು ಬಿಡದಿರಲಿ.'),
    },
    {
      key: 'harvest', day: 95, end: 115, type: 'harvest', priority: 'critical',
      title: L('Harvest ragi', 'रागी की कटाई', 'ರಾಗಿ ಕೊಯ್ಲು'),
      detail: L(
        'Harvest when earheads turn yellowish-brown. Cut the earheads, heap them under ragi straw for 2–3 days, then thresh.',
        'जब बालियां पीली-भूरी हो जाएं तब कटाई करें। बालियां काटकर 2–3 दिन रागी के भूसे के नीचे ढेर करें, फिर गहाई करें।',
        'ತೆನೆಗಳು ಹಳದಿ-ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿದಾಗ ಕೊಯ್ಲು ಮಾಡಿ. ತೆನೆ ಕತ್ತರಿಸಿ ರಾಗಿ ಹುಲ್ಲಿನ ಕೆಳಗೆ 2–3 ದಿನ ರಾಶಿ ಹಾಕಿ, ನಂತರ ಒಕ್ಕಣೆ ಮಾಡಿ.'
      ),
    },
  ],
};

/* ───────────────────────── Groundnut ───────────────────────── */
const groundnut = {
  sci: 'Arachis hypogaea',
  establishment: 'direct',
  variants: { std: { D: 110, range: '100–115', examples: 'TMV-2, TMV-7, TG-3, TG-14' } },
  defaultVariant: 'std',
  phases: ({ D }) => [
    { key: 'emergence', start: 0, end: 15, name: L('Sowing & emergence', 'बुवाई व अंकुरण', 'ಬಿತ್ತನೆ ಮತ್ತು ಮೊಳಕೆ') },
    { key: 'vegetative', start: 15, end: 30, name: L('Vegetative', 'वानस्पतिक वृद्धि', 'ಸಸ್ಯ ಬೆಳವಣಿಗೆ') },
    { key: 'pegging', start: 30, end: 45, name: L('Flowering & pegging', 'फूल व सुई बनना', 'ಹೂ ಮತ್ತು ಬಿಳಲು ಇಳಿಯುವಿಕೆ') },
    { key: 'pods', start: 45, end: 90, name: L('Pod development', 'फली बनना', 'ಕಾಯಿ ಬೆಳವಣಿಗೆ') },
    { key: 'maturity', start: 90, end: D + 5, name: L('Maturity', 'पकना', 'ಪಕ್ವತೆ') },
  ],
  /** Rules that apply over a period rather than on one day. */
  constraints: [
    {
      key: 'noSoil', from: 45, to: 'D',
      title: L('Do not disturb the soil', 'मिट्टी को न छेड़ें', 'ಮಣ್ಣನ್ನು ಕೆದಕಬೇಡಿ'),
      detail: L(
        'Pegs are entering the soil: no weeding, raking or hoeing until harvest – it breaks the pegs and cuts yield.',
        'सुइयां मिट्टी में जा रही हैं: कटाई तक निराई, रेक या गुड़ाई न करें – इससे सुइयां टूटती हैं और उपज घटती है।',
        'ಬಿಳಲುಗಳು ಮಣ್ಣಿಗೆ ಇಳಿಯುತ್ತಿವೆ: ಕೊಯ್ಲಿನವರೆಗೆ ಕಳೆ, ಕುಂಟೆ, ಎಡೆಕುಂಟೆ ಬೇಡ – ಬಿಳಲು ಮುರಿದು ಇಳುವರಿ ಕುಸಿಯುತ್ತದೆ.'
      ),
    },
  ],
  tasks: [
    {
      key: 'sow', day: 0, type: 'sowing', priority: 'critical',
      title: L('Prepare land and sow treated seed', 'खेत तैयार कर उपचारित बीज बोएं', 'ಹೊಲ ಸಿದ್ಧಪಡಿಸಿ ಉಪಚರಿಸಿದ ಬೀಜ ಬಿತ್ತಿ'),
      detail: L(
        'Plough to a fine tilth. Treat seed with Rhizobium. Dibble seeds in furrows at 15 × 15 cm.',
        'खेत की बारीक जुताई करें। बीज को राइज़ोबियम से उपचारित करें। कूंड में 15 × 15 सेमी पर बीज डालें।',
        'ಹೊಲವನ್ನು ನುಣ್ಣಗೆ ಉಳುಮೆ ಮಾಡಿ. ಬೀಜವನ್ನು ರೈಜೋಬಿಯಂನಿಂದ ಉಪಚರಿಸಿ. ಸಾಲಿನಲ್ಲಿ 15 × 15 ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿ ಬೀಜ ಊರಿ.'
      ),
    },
    {
      key: 'basal', day: 0, type: 'fertilizer', priority: 'high',
      title: L('Basal manure and fertilizer', 'मूल खाद और उर्वरक', 'ಮೂಲ ಗೊಬ್ಬರ ಮತ್ತು ರಸಗೊಬ್ಬರ'),
      detail: L(
        'FYM 2 t/ha (0.8 t/acre) + N:P:K 10:75:75 kg/ha (about 4:30:30 kg per acre).',
        'गोबर खाद 2 टन/हे. (0.8 टन/एकड़) + N:P:K 10:75:75 किग्रा/हे. (लगभग 4:30:30 किग्रा प्रति एकड़)।',
        'ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ 2 ಟ/ಹೆ (0.8 ಟ/ಎಕರೆ) + N:P:K 10:75:75 ಕೆಜಿ/ಹೆ (ಎಕರೆಗೆ ಸುಮಾರು 4:30:30 ಕೆಜಿ).'
      ),
    },
    {
      key: 'weed1', day: 10, end: 15, type: 'weeding', priority: 'high',
      title: L('Light hoeing and hand weeding', 'हल्की गुड़ाई और हाथ से निराई', 'ಹಗುರ ಎಡೆಕುಂಟೆ ಮತ್ತು ಕೈ ಕಳೆ'),
      detail: L('Hoe lightly and hand weed around the young plants.', 'छोटे पौधों के आसपास हल्की गुड़ाई और हाथ से निराई करें।', 'ಎಳೆಯ ಗಿಡಗಳ ಸುತ್ತ ಹಗುರವಾಗಿ ಎಡೆಕುಂಟೆ ಹೊಡೆದು ಕೈಯಿಂದ ಕಳೆ ತೆಗೆಯಿರಿ.'),
    },
    {
      key: 'lime', day: 30, end: 40, type: 'fertilizer', priority: 'high',
      title: L('Apply lime at flowering & pegging', 'फूल व सुई बनते समय चूना डालें', 'ಹೂ ಮತ್ತು ಬಿಳಲು ಹಂತದಲ್ಲಿ ಸುಣ್ಣ ಕೊಡಿ'),
      detail: L(
        'Top dress agricultural lime @ 1.0–1.5 t/ha (400–600 kg per acre) and mix it in lightly with shallow raking.',
        'कृषि चूना 1.0–1.5 टन/हे. (400–600 किग्रा प्रति एकड़) डालें और हल्की रेक से ऊपरी मिट्टी में मिलाएं।',
        'ಕೃಷಿ ಸುಣ್ಣ 1.0–1.5 ಟ/ಹೆ (ಎಕರೆಗೆ 400–600 ಕೆಜಿ) ಮೇಲುಗೊಬ್ಬರವಾಗಿ ಕೊಟ್ಟು ಹಗುರ ಕುಂಟೆಯಿಂದ ಮಣ್ಣಿಗೆ ಸೇರಿಸಿ.'
      ),
    },
    {
      key: 'stopSoil', day: 45, type: 'caution', priority: 'critical',
      title: L('STOP all soil disturbance from today', 'आज से मिट्टी में कोई काम बंद करें', 'ಇಂದಿನಿಂದ ಮಣ್ಣು ಕೆದಕುವುದು ಸಂಪೂರ್ಣ ನಿಲ್ಲಿಸಿ'),
      detail: L(
        'Pegs are entering the soil. Do not weed, rake or hoe after day 45 – it severs the pegs and drops yield.',
        'सुइयां मिट्टी में जा रही हैं। 45वें दिन के बाद निराई, रेक या गुड़ाई न करें – इससे सुइयां कटती हैं और उपज गिरती है।',
        'ಬಿಳಲುಗಳು ಮಣ್ಣಿಗೆ ಇಳಿಯುತ್ತಿವೆ. 45ನೇ ದಿನದ ನಂತರ ಕಳೆ, ಕುಂಟೆ, ಎಡೆಕುಂಟೆ ಬೇಡ – ಬಿಳಲು ಕತ್ತರಿಸಿ ಇಳುವರಿ ಕುಸಿಯುತ್ತದೆ.'
      ),
    },
    {
      key: 'irrWeekly', day: 45, end: 90, repeat: 7, type: 'irrigation', priority: 'high',
      title: L('Irrigate – 7-day cycle', 'सिंचाई – 7 दिन का चक्र', 'ನೀರಾವರಿ – 7 ದಿನದ ಚಕ್ರ'),
      detail: L('Irrigate every 7 days during pod development. Do not disturb the soil.', 'फली बनते समय हर 7 दिन सिंचाई करें। मिट्टी को न छेड़ें।', 'ಕಾಯಿ ಬೆಳವಣಿಗೆ ಸಮಯದಲ್ಲಿ 7 ದಿನಕ್ಕೊಮ್ಮೆ ನೀರು ಕೊಡಿ. ಮಣ್ಣು ಕೆದಕಬೇಡಿ.'),
    },
    {
      key: 'scout', day: 50, end: 90, repeat: 15, type: 'protection', priority: 'normal',
      title: L('Check for leaf miner and tikka leaf spot', 'लीफ माइनर और टिक्का पत्ती धब्बा जांचें', 'ಎಲೆ ಸುರಂಗ ಹುಳು ಮತ್ತು ಟಿಕ್ಕಾ ಎಲೆ ಚುಕ್ಕೆ ಪರೀಕ್ಷಿಸಿ'),
      detail: L(
        'Look for mined or folded leaves and dark brown spots (tikka). Act early – see Crop Doctor.',
        'सुरंग वाली या मुड़ी पत्तियां और गहरे भूरे धब्बे (टिक्का) देखें। जल्दी उपाय करें – फसल डॉक्टर देखें।',
        'ಸುರಂಗ ಅಥವಾ ಮಡಚಿದ ಎಲೆ ಮತ್ತು ಗಾಢ ಕಂದು ಚುಕ್ಕೆ (ಟಿಕ್ಕಾ) ನೋಡಿ. ಬೇಗ ಕ್ರಮ ಕೈಗೊಳ್ಳಿ – ಬೆಳೆ ವೈದ್ಯ ನೋಡಿ.'
      ),
    },
    {
      key: 'harvest', day: 100, end: 115, type: 'harvest', priority: 'critical',
      title: L('Harvest groundnut', 'मूंगफली की खुदाई', 'ಕಡಲೆಕಾಯಿ ಕೊಯ್ಲು'),
      detail: L('Harvest when leaves turn yellow and the inside of the pod shell is dark brown.', 'जब पत्तियां पीली हों और छिलके का अंदरूनी भाग गहरा भूरा हो तब खुदाई करें।', 'ಎಲೆಗಳು ಹಳದಿಯಾಗಿ ಸಿಪ್ಪೆಯ ಒಳಭಾಗ ಗಾಢ ಕಂದು ಬಣ್ಣ ತೋರಿದಾಗ ಕೊಯ್ಲು ಮಾಡಿ.'),
    },
  ],
};

/* ───────────────────────── Tomato ───────────────────────── */
const tomato = {
  sci: 'Solanum lycopersicum',
  establishment: 'transplant',
  // Field life ≈ 120 days after transplanting (110–135 days for the main crop).
  variants: { std: { D: 145, T: 25, tEnd: 30, range: '110–135', examples: 'Arka Rakshak, Arka Samrat' } },
  defaultVariant: 'std',
  phases: ({ T, D }) => [
    { key: 'nursery', start: 0, end: T, name: L('Nursery', 'नर्सरी', 'ಸಸಿಮಡಿ') },
    { key: 'establish', start: T, end: T + 20, name: L('Transplanting & establishment', 'रोपाई व स्थापना', 'ನಾಟಿ ಮತ್ತು ಸ್ಥಾಪನೆ') },
    { key: 'vegetative', start: T + 20, end: T + 40, name: L('Active vegetative', 'तेज़ वृद्धि', 'ಚುರುಕು ಬೆಳವಣಿಗೆ') },
    { key: 'flowering', start: T + 40, end: T + 70, name: L('Flowering & fruit set', 'फूल व फल लगना', 'ಹೂ ಮತ್ತು ಕಾಯಿ ಕಟ್ಟುವಿಕೆ') },
    { key: 'harvest', start: T + 70, end: D + 1, name: L('Fruiting & staggered harvest', 'फल व क्रमिक तुड़ाई', 'ಕಾಯಿ ಮತ್ತು ಹಂತ ಹಂತದ ಕೊಯ್ಲು') },
  ],
  tasks: [
    {
      key: 'nursery', day: 0, type: 'nursery', priority: 'high',
      title: L('Raise nursery on raised beds', 'उठी क्यारियों पर नर्सरी डालें', 'ಎತ್ತರಿಸಿದ ಮಡಿಯಲ್ಲಿ ಸಸಿಮಡಿ'),
      detail: L('Sow on raised beds. Treat seed with Trichoderma (4 g/kg) or Pseudomonas (10 g/kg).', 'उठी क्यारियों पर बुवाई करें। बीज को ट्राइकोडर्मा (4 ग्राम/किग्रा) या स्यूडोमोनास (10 ग्राम/किग्रा) से उपचारित करें।', 'ಎತ್ತರಿಸಿದ ಮಡಿಯಲ್ಲಿ ಬಿತ್ತಿ. ಬೀಜವನ್ನು ಟ್ರೈಕೋಡರ್ಮಾ (4 ಗ್ರಾಂ/ಕೆಜಿ) ಅಥವಾ ಸ್ಯೂಡೋಮೊನಾಸ್ (10 ಗ್ರಾಂ/ಕೆಜಿ) ಯಿಂದ ಉಪಚರಿಸಿ.'),
    },
    {
      key: 'transplant', day: 'T', end: 'tEnd', type: 'transplanting', priority: 'critical',
      title: L('Transplant 1-month-old seedlings', '1 महीने की पौध की रोपाई', '1 ತಿಂಗಳ ಸಸಿ ನಾಟಿ'),
      detail: L('Use vigorous seedlings. Spacing 60 × 60 cm or 60 × 45 cm.', 'स्वस्थ पौध लगाएं। दूरी 60 × 60 सेमी या 60 × 45 सेमी।', 'ಆರೋಗ್ಯಕರ ಸಸಿ ಬಳಸಿ. ಅಂತರ 60 × 60 ಅಥವಾ 60 × 45 ಸೆಂ.ಮೀ.'),
    },
    {
      key: 'basal', day: 'T', end: 'tEnd', type: 'fertilizer', priority: 'high',
      title: L('Basal manure and fertilizer', 'मूल खाद और उर्वरक', 'ಮೂಲ ಗೊಬ್ಬರ ಮತ್ತು ರಸಗೊಬ್ಬರ'),
      detail: L(
        'FYM 20–25 t/ha (8–10 t/acre) + 50% of N + 100% of P + 50% of K at planting. Get the dose from the NPK calculator in My Crops.',
        'रोपाई पर गोबर खाद 20–25 टन/हे. (8–10 टन/एकड़) + 50% N + 100% P + 50% K। मात्रा "मेरी फसलें" के NPK कैलकुलेटर से लें।',
        'ನಾಟಿ ವೇಳೆ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ 20–25 ಟ/ಹೆ (8–10 ಟ/ಎಕರೆ) + 50% N + 100% P + 50% K. ಪ್ರಮಾಣವನ್ನು "ನನ್ನ ಬೆಳೆಗಳು" NPK ಲೆಕ್ಕಾಚಾರದಿಂದ ಪಡೆಯಿರಿ.'
      ),
    },
    {
      key: 'irrT', day: 'T', end: 'tEnd', type: 'irrigation', priority: 'high',
      title: L('Deep irrigation after transplanting', 'रोपाई के बाद गहरी सिंचाई', 'ನಾಟಿ ನಂತರ ಆಳವಾದ ನೀರಾವರಿ'),
      detail: L('Give a deep irrigation immediately after transplanting.', 'रोपाई के तुरंत बाद गहरी सिंचाई करें।', 'ನಾಟಿ ಮಾಡಿದ ತಕ್ಷಣ ಆಳವಾಗಿ ನೀರು ಕೊಡಿ.'),
    },
    {
      key: 'weed1', dap: 20, dapEnd: 25, type: 'weeding', priority: 'high',
      title: L('Hand weeding and light earthing up', 'हाथ से निराई और हल्की मिट्टी चढ़ाना', 'ಕೈ ಕಳೆ ಮತ್ತು ಹಗುರ ಮಣ್ಣು ಏರಿಸುವುದು'),
      detail: L('First hand weeding, then earth up lightly around the stems.', 'पहली हाथ से निराई करें, फिर तनों के पास हल्की मिट्टी चढ़ाएं।', 'ಮೊದಲ ಕೈ ಕಳೆ ತೆಗೆದು ಕಾಂಡದ ಸುತ್ತ ಹಗುರವಾಗಿ ಮಣ್ಣು ಏರಿಸಿ.'),
    },
    {
      key: 'n2', dap: 20, dapEnd: 25, type: 'fertilizer', priority: 'high',
      title: L('Top dress 25% of nitrogen', '25% नाइट्रोजन की ऊपरी खाद', '25% ಸಾರಜನಕ ಮೇಲುಗೊಬ್ಬರ'),
      detail: L('Apply 25% of the recommended nitrogen as top dressing.', 'अनुशंसित नाइट्रोजन का 25% ऊपर से डालें।', 'ಶಿಫಾರಸು ಸಾರಜನಕದ 25% ಮೇಲುಗೊಬ್ಬರವಾಗಿ ಕೊಡಿ.'),
    },
    {
      key: 'n3', dap: 40, dapEnd: 50, type: 'fertilizer', priority: 'high',
      title: L('Top dress last 25% N + 50% K', 'अंतिम 25% N + 50% K डालें', 'ಕೊನೆಯ 25% N + 50% K ಕೊಡಿ'),
      detail: L('Apply the remaining 25% of nitrogen and the remaining 50% of potash.', 'बची हुई 25% नाइट्रोजन और बचा हुआ 50% पोटाश डालें।', 'ಉಳಿದ 25% ಸಾರಜನಕ ಮತ್ತು ಉಳಿದ 50% ಪೊಟ್ಯಾಷ್ ಕೊಡಿ.'),
    },
    {
      key: 'staking', dap: 40, dapEnd: 50, type: 'other', priority: 'high',
      title: L('Stake the plants', 'पौधों को सहारा दें', 'ಗಿಡಗಳಿಗೆ ಕೋಲು ಆಸರೆ ಕೊಡಿ'),
      detail: L('Support plants with stakes so heavy fruit branches stay off the damp soil.', 'डंडियों से सहारा दें ताकि फलों से भरी डालियां गीली मिट्टी को न छुएं।', 'ಕಾಯಿ ತುಂಬಿದ ಕೊಂಬೆಗಳು ತೇವದ ಮಣ್ಣಿಗೆ ತಾಕದಂತೆ ಕೋಲಿನ ಆಸರೆ ಕೊಡಿ.'),
    },
    {
      key: 'irrRegular', dap: 70, dapEnd: 120, repeat: 4, type: 'irrigation', priority: 'normal',
      title: L('Light irrigation (every 3–4 days)', 'हल्की सिंचाई (हर 3–4 दिन)', 'ಹಗುರ ನೀರಾವರಿ (3–4 ದಿನಕ್ಕೊಮ್ಮೆ)'),
      detail: L('Give regular shallow irrigation every 3–4 days during fruiting.', 'फल लगने के समय हर 3–4 दिन हल्की सिंचाई करें।', 'ಕಾಯಿ ಬಿಡುವಾಗ 3–4 ದಿನಕ್ಕೊಮ್ಮೆ ಹಗುರವಾಗಿ ನೀರು ಕೊಡಿ.'),
    },
    {
      key: 'pick', dap: 70, dapEnd: 120, repeat: 5, type: 'harvest', priority: 'high',
      title: L('Pick mature fruits', 'पके फल तोड़ें', 'ಬಲಿತ ಕಾಯಿ ಕೀಳಿ'),
      detail: L('Selectively pick mature-green or breaker-stage fruits.', 'परिपक्व-हरे या रंग बदलते फल चुनकर तोड़ें।', 'ಬಲಿತ ಹಸಿರು ಅಥವಾ ಬಣ್ಣ ಬದಲಾಗುವ ಹಂತದ ಕಾಯಿಗಳನ್ನು ಆಯ್ದು ಕೀಳಿ.'),
    },
  ],
};

export const cropSchedules = { paddy, maize, ragi, groundnut, tomato };

/** Resolved parameters for a field: D (duration, DAS), T (transplant day) etc. */
export function scheduleParams(field) {
  const s = cropSchedules[field?.cropId];
  if (!s) return null;
  const variantKey = s.variants[field.variant] ? field.variant : s.defaultVariant;
  const v = s.variants[variantKey];
  return { ...v, variantKey, T: v.T ?? 0, tEnd: v.tEnd ?? v.T ?? 0 };
}

/** Phase list with day bounds for a field, or null when the crop has no schedule. */
export function schedulePhases(field) {
  const p = scheduleParams(field);
  return p ? cropSchedules[field.cropId].phases(p) : null;
}
