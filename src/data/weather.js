import { addDays } from '../utils/date';

const L = (en, hi, kn) => ({ en, hi, kn });

export const currentWeather = {
  temp: 28,
  feels: 30,
  humidity: 72,
  rainChance: 70,
  wind: 14,
  condition: 'partly',
  high: 29,
  low: 21,
  soilMoisture: 46,
  sunrise: '06:12',
  sunset: '18:24',
};

/** 7-day forecast. Day 0 is today. */
export const forecast = () =>
  [
    { cond: 'partly', hi: 29, lo: 21, rain: 30, mm: 1, wind: 14 },
    { cond: 'rain', hi: 27, lo: 21, rain: 70, mm: 9, wind: 18 },
    { cond: 'heavyRain', hi: 25, lo: 20, rain: 85, mm: 22, wind: 26 },
    { cond: 'rain', hi: 26, lo: 20, rain: 55, mm: 6, wind: 16 },
    { cond: 'cloudy', hi: 28, lo: 21, rain: 25, mm: 0, wind: 12 },
    { cond: 'partly', hi: 30, lo: 21, rain: 10, mm: 0, wind: 10 },
    { cond: 'sunny', hi: 31, lo: 22, rain: 5, mm: 0, wind: 9 },
  ].map((d, i) => ({ ...d, date: addDays(i) }));

export const weatherAlerts = [
  {
    id: 'a1',
    level: 'high',
    title: L('Heavy rain expected in 2 days', '2 दिन में भारी बारिश की संभावना', '2 ದಿನಗಳಲ್ಲಿ ಭಾರಿ ಮಳೆ ನಿರೀಕ್ಷೆ'),
    body: L(
      'About 22 mm possible. Clear drains in your fields and avoid spraying or fertilizer until it passes.',
      'लगभग 22 मिमी बारिश संभव। खेत की नालियां साफ़ करें और बारिश रुकने तक छिड़काव या खाद न दें।',
      'ಸುಮಾರು 22 ಮಿಮೀ ಮಳೆ ಸಾಧ್ಯ. ಹೊಲದ ಚರಂಡಿಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ; ಮಳೆ ಮುಗಿಯುವವರೆಗೆ ಸಿಂಪಡಣೆ ಅಥವಾ ಗೊಬ್ಬರ ಬೇಡ.'
    ),
  },
  {
    id: 'a2',
    level: 'medium',
    title: L('Strong winds on Thursday', 'गुरुवार को तेज़ हवा', 'ಗುರುವಾರ ಬಲವಾದ ಗಾಳಿ'),
    body: L(
      'Gusts up to 26 km/h. Tie up tomato plants and support young maize.',
      '26 किमी/घंटा तक की हवा। टमाटर के पौधे बांधें और छोटे मक्के को सहारा दें।',
      '26 ಕಿಮೀ/ಗಂ ವರೆಗೆ ಗಾಳಿ. ಟೊಮೆಟೊ ಗಿಡಗಳನ್ನು ಕಟ್ಟಿ ಮತ್ತು ಎಳೆಯ ಮೆಕ್ಕೆಜೋಳಕ್ಕೆ ಆಧಾರ ನೀಡಿ.'
    ),
  },
  {
    id: 'a3',
    level: 'low',
    title: L('Humid, cloudy spell – disease watch', 'नम और बादल वाला दौर – रोग पर नज़र', 'ತೇವ, ಮೋಡದ ವಾತಾವರಣ – ರೋಗದ ಮೇಲೆ ಗಮನ'),
    body: L(
      'Conditions favour blast in ragi and blight in tomato. Inspect leaves after the rain.',
      'ऐसा मौसम रागी में ब्लास्ट और टमाटर में झुलसा के लिए अनुकूल है। बारिश के बाद पत्ते जांचें।',
      'ಇಂತಹ ಹವೆ ರಾಗಿಯಲ್ಲಿ ಬೆಂಕಿರೋಗ ಮತ್ತು ಟೊಮೆಟೊದಲ್ಲಿ ಅಂಗಮಾರಿಗೆ ಅನುಕೂಲ. ಮಳೆಯ ನಂತರ ಎಲೆಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ.'
    ),
  },
];

