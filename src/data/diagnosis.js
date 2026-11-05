/**
 * Mock diagnosis reports for the Crop Doctor tab (keyed by crop).
 * Doses use common published recommendations and a ~200 litres-per-acre knapsack
 * spray volume; they are demo guidance – always follow the product label and the
 * local agriculture officer / KVK.
 */
const L = (en, hi, kn) => ({ en, hi, kn });

const removeLeaves = (days = 2) => ({
  days,
  category: 'inspection',
  title: L('Remove and destroy infected leaves', 'संक्रमित पत्ते तोड़कर नष्ट करें', 'ಸೋಂಕಿತ ಎಲೆಗಳನ್ನು ತೆಗೆದು ನಾಶಮಾಡಿ'),
});
const sprayDry = (days = 3) => ({
  days,
  category: 'inspection',
  title: L('Spray the chosen remedy on a dry, calm day', 'चुना हुआ उपाय सूखे, शांत दिन छिड़कें', 'ಆಯ್ದ ಪರಿಹಾರವನ್ನು ಒಣ, ಗಾಳಿ ಇಲ್ಲದ ದಿನ ಸಿಂಪಡಿಸಿ'),
});
const recheck = (days = 7) => ({
  days,
  category: 'inspection',
  title: L('Re-inspect the field and take a new photo', 'खेत फिर जांचें और नई फोटो लें', 'ಹೊಲವನ್ನು ಮತ್ತೆ ಪರೀಕ್ಷಿಸಿ ಹೊಸ ಫೋಟೋ ತೆಗೆಯಿರಿ'),
});

