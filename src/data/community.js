const L = (en, hi, kn) => ({ en, hi, kn });

export const experts = [
  {
    id: 'e1',
    name: L('Dr. Lakshmi Narayan', 'डॉ. लक्ष्मी नारायण', 'ಡಾ. ಲಕ್ಷ್ಮೀ ನಾರಾಯಣ್'),
    field: L('Millets & dryland crops', 'मोटा अनाज और असिंचित फसलें', 'ಸಿರಿಧಾನ್ಯ ಮತ್ತು ಒಣಬೇಸಾಯ'),
    org: L('KVK Mandya (demo)', 'केवीके मांड्या (डेमो)', 'ಕೆವಿಕೆ ಮಂಡ್ಯ (ಡೆಮೊ)'),
    langs: ['en', 'hi', 'kn'],
    years: 18,
    rating: 4.8,
    available: true,
    slots: ['10:00', '11:30', '16:00'],
  },
  {
    id: 'e2',
    name: L('Mr. Suresh Patil', 'श्री सुरेश पाटिल', 'ಶ್ರೀ ಸುರೇಶ್ ಪಾಟೀಲ್'),
    field: L('Plant protection & disease', 'पौध संरक्षण और रोग', 'ಸಸ್ಯ ಸಂರಕ್ಷಣೆ ಮತ್ತು ರೋಗ'),
    org: L('Agriculture Dept. (demo)', 'कृषि विभाग (डेमो)', 'ಕೃಷಿ ಇಲಾಖೆ (ಡೆಮೊ)'),
    langs: ['kn', 'hi'],
    years: 12,
    rating: 4.6,
    available: true,
    slots: ['09:30', '14:00', '17:00'],
  },
  {
    id: 'e3',
    name: L('Dr. Anitha Rao', 'डॉ. अनीता राव', 'ಡಾ. ಅನಿತಾ ರಾವ್'),
    field: L('Soil health & fertilizers', 'मिट्टी स्वास्थ्य और उर्वरक', 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಮತ್ತು ಗೊಬ್ಬರ'),
    org: L('UAS Bengaluru (demo)', 'यूएएस बेंगलुरु (डेमो)', 'ಯುಎಎಸ್ ಬೆಂಗಳೂರು (ಡೆಮೊ)'),
    langs: ['en', 'kn'],
    years: 15,
    rating: 4.9,
    available: false,
    slots: ['11:00', '15:30'],
  },
  {
    id: 'e4',
    name: L('Mr. Manjunath', 'श्री मंजुनाथ', 'ಶ್ರೀ ಮಂಜುನಾಥ'),
    field: L('Market & post-harvest', 'बाज़ार और कटाई के बाद', 'ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಕೊಯ್ಲೋತ್ತರ'),
    org: L('FPO Advisor (demo)', 'एफपीओ सलाहकार (डेमो)', 'ಎಫ್‌ಪಿಒ ಸಲಹೆಗಾರ (ಡೆಮೊ)'),
    langs: ['kn', 'en'],
    years: 9,
    rating: 4.5,
    available: true,
    slots: ['10:30', '12:00', '16:30'],
  },
];

export const initialDiscussions = [
  {
    id: 'd1',
    author: L('Farmer, Maddur', 'किसान, मद्दूर', 'ರೈತ, ಮದ್ದೂರು'),
    q: L('Brown spots on ragi leaves after cloudy days. What should I do?', 'बादल वाले दिनों के बाद रागी के पत्तों पर भूरे धब्बे। क्या करूं?', 'ಮೋಡದ ದಿನಗಳ ನಂತರ ರಾಗಿ ಎಲೆಗಳಲ್ಲಿ ಕಂದು ಕಲೆಗಳು. ಏನು ಮಾಡಬೇಕು?'),
    answers: [
      { by: L('Dr. Lakshmi Narayan', 'डॉ. लक्ष्मी नारायण', 'ಡಾ. ಲಕ್ಷ್ಮೀ ನಾರಾಯಣ್'), text: L('Likely leaf blast. Avoid excess nitrogen and spray a recommended fungicide on a dry day.', 'संभवतः पत्ती ब्लास्ट। ज़्यादा नाइट्रोजन न दें और सूखे दिन अनुशंसित फफूंदनाशक छिड़कें।', 'ಬಹುಶಃ ಎಲೆ ಬೆಂಕಿರೋಗ. ಹೆಚ್ಚು ಸಾರಜನಕ ಬೇಡ, ಒಣ ದಿನ ಶಿಫಾರಸು ಮಾಡಿದ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಿಸಿ.') },
    ],
    helpful: 24,
    ago: L('2 h ago', '2 घंटे पहले', '2 ಗಂಟೆ ಹಿಂದೆ'),
  },
  {
    id: 'd2',
    author: L('Farmer, Srirangapatna', 'किसान, श्रीरंगपट्टन', 'ರೈತ, ಶ್ರೀರಂಗಪಟ್ಟಣ'),
    q: L('Which mandi paid best for ragi this week?', 'इस हफ्ते रागी का सबसे अच्छा भाव किस मंडी में मिला?', 'ಈ ವಾರ ರಾಗಿಗೆ ಯಾವ ಮಂಡಿಯಲ್ಲಿ ಉತ್ತಮ ಬೆಲೆ ಸಿಕ್ಕಿತು?'),
    answers: [
      { by: L('Farmer, Mysuru', 'किसान, मैसूरु', 'ರೈತ, ಮೈಸೂರು'), text: L('Bengaluru was best for me, but check transport cost first.', 'मेरे लिए बेंगलुरु सबसे अच्छा रहा, पर पहले ढुलाई खर्च देख लें।', 'ನನಗೆ ಬೆಂಗಳೂರು ಉತ್ತಮ, ಆದರೆ ಮೊದಲು ಸಾಗಣೆ ವೆಚ್ಚ ನೋಡಿ.') },
      { by: L('Farmer, Mandya', 'किसान, मांड्या', 'ರೈತ, ಮಂಡ್ಯ'), text: L('Local APMC was fine and saved me the trip.', 'स्थानीय एपीएमसी ठीक रही और सफर बच गया।', 'ಸ್ಥಳೀಯ ಎಪಿಎಂಸಿ ಸರಿಯಿತ್ತು, ಪ್ರಯಾಣ ಉಳಿಯಿತು.') },
    ],
    helpful: 12,
    ago: L('Yesterday', 'कल', 'ನಿನ್ನೆ'),
  },
  {
    id: 'd3',
    author: L('Farmer, Pandavapura', 'किसान, पांडवपुरा', 'ರೈತ, ಪಾಂಡವಪುರ'),
    q: L('Is drip worth it for half an acre of tomato?', 'आधे एकड़ टमाटर के लिए क्या ड्रिप फायदेमंद है?', 'ಅರ್ಧ ಎಕರೆ ಟೊಮೆಟೊಗೆ ಹನಿ ನೀರಾವರಿ ಲಾಭದಾಯಕವೇ?'),
    answers: [
      { by: L('Mr. Suresh Patil', 'श्री सुरेश पाटिल', 'ಶ್ರೀ ಸುರೇಶ್ ಪಾಟೀಲ್'), text: L('Yes, it saves water and reduces leaf diseases. Check the subsidy scheme first.', 'हाँ, पानी बचता है और पत्तों के रोग कम होते हैं। पहले सब्सिडी योजना देखें।', 'ಹೌದು, ನೀರು ಉಳಿಯುತ್ತದೆ ಮತ್ತು ಎಲೆ ರೋಗ ಕಡಿಮೆಯಾಗುತ್ತದೆ. ಮೊದಲು ಸಹಾಯಧನ ಯೋಜನೆ ನೋಡಿ.') },
    ],
    helpful: 18,
    ago: L('2 days ago', '2 दिन पहले', '2 ದಿನಗಳ ಹಿಂದೆ'),
  },
];

export const faqs = [
  {
    id: 'f1',
    q: L('How do I know when to harvest ragi?', 'रागी की कटाई कब करनी चाहिए?', 'ರಾಗಿ ಕೊಯ್ಲು ಯಾವಾಗ ಮಾಡಬೇಕು?'),
    a: L('When most earheads turn brown and grains are hard, about 100–115 days after sowing.', 'जब अधिकतर बालियां भूरी हो जाएं और दाने सख्त हों, बुवाई के लगभग 100–115 दिन बाद।', 'ಹೆಚ್ಚಿನ ತೆನೆಗಳು ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿ ಕಾಳು ಗಟ್ಟಿಯಾದಾಗ, ಬಿತ್ತನೆಯಾದ ಸುಮಾರು 100–115 ದಿನಗಳ ನಂತರ.'),
  },
  {
    id: 'f2',
    q: L('How much water does ragi need?', 'रागी को कितना पानी चाहिए?', 'ರಾಗಿಗೆ ಎಷ್ಟು ನೀರು ಬೇಕು?'),
    a: L('Ragi is hardy. Usually 3–4 irrigations in dry spells are enough; avoid waterlogging.', 'रागी मज़बूत फसल है। सूखे दौर में आमतौर पर 3–4 सिंचाई काफी हैं; जलभराव से बचें।', 'ರಾಗಿ ಗಟ್ಟಿಮುಟ್ಟಾದ ಬೆಳೆ. ಬರದ ಸಮಯದಲ್ಲಿ ಸಾಮಾನ್ಯವಾಗಿ 3–4 ನೀರಾವರಿ ಸಾಕು; ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿ.'),
  },
  {
    id: 'f3',
    q: L('Where can I get a soil test?', 'मिट्टी की जांच कहाँ करवाऊं?', 'ಮಣ್ಣು ಪರೀಕ್ಷೆ ಎಲ್ಲಿ ಮಾಡಿಸಬಹುದು?'),
    a: L('At your Raita Samparka Kendra, KVK or district soil lab. Many tests are free.', 'अपने रैयत संपर्क केंद्र, केवीके या ज़िला मिट्टी प्रयोगशाला में। कई जांच मुफ़्त हैं।', 'ನಿಮ್ಮ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ, ಕೆವಿಕೆ ಅಥವಾ ಜಿಲ್ಲಾ ಮಣ್ಣು ಪ್ರಯೋಗಾಲಯದಲ್ಲಿ. ಅನೇಕ ಪರೀಕ್ಷೆಗಳು ಉಚಿತ.'),
  },
  {
    id: 'f4',
    q: L('What if heavy rain damages my crop?', 'भारी बारिश से फसल खराब हो जाए तो?', 'ಭಾರಿ ಮಳೆಯಿಂದ ಬೆಳೆ ಹಾನಿಯಾದರೆ?'),
    a: L('Take dated photos and report to your insurer or bank within 72 hours if you are enrolled in crop insurance.', 'तारीख वाली फोटो लें और फसल बीमा में नामांकित हों तो 72 घंटे के भीतर बीमा कंपनी या बैंक को बताएं।', 'ದಿನಾಂಕ ಇರುವ ಫೋಟೋ ತೆಗೆದು, ಬೆಳೆ ವಿಮೆಯಲ್ಲಿ ನೋಂದಾಯಿಸಿದ್ದರೆ 72 ಗಂಟೆಗಳೊಳಗೆ ವಿಮಾ ಕಂಪನಿ ಅಥವಾ ಬ್ಯಾಂಕ್‌ಗೆ ತಿಳಿಸಿ.'),
  },
];
