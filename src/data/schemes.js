const L = (en, hi, kn) => ({ en, hi, kn });

/**
 * Official scheme directory. Names, benefit summaries and registration URLs
 * come from the team's directory list. `relevant` + optional rules decide the
 * "Likely eligible" badge for the current farmer profile.
 */
export const schemes = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN',
    category: 'income',
    last: true,
    relevant: true,
    benefit: L(
      "₹6,000 per year in 3 equal installments of ₹2,000 transferred directly to landholding farmers' bank accounts.",
      'भूमिधारक किसानों के बैंक खाते में सीधे ₹2,000 की 3 बराबर किस्तों में सालाना ₹6,000।',
      'ಭೂಮಾಲೀಕ ರೈತರ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ನೇರವಾಗಿ ₹2,000 ದ 3 ಸಮಾನ ಕಂತುಗಳಲ್ಲಿ ವರ್ಷಕ್ಕೆ ₹6,000.'
    ),
    portal: { name: 'PM-KISAN Portal', url: 'https://pmkisan.gov.in/Registration' },
  },
  {
    id: 'pm-kmy',
    name: 'PM Kisan Maan-Dhan (PM-KMY)',
    category: 'pension',
    last: true,
    relevant: true,
    maxAcres: 5,
    benefit: L(
      'Voluntary pension scheme offering small & marginal farmers a guaranteed monthly pension of ₹3,000 after age 60.',
      'छोटे और सीमांत किसानों के लिए स्वैच्छिक पेंशन योजना – 60 वर्ष की आयु के बाद ₹3,000 मासिक पेंशन की गारंटी।',
      'ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತರಿಗೆ ಸ್ವಯಂಪ್ರೇರಿತ ಪಿಂಚಣಿ ಯೋಜನೆ – 60 ವರ್ಷದ ನಂತರ ತಿಂಗಳಿಗೆ ₹3,000 ಖಚಿತ ಪಿಂಚಣಿ.'
    ),
    portal: { name: 'Maan-Dhan Portal', url: 'https://maandhan.in/pmkmy' },
  },
  {
    id: 'raitha-siri',
    name: 'Raita Siri Scheme (Karnataka)',
    category: 'millet',
    relevant: true,
    needsCrop: 'ragi',
    benefit: L(
      'Direct cash incentive of up to ₹10,000 per hectare for farmers cultivating minor millets (ragi, foxtail millet, etc.).',
      'रागी, कंगनी आदि लघु मोटे अनाज उगाने वाले किसानों को प्रति हेक्टेयर ₹10,000 तक सीधा नकद प्रोत्साहन।',
      'ರಾಗಿ, ನವಣೆ ಮುಂತಾದ ಕಿರು ಸಿರಿಧಾನ್ಯ ಬೆಳೆಯುವ ರೈತರಿಗೆ ಹೆಕ್ಟೇರ್‌ಗೆ ₹10,000 ವರೆಗೆ ನೇರ ನಗದು ಪ್ರೋತ್ಸಾಹ.'
    ),
    portal: { name: 'FRUITS Karnataka', url: 'https://fruits.karnataka.gov.in' },
  },
  {
    id: 'pmfby',
    name: 'PM Fasal Bima Yojana (PMFBY)',
    category: 'insurance',
    relevant: true,
    benefit: L(
      'Low-premium crop insurance (1.5%-2%) protecting against yield losses from natural disasters, pests, and rainfall.',
      'कम प्रीमियम (1.5%–2%) वाला फसल बीमा, जो प्राकृतिक आपदा, कीट और वर्षा से उपज नुकसान से बचाता है।',
      'ಕಡಿಮೆ ಪ್ರೀಮಿಯಂ (1.5%–2%) ಬೆಳೆ ವಿಮೆ – ನೈಸರ್ಗಿಕ ವಿಕೋಪ, ಕೀಟ ಮತ್ತು ಮಳೆಯಿಂದ ಇಳುವರಿ ನಷ್ಟಕ್ಕೆ ರಕ್ಷಣೆ.'
    ),
    portal: { name: 'PMFBY Portal', url: 'https://pmfby.gov.in/farmerLogin' },
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC)',
    category: 'credit',
    relevant: true,
    benefit: L(
      'Short-term farm credit up to ₹3 lakh at an effective interest rate of ~4% upon timely repayment.',
      'समय पर चुकाने पर लगभग 4% प्रभावी ब्याज दर पर ₹3 लाख तक का अल्पकालिक कृषि ऋण।',
      'ಸಮಯಕ್ಕೆ ಮರುಪಾವತಿಸಿದರೆ ಸುಮಾರು 4% ಪರಿಣಾಮಕಾರಿ ಬಡ್ಡಿಯಲ್ಲಿ ₹3 ಲಕ್ಷದವರೆಗೆ ಅಲ್ಪಾವಧಿ ಕೃಷಿ ಸಾಲ.'
    ),
    portal: { name: 'PM-KISAN / KCC Form', url: 'https://pmkisan.gov.in' },
  },
  {
    id: 'pm-kusum',
    name: 'PM-KUSUM (Solar Pumps)',
    category: 'energy',
    benefit: L(
      'Up to 60% combined subsidy for standalone and grid-connected solar irrigation pumpsets.',
      'स्टैंडअलोन और ग्रिड से जुड़े सौर सिंचाई पंपसेट पर 60% तक संयुक्त सब्सिडी।',
      'ಸ್ವತಂತ್ರ ಮತ್ತು ಗ್ರಿಡ್ ಸಂಪರ್ಕಿತ ಸೌರ ನೀರಾವರಿ ಪಂಪ್‌ಸೆಟ್‌ಗಳಿಗೆ 60% ವರೆಗೆ ಸಂಯೋಜಿತ ಸಹಾಯಧನ.'
    ),
    portal: { name: 'PM-KUSUM Portal', url: 'https://pmkusum.mnre.gov.in' },
  },
  {
    id: 'pdmc',
    name: 'Per Drop More Crop (PDMC)',
    category: 'irrigation',
    relevant: true,
    maxAcres: 5,
    benefit: L(
      '45% to 55% financial subsidy on micro-irrigation setups (drip and sprinkler systems) under RKVY.',
      'आरकेवीवाई के तहत सूक्ष्म सिंचाई (ड्रिप और स्प्रिंकलर) पर 45% से 55% वित्तीय सब्सिडी।',
      'ಆರ್‌ಕೆವಿವೈ ಅಡಿಯಲ್ಲಿ ಸೂಕ್ಷ್ಮ ನೀರಾವರಿ (ಹನಿ ಮತ್ತು ತುಂತುರು) ವ್ಯವಸ್ಥೆಗೆ 45% ರಿಂದ 55% ಆರ್ಥಿಕ ಸಹಾಯಧನ.'
    ),
    portal: { name: 'PMKSY Portal', url: 'https://pmksy.gov.in' },
  },
  {
    id: 'smam',
    name: 'SMAM (Agri-Mechanization)',
    category: 'machinery',
    benefit: L(
      '40% to 80% subsidy for purchasing farm machinery or setting up Custom Hiring Centers (CHCs).',
      'कृषि मशीनरी खरीदने या कस्टम हायरिंग सेंटर (CHC) बनाने पर 40% से 80% सब्सिडी।',
      'ಕೃಷಿ ಯಂತ್ರೋಪಕರಣ ಖರೀದಿ ಅಥವಾ ಕಸ್ಟಮ್ ಹೈರಿಂಗ್ ಕೇಂದ್ರ (CHC) ಸ್ಥಾಪನೆಗೆ 40% ರಿಂದ 80% ಸಹಾಯಧನ.'
    ),
    portal: { name: 'Agri-Machinery Portal', url: 'https://agrimachinery.nic.in' },
  },
  {
    id: 'aif',
    name: 'Agri Infrastructure Fund (AIF)',
    category: 'infrastructure',
    benefit: L(
      '3% interest subvention on bank loans up to ₹2 crore for building post-harvest storage, cold chains, and processing.',
      'कटाई के बाद भंडारण, कोल्ड चेन और प्रसंस्करण के लिए ₹2 करोड़ तक के बैंक ऋण पर 3% ब्याज छूट।',
      'ಕೊಯ್ಲೋತ್ತರ ದಾಸ್ತಾನು, ಶೀತಲ ಸರಪಳಿ ಮತ್ತು ಸಂಸ್ಕರಣೆಗೆ ₹2 ಕೋಟಿವರೆಗಿನ ಬ್ಯಾಂಕ್ ಸಾಲಕ್ಕೆ 3% ಬಡ್ಡಿ ರಿಯಾಯಿತಿ.'
    ),
    portal: { name: 'Agri Infra Portal', url: 'https://agriinfra.dac.gov.in' },
  },
  {
    id: 'shc',
    name: 'Soil Health Card Scheme',
    category: 'soil',
    relevant: true,
    benefit: L(
      'Free soil nutrient testing and crop-specific fertilizer recommendations to optimize input costs.',
      'मुफ़्त मिट्टी पोषक तत्व जांच और फसल अनुसार उर्वरक सिफारिशें, जिससे लागत कम होती है।',
      'ಉಚಿತ ಮಣ್ಣಿನ ಪೋಷಕಾಂಶ ಪರೀಕ್ಷೆ ಮತ್ತು ಬೆಳೆವಾರು ಗೊಬ್ಬರ ಶಿಫಾರಸು – ಖರ್ಚು ಕಡಿಮೆ ಮಾಡಲು.'
    ),
    portal: { name: 'Soil Health Portal', url: 'https://soilhealth.dac.gov.in' },
  },
  {
    id: 'enam',
    name: 'e-NAM (National Agriculture Market)',
    category: 'marketing',
    relevant: true,
    benefit: L(
      'Pan-India electronic trading portal integrating APMC mandis for transparent, competitive sales.',
      'एपीएमसी मंडियों को जोड़ने वाला अखिल भारतीय इलेक्ट्रॉनिक व्यापार पोर्टल, पारदर्शी और प्रतिस्पर्धी बिक्री के लिए।',
      'ಎಪಿಎಂಸಿ ಮಂಡಿಗಳನ್ನು ಜೋಡಿಸುವ ರಾಷ್ಟ್ರವ್ಯಾಪಿ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ವ್ಯಾಪಾರ ಪೋರ್ಟಲ್ – ಪಾರದರ್ಶಕ, ಸ್ಪರ್ಧಾತ್ಮಕ ಮಾರಾಟಕ್ಕಾಗಿ.'
    ),
    portal: { name: 'e-NAM Portal', url: 'https://enam.gov.in/registration' },
  },
  {
    id: 'esamridhi',
    name: 'e-Samridhi (NAFED)',
    category: 'procurement',
    benefit: L(
      'Direct government procurement portal for pulses and oilseeds (tur, urad, masoor) at MSP.',
      'दालों और तिलहन (तुअर, उड़द, मसूर) की एमएसपी पर सीधी सरकारी खरीद का पोर्टल।',
      'ಬೇಳೆಕಾಳು ಮತ್ತು ಎಣ್ಣೆಕಾಳುಗಳ (ತೊಗರಿ, ಉದ್ದು, ಮಸೂರ) ಎಂಎಸ್‌ಪಿ ದರದಲ್ಲಿ ನೇರ ಸರ್ಕಾರಿ ಖರೀದಿ ಪೋರ್ಟಲ್.'
    ),
    portal: { name: 'e-Samridhi Portal', url: 'https://esamridhi.in' },
  },
  {
    id: 'pmmsy',
    name: 'PM Matsya Sampada (PMMSY)',
    category: 'fisheries',
    benefit: L(
      '40% to 60% financial assistance and credit links for fisheries, aquaculture, and pond creation.',
      'मत्स्य पालन, जलीय कृषि और तालाब निर्माण के लिए 40% से 60% वित्तीय सहायता और ऋण जुड़ाव।',
      'ಮೀನುಗಾರಿಕೆ, ಜಲಕೃಷಿ ಮತ್ತು ಕೊಳ ನಿರ್ಮಾಣಕ್ಕೆ 40% ರಿಂದ 60% ಆರ್ಥಿಕ ನೆರವು ಮತ್ತು ಸಾಲ ಸಂಪರ್ಕ.'
    ),
    portal: { name: 'NFDP Portal', url: 'https://nfdp.dof.gov.in/signup' },
  },
  {
    id: 'pkvy',
    name: 'PKVY (Organic Farming)',
    category: 'organic',
    benefit: L(
      'Financial support of up to ₹50,000/ha over 3 years for cluster organic farming, certification, and packaging.',
      'क्लस्टर जैविक खेती, प्रमाणन और पैकेजिंग के लिए 3 वर्षों में ₹50,000/हेक्टेयर तक की सहायता।',
      'ಗುಂಪು ಸಾವಯವ ಕೃಷಿ, ಪ್ರಮಾಣೀಕರಣ ಮತ್ತು ಪ್ಯಾಕೇಜಿಂಗ್‌ಗೆ 3 ವರ್ಷಗಳಲ್ಲಿ ಹೆಕ್ಟೇರ್‌ಗೆ ₹50,000 ವರೆಗೆ ನೆರವು.'
    ),
    portal: { name: 'PGS India Portal', url: 'https://pgsindia-ncof.gov.in' },
  },
  {
    id: 'myscheme',
    name: 'myScheme National Portal',
    category: 'discovery',
    relevant: true,
    benefit: L(
      'Centralized search engine allowing farmers to enter land size and state to discover all eligible central/state schemes.',
      'केंद्रीकृत खोज पोर्टल – ज़मीन का आकार और राज्य डालकर सभी पात्र केंद्रीय/राज्य योजनाएं खोजें।',
      'ಕೇಂದ್ರೀಕೃತ ಹುಡುಕಾಟ ಪೋರ್ಟಲ್ – ಜಮೀನಿನ ಗಾತ್ರ ಮತ್ತು ರಾಜ್ಯ ನಮೂದಿಸಿ ಎಲ್ಲಾ ಅರ್ಹ ಕೇಂದ್ರ/ರಾಜ್ಯ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ.'
    ),
    portal: { name: 'myScheme Portal', url: 'https://myscheme.gov.in' },
  },
];

export const schemeCategories = [...new Set(schemes.map((s) => s.category))];

/** Whether a scheme is likely relevant for this farmer (profile land size + active crops). */
export const isRelevant = (s, profile, crops) =>
  !!s.relevant &&
  (s.maxAcres ? Number(profile.landSize) <= s.maxAcres : true) &&
  (!s.needsCrop || crops.some((c) => c.cropId === s.needsCrop));

export const portalHost = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