export const diagnosisReports = {
  ragi: {
    name: L('Finger millet blast (Magnaporthe grisea)', 'रागी ब्लास्ट (मैग्नापोर्थे ग्रिसिया)', 'ರಾಗಿ ಬೆಂಕಿರೋಗ (ಮ್ಯಾಗ್ನಪೋರ್ಥೆ ಗ್ರಿಸಿಯಾ)'),
    severity: 'medium',
    confidence: 87,
    affected: 20,
    symptoms: L(
      'Spindle-shaped grey spots with brown margins on leaves; may spread to neck and fingers in humid weather.',
      'पत्तों पर भूरे किनारे वाले धूसर तकुए जैसे धब्बे; नम मौसम में गर्दन और बालियों तक फैल सकते हैं।',
      'ಎಲೆಗಳ ಮೇಲೆ ಕಂದು ಅಂಚಿನ ಬೂದು ಕಲೆಗಳು; ತೇವದ ಹವೆಯಲ್ಲಿ ತೆನೆ ಕುತ್ತಿಗೆ ಮತ್ತು ಬೆರಳುಗಳಿಗೆ ಹರಡಬಹುದು.'
    ),
    traditional: [
      L('Pick and burn badly spotted leaves; do not leave them in the field.', 'ज़्यादा धब्बेदार पत्ते तोड़कर जला दें; खेत में न छोड़ें।', 'ಹೆಚ್ಚು ಕಲೆಯಿರುವ ಎಲೆಗಳನ್ನು ಕಿತ್ತು ಸುಡಿ; ಹೊಲದಲ್ಲಿ ಬಿಡಬೇಡಿ.'),
      L('Stop extra urea for now; give potash if the soil test shows it is low.', 'अभी अतिरिक्त यूरिया न दें; मिट्टी जांच में कमी हो तो पोटाश दें।', 'ಈಗ ಹೆಚ್ಚುವರಿ ಯೂರಿಯಾ ಬೇಡ; ಮಣ್ಣು ಪರೀಕ್ಷೆಯಲ್ಲಿ ಕಡಿಮೆ ಇದ್ದರೆ ಪೊಟ್ಯಾಷ್ ಕೊಡಿ.'),
      L('Traditional: sour buttermilk diluted 1:10 as a spray (limited scientific evidence).', 'पारंपरिक: खट्टी छाछ 1:10 पतला करके छिड़काव (सीमित वैज्ञानिक प्रमाण)।', 'ಸಾಂಪ್ರದಾಯಿಕ: ಹುಳಿ ಮಜ್ಜಿಗೆ 1:10 ದುರ್ಬಲಗೊಳಿಸಿ ಸಿಂಪಡಣೆ (ಸೀಮಿತ ವೈಜ್ಞಾನಿಕ ಪುರಾವೆ).'),
    ],
    organic: [
      { name: L('Pseudomonas fluorescens (1% WP)', 'स्यूडोमोनास फ्लोरेसेंस (1% WP)', 'ಸ್ಯೂಡೋಮೊನಾಸ್ ಫ್ಲೋರೆಸೆನ್ಸ್ (1% WP)'), dose: '10 g / L', perAcre: L('2 kg in 200 L water', '200 लीटर पानी में 2 किग्रा', '200 ಲೀ ನೀರಿನಲ್ಲಿ 2 ಕೆಜಿ') },
    ],
    chemical: [
      { name: L('Tricyclazole 75% WP', 'ट्राइसाइक्लाज़ोल 75% WP', 'ಟ್ರೈಸೈಕ್ಲಜೋಲ್ 75% WP'), dose: '0.6 g / L', perAcre: L('120 g in 200 L water', '200 लीटर पानी में 120 ग्राम', '200 ಲೀ ನೀರಿನಲ್ಲಿ 120 ಗ್ರಾಂ') },
      { name: L('or Carbendazim 50% WP', 'या कार्बेन्डाज़िम 50% WP', 'ಅಥವಾ ಕಾರ್ಬೆಂಡಜಿಮ್ 50% WP'), dose: '1 g / L', perAcre: L('200 g in 200 L water', '200 लीटर पानी में 200 ग्राम', '200 ಲೀ ನೀರಿನಲ್ಲಿ 200 ಗ್ರಾಂ') },
    ],
    tasks: [removeLeaves(2), sprayDry(3), recheck(7)],
  },
  tomato: {
    name: L('Tomato early blight (Alternaria solani)', 'टमाटर अगेती झुलसा (अल्टरनेरिया सोलानी)', 'ಟೊಮೆಟೊ ಆರಂಭಿಕ ಅಂಗಮಾರಿ (ಆಲ್ಟರ್ನೇರಿಯಾ ಸೊಲಾನಿ)'),
    severity: 'medium',
    confidence: 82,
    affected: 15,
    symptoms: L(
      'Brown spots with target-like rings on older, lower leaves; leaves yellow and drop.',
      'पुराने निचले पत्तों पर निशाने जैसे छल्लों वाले भूरे धब्बे; पत्ते पीले होकर गिरते हैं।',
      'ಹಳೆಯ ಕೆಳಗಿನ ಎಲೆಗಳಲ್ಲಿ ಗುರಿಯಂತಹ ಉಂಗುರಗಳಿರುವ ಕಂದು ಕಲೆಗಳು; ಎಲೆಗಳು ಹಳದಿಯಾಗಿ ಉದುರುತ್ತವೆ.'
    ),
    traditional: [
      L('Remove the lowest infected leaves and stake the plants for airflow.', 'सबसे निचले संक्रमित पत्ते हटाएं और हवा के लिए पौधों को सहारा दें।', 'ಕೆಳಗಿನ ಸೋಂಕಿತ ಎಲೆಗಳನ್ನು ತೆಗೆದು ಗಾಳಿಯಾಡಲು ಗಿಡಗಳಿಗೆ ಆಧಾರ ಕೊಡಿ.'),
      L('Mulch the soil and water at the base – keep leaves dry.', 'मिट्टी पर मल्च डालें और जड़ में पानी दें – पत्ते सूखे रखें।', 'ಮಣ್ಣಿಗೆ ಹೊದಿಕೆ ಹಾಕಿ ಬುಡಕ್ಕೆ ನೀರು ಕೊಡಿ – ಎಲೆಗಳು ಒಣಗಿರಲಿ.'),
    ],
    organic: [
      { name: L('Trichoderma viride / Bacillus subtilis', 'ट्राइकोडर्मा विरिडी / बैसिलस सबटिलिस', 'ಟ್ರೈಕೋಡರ್ಮಾ ವಿರಿಡೆ / ಬ್ಯಾಸಿಲಸ್ ಸಬ್ಟಿಲಿಸ್'), dose: '5 g / L', perAcre: L('1 kg in 200 L water', '200 लीटर पानी में 1 किग्रा', '200 ಲೀ ನೀರಿನಲ್ಲಿ 1 ಕೆಜಿ') },
      { name: L('Neem oil (1500 ppm)', 'नीम तेल (1500 ppm)', 'ಬೇವಿನ ಎಣ್ಣೆ (1500 ppm)'), dose: '3–5 ml / L', perAcre: L('0.6–1 litre in 200 L water', '200 लीटर पानी में 0.6–1 लीटर', '200 ಲೀ ನೀರಿನಲ್ಲಿ 0.6–1 ಲೀಟರ್') },
    ],
    chemical: [
      { name: L('Mancozeb 75% WP', 'मैंकोज़ेब 75% WP', 'ಮ್ಯಾಂಕೋಜೆಬ್ 75% WP'), dose: '2.5 g / L', perAcre: L('500 g in 200 L water', '200 लीटर पानी में 500 ग्राम', '200 ಲೀ ನೀರಿನಲ್ಲಿ 500 ಗ್ರಾಂ') },
      { name: L('or Chlorothalonil 75% WP', 'या क्लोरोथालोनिल 75% WP', 'ಅಥವಾ ಕ್ಲೋರೋಥಲೋನಿಲ್ 75% WP'), dose: '2 g / L', perAcre: L('400 g in 200 L water', '200 लीटर पानी में 400 ग्राम', '200 ಲೀ ನೀರಿನಲ್ಲಿ 400 ಗ್ರಾಂ') },
    ],
    tasks: [removeLeaves(2), sprayDry(3), recheck(7)],
  },
  maize: {
    name: L('Fall armyworm (Spodoptera frugiperda)', 'फॉल आर्मीवर्म (स्पोडोप्टेरा फ्रूजीपरडा)', 'ಸೈನಿಕ ಹುಳು (ಸ್ಪೊಡೊಪ್ಟೆರಾ ಫ್ರುಜಿಪರ್ಡಾ)'),
    severity: 'high',
    confidence: 79,
    affected: 25,
    symptoms: L(
      'Ragged holes and window-pane feeding on leaves; sawdust-like droppings in the whorl.',
      'पत्तों में फटे छेद और खिड़की जैसे खाए निशान; गुच्छे में बुरादे जैसी बीट।',
      'ಎಲೆಗಳಲ್ಲಿ ಹರಿದ ರಂಧ್ರಗಳು; ಸುರುಳಿಯಲ್ಲಿ ಹುಡಿಯಂತಹ ಹಿಕ್ಕೆ.'
    ),
    traditional: [
      L('Put dry sand mixed with lime (9:1) or wood ash into the whorls.', 'गुच्छों में चूना मिली सूखी रेत (9:1) या लकड़ी की राख डालें।', 'ಸುರುಳಿಗಳಿಗೆ ಸುಣ್ಣ ಬೆರೆಸಿದ ಒಣ ಮರಳು (9:1) ಅಥವಾ ಕಟ್ಟಿಗೆ ಬೂದಿ ಹಾಕಿ.'),
      L('Crush egg masses by hand; put up about 10 bird perches per acre.', 'अंडों के गुच्छे हाथ से नष्ट करें; प्रति एकड़ लगभग 10 पक्षी-ठिकाने लगाएं।', 'ಮೊಟ್ಟೆ ಗುಂಪುಗಳನ್ನು ಕೈಯಿಂದ ನಾಶಮಾಡಿ; ಎಕರೆಗೆ ಸುಮಾರು 10 ಪಕ್ಷಿ ಕೂರುವ ಕಂಬ ಹಾಕಿ.'),
    ],
    organic: [
      { name: L('Neem seed kernel extract (NSKE 5%)', 'नीम बीज गिरी अर्क (NSKE 5%)', 'ಬೇವಿನ ಬೀಜದ ಸಾರ (NSKE 5%)'), dose: '50 g / L', perAcre: L('10 kg kernel powder for 200 L', '200 लीटर के लिए 10 किग्रा गिरी पाउडर', '200 ಲೀ ಗೆ 10 ಕೆಜಿ ಬೀಜದ ಪುಡಿ') },
      { name: L('Bacillus thuringiensis (Bt)', 'बैसिलस थुरिंजिएंसिस (Bt)', 'ಬ್ಯಾಸಿಲಸ್ ಥುರಿಂಜಿಯೆನ್ಸಿಸ್ (Bt)'), dose: '2 g / L', perAcre: L('400 g in 200 L water', '200 लीटर पानी में 400 ग्राम', '200 ಲೀ ನೀರಿನಲ್ಲಿ 400 ಗ್ರಾಂ') },
    ],
    chemical: [
      { name: L('Emamectin benzoate 5% SG (spray into whorl)', 'इमामेक्टिन बेंजोएट 5% SG (गुच्छे में छिड़कें)', 'ಎಮಾಮೆಕ್ಟಿನ್ ಬೆಂಜೋಯೇಟ್ 5% SG (ಸುರುಳಿಗೆ ಸಿಂಪಡಿಸಿ)'), dose: '0.4 g / L', perAcre: L('80 g in 200 L water', '200 लीटर पानी में 80 ग्राम', '200 ಲೀ ನೀರಿನಲ್ಲಿ 80 ಗ್ರಾಂ') },
      { name: L('or Spinetoram 11.7% SC', 'या स्पाइनेटोरम 11.7% SC', 'ಅಥವಾ ಸ್ಪೈನೆಟೊರಾಮ್ 11.7% SC'), dose: '0.5 ml / L', perAcre: L('100 ml in 200 L water', '200 लीटर पानी में 100 मिली', '200 ಲೀ ನೀರಿನಲ್ಲಿ 100 ಮಿಲೀ') },
    ],
    tasks: [
      { days: 1, category: 'inspection', title: L('Apply sand-lime or ash into affected whorls', 'प्रभावित गुच्छों में रेत-चूना या राख डालें', 'ಬಾಧಿತ ಸುರುಳಿಗಳಿಗೆ ಮರಳು-ಸುಣ್ಣ ಅಥವಾ ಬೂದಿ ಹಾಕಿ') },
      sprayDry(3),
      recheck(7),
    ],
  },
  paddy: {
    name: L('Rice blast (Magnaporthe oryzae)', 'धान ब्लास्ट (मैग्नापोर्थे ओराइज़ी)', 'ಭತ್ತದ ಬೆಂಕಿರೋಗ (ಮ್ಯಾಗ್ನಪೋರ್ಥೆ ಒರೈಜೆ)'),
    severity: 'medium',
    confidence: 84,
    affected: 18,
    symptoms: L('Diamond-shaped spots with grey centres on leaves.', 'पत्तों पर धूसर बीच वाले हीरे के आकार के धब्बे।', 'ಎಲೆಗಳಲ್ಲಿ ಬೂದು ಮಧ್ಯಭಾಗದ ವಜ್ರಾಕಾರದ ಕಲೆಗಳು.'),
    traditional: [L('Avoid excess nitrogen; keep bunds and channels free of weeds.', 'अधिक नाइट्रोजन से बचें; मेड़ और नालियां खरपतवार मुक्त रखें।', 'ಹೆಚ್ಚು ಸಾರಜನಕ ಬೇಡ; ಬದು ಮತ್ತು ಕಾಲುವೆಗಳಲ್ಲಿ ಕಳೆ ಇಲ್ಲದಂತೆ ನೋಡಿ.')],
    organic: [{ name: L('Pseudomonas fluorescens (1% WP)', 'स्यूडोमोनास फ्लोरेसेंस (1% WP)', 'ಸ್ಯೂಡೋಮೊನಾಸ್ ಫ್ಲೋರೆಸೆನ್ಸ್ (1% WP)'), dose: '10 g / L', perAcre: L('2 kg in 200 L water', '200 लीटर पानी में 2 किग्रा', '200 ಲೀ ನೀರಿನಲ್ಲಿ 2 ಕೆಜಿ') }],
    chemical: [{ name: L('Tricyclazole 75% WP', 'ट्राइसाइक्लाज़ोल 75% WP', 'ಟ್ರೈಸೈಕ್ಲಜೋಲ್ 75% WP'), dose: '0.6 g / L', perAcre: L('120 g in 200 L water', '200 लीटर पानी में 120 ग्राम', '200 ಲೀ ನೀರಿನಲ್ಲಿ 120 ಗ್ರಾಂ') }],
    tasks: [removeLeaves(2), sprayDry(3), recheck(7)],
  },
  groundnut: {
    name: L('Groundnut leaf spot (tikka)', 'मूंगफली पत्ती धब्बा (टिक्का)', 'ಕಡಲೆಕಾಯಿ ಎಲೆ ಚುಕ್ಕೆ (ಟಿಕ್ಕಾ)'),
    severity: 'low',
    confidence: 80,
    affected: 10,
    symptoms: L('Round dark-brown spots, sometimes with a yellow halo.', 'गोल गहरे भूरे धब्बे, कभी-कभी पीले घेरे के साथ।', 'ದುಂಡಗಿನ ಗಾಢ ಕಂದು ಕಲೆಗಳು, ಕೆಲವೊಮ್ಮೆ ಹಳದಿ ವರ್ತುಲದೊಂದಿಗೆ.'),
    traditional: [L('Remove crop debris; rotate with a cereal next season.', 'फसल अवशेष हटाएं; अगले सीज़न अनाज फसल के साथ फसल चक्र अपनाएं।', 'ಬೆಳೆ ಉಳಿಕೆ ತೆಗೆಯಿರಿ; ಮುಂದಿನ ಹಂಗಾಮಿನಲ್ಲಿ ಧಾನ್ಯ ಬೆಳೆಯೊಂದಿಗೆ ಬೆಳೆ ಪರಿವರ್ತನೆ ಮಾಡಿ.')],
    organic: [{ name: L('Neem oil (1500 ppm)', 'नीम तेल (1500 ppm)', 'ಬೇವಿನ ಎಣ್ಣೆ (1500 ppm)'), dose: '3–5 ml / L', perAcre: L('0.6–1 litre in 200 L water', '200 लीटर पानी में 0.6–1 लीटर', '200 ಲೀ ನೀರಿನಲ್ಲಿ 0.6–1 ಲೀಟರ್') }],
    chemical: [{ name: L('Mancozeb 75% WP', 'मैंकोज़ेब 75% WP', 'ಮ್ಯಾಂಕೋಜೆಬ್ 75% WP'), dose: '2 g / L', perAcre: L('400 g in 200 L water', '200 लीटर पानी में 400 ग्राम', '200 ಲೀ ನೀರಿನಲ್ಲಿ 400 ಗ್ರಾಂ') }],
    tasks: [removeLeaves(2), sprayDry(3), recheck(7)],
  },
};

export const diagnose = (cropId) => diagnosisReports[cropId] || diagnosisReports.ragi;