export const dashboardAdvisory = L(
  'Rain is likely tomorrow. Skip irrigation for ragi and avoid spraying today.',
  'कल बारिश की संभावना है। रागी में सिंचाई रोकें और आज छिड़काव न करें।',
  'ನಾಳೆ ಮಳೆ ಸಾಧ್ಯತೆ ಇದೆ. ರಾಗಿಗೆ ನೀರಾವರಿ ಬೇಡ, ಇಂದು ಸಿಂಪಡಣೆ ಮಾಡಬೇಡಿ.'
);

export const irrigationAdvice = {
  verdict: 'skip',
  title: L('Do not irrigate tomorrow', 'कल सिंचाई न करें', 'ನಾಳೆ ನೀರಾವರಿ ಬೇಡ'),
  summary: L(
    'About 9 mm rain is expected tomorrow and 22 mm the day after. Your ragi is in the tillering stage and soil moisture is already 46%, so extra water would be wasted.',
    'कल लगभग 9 मिमी और परसों 22 मिमी बारिश की संभावना है। आपकी रागी कल्ले निकलने की अवस्था में है और मिट्टी में पहले से 46% नमी है, इसलिए अतिरिक्त पानी बेकार जाएगा।',
    'ನಾಳೆ ಸುಮಾರು 9 ಮಿಮೀ ಮತ್ತು ನಾಡಿದ್ದು 22 ಮಿಮೀ ಮಳೆ ನಿರೀಕ್ಷೆ. ನಿಮ್ಮ ರಾಗಿ ಟಿಲ್ಲರಿಂಗ್ ಹಂತದಲ್ಲಿದೆ ಮತ್ತು ಮಣ್ಣಿನಲ್ಲಿ ಈಗಾಗಲೇ 46% ತೇವಾಂಶ ಇದೆ, ಆದ್ದರಿಂದ ಹೆಚ್ಚುವರಿ ನೀರು ವ್ಯರ್ಥ.'
  ),
  reasons: [
    L('Rain chance tomorrow: 70%', 'कल बारिश की संभावना: 70%', 'ನಾಳೆ ಮಳೆ ಸಾಧ್ಯತೆ: 70%'),
    L('Soil moisture: 46% (adequate)', 'मिट्टी की नमी: 46% (पर्याप्त)', 'ಮಣ್ಣಿನ ತೇವಾಂಶ: 46% (ಸಾಕಷ್ಟು)'),
    L('Ragi stage: tillering – needs moisture, not waterlogging', 'रागी की अवस्था: कल्ले – नमी चाहिए, जलभराव नहीं', 'ರಾಗಿ ಹಂತ: ಟಿಲ್ಲರಿಂಗ್ – ತೇವ ಬೇಕು, ನೀರು ನಿಲ್ಲಬಾರದು'),
  ],
  next: L(
    'Re-check on Saturday. If rain stays below 5 mm, irrigate lightly on Sunday morning.',
    'शनिवार को फिर देखें। अगर बारिश 5 मिमी से कम रही तो रविवार सुबह हल्की सिंचाई करें।',
    'ಶನಿವಾರ ಮತ್ತೆ ನೋಡಿ. ಮಳೆ 5 ಮಿಮೀ ಗಿಂತ ಕಡಿಮೆ ಇದ್ದರೆ ಭಾನುವಾರ ಬೆಳಿಗ್ಗೆ ಹಗುರವಾಗಿ ನೀರು ಹಾಯಿಸಿ.'
  ),
};

export const tomatoAdvice = L(
  'Tomato (drip): run drip only for 20 min on Saturday if no rain; keep leaves dry.',
  'टमाटर (ड्रिप): बारिश न हो तो शनिवार को केवल 20 मिनट ड्रिप चलाएं; पत्ते सूखे रखें।',
  'ಟೊಮೆಟೊ (ಹನಿ): ಮಳೆ ಇಲ್ಲದಿದ್ದರೆ ಶನಿವಾರ ಕೇವಲ 20 ನಿಮಿಷ ಹನಿ ನೀರು ಹಾಯಿಸಿ; ಎಲೆಗಳು ಒಣಗಿರಲಿ.'
);
