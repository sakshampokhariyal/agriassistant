/**
 * Reference data for the Community tab: helplines, fertilizer recommendations and pest/disease guides.
 * Sources: Govt. of India helplines; soil-fertility ratings per the standard Soil Health Card
 * classification; recommended doses from UAS Bangalore package of practices; pest guidance
 * summarised from ICAR / UAS extension material. Always confirm locally.
 */
import { HA_PER_ACRE, NPK_BASELINES } from './cropMasterData';

const L = (en, hi, kn) => ({ en, hi, kn });

/* ───────────── Helplines ───────────── */
export const helplines = [
  {
    id: 'kcc',
    tone: 'emerald',
    numbers: [{ label: '1800-180-1551', tel: '18001801551' }],
    title: L('Kisan Call Centre', 'किसान कॉल सेंटर', 'ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್'),
    desc: L('Free farming advice from experts in your language.', 'आपकी भाषा में विशेषज्ञों से मुफ़्त खेती सलाह।', 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ತಜ್ಞರಿಂದ ಉಚಿತ ಕೃಷಿ ಸಲಹೆ.'),
    hours: L('6 AM – 10 PM, all days', 'सुबह 6 – रात 10, सभी दिन', 'ಬೆಳಿಗ್ಗೆ 6 – ರಾತ್ರಿ 10, ಎಲ್ಲಾ ದಿನ'),
  },
  {
    id: 'pmfby',
    tone: 'amber',
    numbers: [{ label: '14447', tel: '14447' }],
    title: L('Crop Insurance – Krishi Rakshak', 'फसल बीमा – कृषि रक्षक', 'ಬೆಳೆ ವಿಮೆ – ಕೃಷಿ ರಕ್ಷಕ'),
    desc: L('Report crop loss (PMFBY) within 72 hours and raise insurance complaints.', 'फसल नुकसान (PMFBY) की 72 घंटे में सूचना दें और बीमा शिकायत दर्ज करें।', 'ಬೆಳೆ ನಷ್ಟವನ್ನು (PMFBY) 72 ಗಂಟೆಗಳೊಳಗೆ ತಿಳಿಸಿ ಮತ್ತು ವಿಮಾ ದೂರು ನೀಡಿ.'),
    hours: L('Toll-free', 'निःशुल्क', 'ಉಚಿತ'),
  },
  {
    id: 'disaster',
    tone: 'red',
    numbers: [
      { label: '1070', tel: '1070', note: L('State', 'राज्य', 'ರಾಜ್ಯ') },
      { label: '1077', tel: '1077', note: L('District', 'ज़िला', 'ಜಿಲ್ಲೆ') },
    ],
    title: L('Disaster Control Room', 'आपदा नियंत्रण कक्ष', 'ವಿಪತ್ತು ನಿಯಂತ್ರಣ ಕೊಠಡಿ'),
    desc: L('Floods, cyclones, landslides and other natural disasters.', 'बाढ़, चक्रवात, भूस्खलन और अन्य प्राकृतिक आपदाएं।', 'ಪ್ರವಾಹ, ಚಂಡಮಾರುತ, ಭೂಕುಸಿತ ಮತ್ತು ಇತರ ನೈಸರ್ಗಿಕ ವಿಪತ್ತುಗಳು.'),
    hours: L('24 × 7 · for life-threatening emergencies call 112', '24 × 7 · जान के खतरे पर 112 पर कॉल करें', '24 × 7 · ಜೀವಕ್ಕೆ ಅಪಾಯವಿದ್ದರೆ 112 ಗೆ ಕರೆ ಮಾಡಿ'),
  },
  {
    id: 'vet',
    tone: 'violet',
    numbers: [{ label: '1962', tel: '1962' }],
    title: L('Veterinary / Livestock Emergency', 'पशु चिकित्सा / पशुधन आपातकाल', 'ಪಶು ವೈದ್ಯಕೀಯ / ಜಾನುವಾರು ತುರ್ತು'),
    desc: L('Mobile Veterinary Unit for sick or injured cattle and other animals.', 'बीमार या घायल मवेशियों और अन्य पशुओं के लिए मोबाइल पशु चिकित्सा इकाई।', 'ಅನಾರೋಗ್ಯ ಅಥವಾ ಗಾಯಗೊಂಡ ಜಾನುವಾರುಗಳಿಗೆ ಸಂಚಾರಿ ಪಶು ಚಿಕಿತ್ಸಾ ಘಟಕ.'),
    hours: L('Toll-free · service area varies by state', 'निःशुल्क · सेवा क्षेत्र राज्य अनुसार', 'ಉಚಿತ · ಸೇವಾ ವ್ಯಾಪ್ತಿ ರಾಜ್ಯದಿಂದ ರಾಜ್ಯಕ್ಕೆ ಬದಲು'),
  },
];

/* ───────────── NPK calculator ───────────── */
/** Soil-test fertility ratings (kg/ha): N = available N, P = P₂O₅, K = K₂O. */
export const NPK_LIMITS = {
  N: { low: 280, high: 560 },
  P: { low: 22.5, high: 56 },
  K: { low: 141, high: 336 },
};
/** Soil-test based adjustment of the recommended dose. */
export const LEVEL_FACTOR = { low: 1.25, medium: 1, high: 0.75 };

export const rateLevel = (nutrient, value) => {
  if (value === '' || value == null || !Number.isFinite(Number(value))) return null;
  const v = Number(value);
  const { low, high } = NPK_LIMITS[nutrient];
  return v < low ? 'low' : v > high ? 'high' : 'medium';
};

/** Recommended N–P₂O₅–K₂O (kg/ha) baselines live in the crop master data. */
export const RDF = NPK_BASELINES;

export { HA_PER_ACRE };
export const BAG_KG = { urea: 45, dap: 50, mop: 50 };

/**
 * Fertilizer plan for `acres`. DAP (18-46-0) supplies all P₂O₅ (and some N),
 * urea (46% N) supplies the remaining N, MOP (60% K₂O) supplies K₂O.
 */
export function fertilizerPlan(cropKey, levels, acres) {
  const rdf = RDF[cropKey];
  const need = {};
  ['N', 'P', 'K'].forEach((n) => {
    need[n] = rdf[n] * LEVEL_FACTOR[levels[n] || 'medium'] * HA_PER_ACRE * acres; // kg nutrient
  });
  const dap = need.P / 0.46;
  const urea = Math.max(0, need.N - dap * 0.18) / 0.46;
  const mop = need.K / 0.6;
  const bags = (kg, size) => Math.round((kg / size) * 2) / 2; // nearest half bag
  return {
    need,
    products: [
      { id: 'urea', kg: urea, bags: bags(urea, BAG_KG.urea), bagKg: BAG_KG.urea },
      { id: 'dap', kg: dap, bags: bags(dap, BAG_KG.dap), bagKg: BAG_KG.dap },
      { id: 'mop', kg: mop, bags: bags(mop, BAG_KG.mop), bagKg: BAG_KG.mop },
    ],
  };
}

/* ───────────── Pest & disease watch ───────────── */
export const pestGuides = [
  {
    id: 'paddyBlast',
    crop: L('Paddy', 'धान', 'ಭತ್ತ'),
    name: L('Blast (Magnaporthe oryzae)', 'ब्लास्ट / झोंका रोग', 'ಬೆಂಕಿರೋಗ (ಬ್ಲಾಸ್ಟ್)'),
    type: 'fungus',
    signs: L('Spindle- or diamond-shaped spots with grey centres and brown margins on leaves; neck turns black and panicles break (neck blast).', 'पत्तों पर धूसर बीच और भूरे किनारे वाले तकुए/हीरे जैसे धब्बे; बाली की गर्दन काली होकर टूटती है।', 'ಎಲೆಗಳ ಮೇಲೆ ಬೂದು ಮಧ್ಯ ಮತ್ತು ಕಂದು ಅಂಚಿನ ವಜ್ರಾಕಾರದ ಕಲೆಗಳು; ತೆನೆ ಕುತ್ತಿಗೆ ಕಪ್ಪಾಗಿ ಮುರಿಯುತ್ತದೆ.'),
    organic: L('Seed treatment and spray with Pseudomonas fluorescens 10 g/L; avoid excess nitrogen.', 'स्यूडोमोनास फ्लोरेसेंस 10 ग्राम/लीटर से बीज उपचार और छिड़काव; अधिक नाइट्रोजन न दें।', 'ಸ್ಯೂಡೋಮೊನಾಸ್ ಫ್ಲೋರೆಸೆನ್ಸ್ 10 ಗ್ರಾಂ/ಲೀ ಬೀಜೋಪಚಾರ ಮತ್ತು ಸಿಂಪಡಣೆ; ಹೆಚ್ಚು ಸಾರಜನಕ ಬೇಡ.'),
    chemical: L('Tricyclazole 75 WP @ 0.6 g/L at first symptoms and at heading.', 'लक्षण दिखते ही और बाली निकलते समय ट्राइसाइक्लाज़ोल 75 WP 0.6 ग्राम/लीटर।', 'ಲಕ್ಷಣ ಕಂಡಾಗ ಮತ್ತು ತೆನೆ ಬರುವಾಗ ಟ್ರೈಸೈಕ್ಲಜೋಲ್ 75 WP 0.6 ಗ್ರಾಂ/ಲೀ.'),
  },
  {
    id: 'ymv',
    crop: L('Pulses (green gram, black gram)', 'दलहन (मूंग, उड़द)', 'ದ್ವಿದಳ (ಹೆಸರು, ಉದ್ದು)'),
    name: L('Yellow Mosaic Virus (whitefly-borne)', 'पीला मोज़ेक विषाणु (सफ़ेद मक्खी से)', 'ಹಳದಿ ನಂಜು ರೋಗ (ಬಿಳಿನೊಣದಿಂದ)'),
    type: 'virus',
    signs: L('Bright yellow and green patches on young leaves, later fully yellow; plants stunted with few pods.', 'नई पत्तियों पर चमकीले पीले-हरे धब्बे, बाद में पूरी पीली; पौधे बौने, फलियां कम।', 'ಎಳೆಯ ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ-ಹಸಿರು ಮಚ್ಚೆಗಳು, ನಂತರ ಪೂರ್ತಿ ಹಳದಿ; ಗಿಡ ಕುಂಠಿತ, ಕಾಯಿ ಕಡಿಮೆ.'),
    organic: L('No cure – pull out and destroy infected plants early; yellow sticky traps; neem oil 5 ml/L against whitefly; grow resistant varieties.', 'इलाज नहीं – संक्रमित पौधे जल्दी उखाड़कर नष्ट करें; पीले चिपचिपे ट्रैप; सफ़ेद मक्खी पर नीम तेल 5 मिली/लीटर; प्रतिरोधी किस्में लगाएं।', 'ಚಿಕಿತ್ಸೆ ಇಲ್ಲ – ಸೋಂಕಿತ ಗಿಡಗಳನ್ನು ಬೇಗ ಕಿತ್ತು ನಾಶಮಾಡಿ; ಹಳದಿ ಅಂಟು ಬಲೆ; ಬಿಳಿನೊಣಕ್ಕೆ ಬೇವಿನ ಎಣ್ಣೆ 5 ಮಿಲೀ/ಲೀ; ನಿರೋಧಕ ತಳಿ ಬೆಳೆಯಿರಿ.'),
    chemical: L('Control whitefly: Thiamethoxam 25 WG @ 0.2 g/L or Imidacloprid 17.8 SL @ 0.3 ml/L.', 'सफ़ेद मक्खी नियंत्रण: थायमेथोक्साम 25 WG 0.2 ग्राम/लीटर या इमिडाक्लोप्रिड 17.8 SL 0.3 मिली/लीटर।', 'ಬಿಳಿನೊಣ ನಿಯಂತ್ರಣ: ಥಯಾಮೆಥಾಕ್ಸಾಮ್ 25 WG 0.2 ಗ್ರಾಂ/ಲೀ ಅಥವಾ ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ 17.8 SL 0.3 ಮಿಲೀ/ಲೀ.'),
  },
  {
    id: 'ragiBlast',
    crop: L('Ragi (finger millet)', 'रागी', 'ರಾಗಿ'),
    name: L('Leaf, neck & finger blast', 'पत्ती, गर्दन और बाली ब्लास्ट', 'ಎಲೆ, ಕುತ್ತಿಗೆ ಮತ್ತು ತೆನೆ ಬೆಂಕಿರೋಗ'),
    type: 'fungus',
    signs: L('Grey spindle-shaped leaf spots; blackened neck and dried, chaffy fingers in humid weather.', 'धूसर तकुए जैसे धब्बे; नम मौसम में गर्दन काली और बालियां सूखी, खोखली।', 'ಬೂದು ಕಲೆಗಳು; ತೇವದ ಹವೆಯಲ್ಲಿ ಕುತ್ತಿಗೆ ಕಪ್ಪಾಗಿ ತೆನೆ ಒಣಗಿ ಜೊಳ್ಳಾಗುತ್ತದೆ.'),
    organic: L('Use resistant varieties (e.g. GPU-28); Pseudomonas fluorescens 10 g/L spray; balanced fertilizer.', 'प्रतिरोधी किस्में (जैसे GPU-28); स्यूडोमोनास 10 ग्राम/लीटर छिड़काव; संतुलित खाद।', 'ನಿರೋಧಕ ತಳಿ (ಉದಾ. GPU-28); ಸ್ಯೂಡೋಮೊನಾಸ್ 10 ಗ್ರಾಂ/ಲೀ ಸಿಂಪಡಣೆ; ಸಮತೋಲಿತ ಗೊಬ್ಬರ.'),
    chemical: L('Tricyclazole 75 WP @ 0.6 g/L or Carbendazim 50 WP @ 1 g/L at flowering.', 'फूल आने पर ट्राइसाइक्लाज़ोल 75 WP 0.6 ग्राम/लीटर या कार्बेन्डाज़िम 50 WP 1 ग्राम/लीटर।', 'ಹೂ ಬಿಡುವಾಗ ಟ್ರೈಸೈಕ್ಲಜೋಲ್ 0.6 ಗ್ರಾಂ/ಲೀ ಅಥವಾ ಕಾರ್ಬೆಂಡಜಿಮ್ 1 ಗ್ರಾಂ/ಲೀ.'),
  },
  {
    id: 'faw',
    crop: L('Maize', 'मक्का', 'ಮೆಕ್ಕೆಜೋಳ'),
    name: L('Fall armyworm', 'फॉल आर्मीवर्म', 'ಸೈನಿಕ ಹುಳು'),
    type: 'insect',
    signs: L('Ragged holes and window-pane feeding on leaves; sawdust-like droppings in the whorl; larva with an inverted "Y" on its head.', 'पत्तों में फटे छेद; गुच्छे में बुरादे जैसी बीट; सिर पर उल्टा "Y" निशान वाली सुंडी।', 'ಎಲೆಗಳಲ್ಲಿ ಹರಿದ ರಂಧ್ರ; ಸುರುಳಿಯಲ್ಲಿ ಹುಡಿಯಂತಹ ಹಿಕ್ಕೆ; ತಲೆಯ ಮೇಲೆ ತಲೆಕೆಳಗಾದ "Y" ಗುರುತಿನ ಹುಳು.'),
    organic: L('Sand + lime (9:1) in whorls; NSKE 5%; Bacillus thuringiensis or Metarhizium sprays; bird perches.', 'गुच्छों में रेत + चूना (9:1); NSKE 5%; Bt या मेटाराइज़ियम छिड़काव; पक्षी-ठिकाने।', 'ಸುರುಳಿಗೆ ಮರಳು + ಸುಣ್ಣ (9:1); NSKE 5%; Bt ಅಥವಾ ಮೆಟಾರೈಜಿಯಂ ಸಿಂಪಡಣೆ; ಪಕ್ಷಿ ಕಂಬ.'),
    chemical: L('Emamectin benzoate 5 SG @ 0.4 g/L or Spinetoram 11.7 SC @ 0.5 ml/L directed into the whorl.', 'गुच्छे में इमामेक्टिन बेंजोएट 5 SG 0.4 ग्राम/लीटर या स्पाइनेटोरम 11.7 SC 0.5 मिली/लीटर।', 'ಸುರುಳಿಗೆ ಎಮಾಮೆಕ್ಟಿನ್ ಬೆಂಜೋಯೇಟ್ 0.4 ಗ್ರಾಂ/ಲೀ ಅಥವಾ ಸ್ಪೈನೆಟೊರಾಮ್ 0.5 ಮಿಲೀ/ಲೀ.'),
  },
  {
    id: 'bph',
    crop: L('Paddy', 'धान', 'ಭತ್ತ'),
    name: L('Brown planthopper (hopper burn)', 'भूरा फुदका (हॉपर बर्न)', 'ಕಂದು ಜಿಗಿಹುಳು (ಹಾಪರ್ ಬರ್ನ್)'),
    type: 'insect',
    signs: L('Round patches of yellowing, drying plants ("hopper burn"); brown insects clustered at the base of stems.', 'गोल घेरे में पीले, सूखते पौधे ("हॉपर बर्न"); तनों के निचले हिस्से पर भूरे कीटों का झुंड।', 'ವೃತ್ತಾಕಾರವಾಗಿ ಹಳದಿಯಾಗಿ ಒಣಗುವ ಗಿಡಗಳು; ಕಾಂಡದ ಬುಡದಲ್ಲಿ ಕಂದು ಕೀಟಗಳ ಗುಂಪು.'),
    organic: L('Avoid excess nitrogen; alternate wetting and drying; leave 20 cm alleys every 2 m for air flow.', 'अधिक नाइट्रोजन न दें; बारी-बारी गीला-सूखा रखें; हर 2 मीटर पर 20 सेमी रास्ता छोड़ें।', 'ಹೆಚ್ಚು ಸಾರಜನಕ ಬೇಡ; ಪರ್ಯಾಯವಾಗಿ ನೀರು ಹಾಯಿಸಿ ಒಣಗಿಸಿ; ಪ್ರತಿ 2 ಮೀ ಗೆ 20 ಸೆಂಮೀ ದಾರಿ ಬಿಡಿ.'),
    chemical: L('Pymetrozine 50 WG @ 0.6 g/L sprayed at the base of plants.', 'पौधों के निचले हिस्से पर पाइमेट्रोज़िन 50 WG 0.6 ग्राम/लीटर।', 'ಗಿಡಗಳ ಬುಡಕ್ಕೆ ಪೈಮೆಟ್ರೋಜಿನ್ 50 WG 0.6 ಗ್ರಾಂ/ಲೀ.'),
  },
  {
    id: 'earlyBlight',
    crop: L('Tomato', 'टमाटर', 'ಟೊಮೆಟೊ'),
    name: L('Early blight (Alternaria)', 'अगेती झुलसा', 'ಆರಂಭಿಕ ಅಂಗಮಾರಿ'),
    type: 'fungus',
    signs: L('Brown spots with concentric "target" rings on older leaves; leaves yellow and drop from the bottom up.', 'पुराने पत्तों पर निशाने जैसे छल्लों वाले भूरे धब्बे; पत्ते नीचे से पीले होकर गिरते हैं।', 'ಹಳೆಯ ಎಲೆಗಳಲ್ಲಿ ಗುರಿಯಂತಹ ಉಂಗುರಗಳ ಕಂದು ಕಲೆಗಳು; ಎಲೆಗಳು ಕೆಳಗಿನಿಂದ ಹಳದಿಯಾಗಿ ಉದುರುತ್ತವೆ.'),
    organic: L('Remove lower infected leaves; mulch; drip irrigation; Trichoderma / Bacillus subtilis 5 g/L.', 'संक्रमित निचले पत्ते हटाएं; मल्च; ड्रिप सिंचाई; ट्राइकोडर्मा / बैसिलस सबटिलिस 5 ग्राम/लीटर।', 'ಸೋಂಕಿತ ಕೆಳಗಿನ ಎಲೆ ತೆಗೆಯಿರಿ; ಹೊದಿಕೆ; ಹನಿ ನೀರಾವರಿ; ಟ್ರೈಕೋಡರ್ಮಾ / ಬ್ಯಾಸಿಲಸ್ 5 ಗ್ರಾಂ/ಲೀ.'),
    chemical: L('Mancozeb 75 WP @ 2.5 g/L or Chlorothalonil 75 WP @ 2 g/L on a dry day.', 'सूखे दिन मैंकोज़ेब 75 WP 2.5 ग्राम/लीटर या क्लोरोथालोनिल 75 WP 2 ग्राम/लीटर।', 'ಒಣ ದಿನ ಮ್ಯಾಂಕೋಜೆಬ್ 2.5 ಗ್ರಾಂ/ಲೀ ಅಥವಾ ಕ್ಲೋರೋಥಲೋನಿಲ್ 2 ಗ್ರಾಂ/ಲೀ.'),
  },
];
