import { addDays } from '../utils/date';

const L = (en, hi, kn) => ({ en, hi, kn });

export const taskCategories = ['sowing', 'irrigation', 'fertilizer', 'inspection', 'harvest', 'weather', 'other'];

export const categoryStyle = {
  sowing: { bg: 'bg-moss-100', text: 'text-moss-600', dot: 'bg-moss-400' },
  irrigation: { bg: 'bg-sky-100', text: 'text-sky-500', dot: 'bg-sky-500' },
  fertilizer: { bg: 'bg-earth-100', text: 'text-earth-600', dot: 'bg-earth-500' },
  inspection: { bg: 'bg-forest-50', text: 'text-forest-600', dot: 'bg-forest-500' },
  harvest: { bg: 'bg-clay-100', text: 'text-clay-600', dot: 'bg-clay-500' },
  weather: { bg: 'bg-sky-100', text: 'text-sky-500', dot: 'bg-sky-500' },
  other: { bg: 'bg-cream-200', text: 'text-forest-700', dot: 'bg-forest-400' },
};

export const initialTasks = () => [
  { id: 't1', title: L('Inspect ragi leaves for blast spots', 'रागी के पत्तों पर ब्लास्ट के धब्बे जांचें', 'ರಾಗಿ ಎಲೆಗಳಲ್ಲಿ ಬೆಂಕಿರೋಗದ ಕಲೆ ಪರೀಕ್ಷಿಸಿ'), date: addDays(0), category: 'inspection', cropId: 'ragi', done: false },
  { id: 't2', title: L('Skip irrigation – rain expected', 'सिंचाई छोड़ें – बारिश की संभावना', 'ನೀರಾವರಿ ಬೇಡ – ಮಳೆ ನಿರೀಕ್ಷೆ'), date: addDays(1), category: 'weather', cropId: 'ragi', done: false },
  { id: 't3', title: L('Clear field drains before heavy rain', 'भारी बारिश से पहले खेत की नालियां साफ़ करें', 'ಭಾರಿ ಮಳೆಗೆ ಮುನ್ನ ಹೊಲದ ಚರಂಡಿ ಸ್ವಚ್ಛಗೊಳಿಸಿ'), date: addDays(1), category: 'weather', cropId: null, done: false },
  { id: 't4', title: L('Top-dress urea in ragi (after rain)', 'रागी में यूरिया की ऊपरी खाद (बारिश के बाद)', 'ರಾಗಿಗೆ ಯೂರಿಯಾ ಮೇಲುಗೊಬ್ಬರ (ಮಳೆ ನಂತರ)'), date: addDays(3), category: 'fertilizer', cropId: 'ragi', done: false },
  { id: 't5', title: L('Spray fungicide on tomato (dry day only)', 'टमाटर पर फफूंदनाशक छिड़कें (केवल सूखे दिन)', 'ಟೊಮೆಟೊಗೆ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಿಸಿ (ಒಣ ದಿನ ಮಾತ್ರ)'), date: addDays(4), category: 'inspection', cropId: 'tomato', done: false },
  { id: 't6', title: L('Run tomato drip for 20 minutes', 'टमाटर में 20 मिनट ड्रिप चलाएं', 'ಟೊಮೆಟೊಗೆ 20 ನಿಮಿಷ ಹನಿ ನೀರಾವರಿ'), date: addDays(5), category: 'irrigation', cropId: 'tomato', done: false },
  { id: 't7', title: L('Sow cowpea as intercrop', 'अंतरफसल के रूप में लोबिया बोएं', 'ಅಂತರ ಬೆಳೆಯಾಗಿ ಅಲಸಂದೆ ಬಿತ್ತನೆ'), date: addDays(8), category: 'sowing', cropId: null, done: false },
  { id: 't8', title: L('Apply for Raita Siri millet incentive', 'रैता सिरी मोटा अनाज प्रोत्साहन के लिए आवेदन', 'ರೈತ ಸಿರಿ ಸಿರಿಧಾನ್ಯ ಪ್ರೋತ್ಸಾಹಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ'), date: addDays(9), category: 'other', cropId: 'ragi', done: false },
  { id: 't9', title: L('Check ragi at panicle initiation', 'बाली बनने की अवस्था में रागी जांचें', 'ತೆನೆ ಬರುವ ಹಂತದಲ್ಲಿ ರಾಗಿ ಪರೀಕ್ಷಿಸಿ'), date: addDays(14), category: 'inspection', cropId: 'ragi', done: false },
  { id: 't10', title: L('Expected ragi harvest window', 'रागी कटाई की अनुमानित अवधि', 'ರಾಗಿ ಕೊಯ್ಲಿನ ನಿರೀಕ್ಷಿತ ಅವಧಿ'), date: addDays(70), category: 'harvest', cropId: 'ragi', done: false },
  { id: 't11', title: L('Weeding in ragi', 'रागी में निराई', 'ರಾಗಿಯಲ್ಲಿ ಕಳೆ ತೆಗೆಯುವುದು'), date: addDays(-2), category: 'inspection', cropId: 'ragi', done: true },
  { id: 't12', title: L('Basal fertilizer in maize', 'मक्के में बेसल खाद', 'ಮೆಕ್ಕೆಜೋಳಕ್ಕೆ ಮೂಲ ಗೊಬ್ಬರ'), date: addDays(-8), category: 'fertilizer', cropId: 'maize', done: true },
];

export const initialNotifications = () => [
  { id: 'n1', type: 'alert', read: false, title: L('Heavy rain alert', 'भारी बारिश की चेतावनी', 'ಭಾರಿ ಮಳೆ ಎಚ್ಚರಿಕೆ'), body: L('About 22 mm rain in 2 days. Clear drains.', '2 दिन में लगभग 22 मिमी बारिश। नालियां साफ़ करें।', '2 ದಿನಗಳಲ್ಲಿ ಸುಮಾರು 22 ಮಿಮೀ ಮಳೆ. ಚರಂಡಿ ಸ್ವಚ್ಛಗೊಳಿಸಿ.'), to: '/weather' },
  { id: 'n2', type: 'market', read: false, title: L('Ragi price rising', 'रागी के भाव बढ़ रहे हैं', 'ರಾಗಿ ಬೆಲೆ ಏರುತ್ತಿದೆ'), body: L('Bengaluru is paying the most this week.', 'इस हफ्ते बेंगलुरु में सबसे अच्छा भाव।', 'ಈ ವಾರ ಬೆಂಗಳೂರಿನಲ್ಲಿ ಹೆಚ್ಚು ಬೆಲೆ.'), to: '/market' },
  { id: 'n3', type: 'scheme', read: false, title: L('Scheme deadline', 'योजना की अंतिम तारीख', 'ಯೋಜನೆ ಗಡುವು'), body: L('Raita Siri applications close in 9 days.', 'रैता सिरी के आवेदन 9 दिन में बंद।', 'ರೈತ ಸಿರಿ ಅರ್ಜಿಗಳು 9 ದಿನಗಳಲ್ಲಿ ಮುಕ್ತಾಯ.'), to: '/schemes' },
  { id: 'n4', type: 'task', read: true, title: L('Task due today', 'आज का काम', 'ಇಂದಿನ ಕೆಲಸ'), body: L('Inspect ragi leaves for blast spots.', 'रागी के पत्तों पर ब्लास्ट के धब्बे जांचें।', 'ರಾಗಿ ಎಲೆಗಳಲ್ಲಿ ಬೆಂಕಿರೋಗದ ಕಲೆ ಪರೀಕ್ಷಿಸಿ.'), to: '/calendar' },
];
