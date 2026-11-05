/** Demo directory data for the Help tab. Names, numbers and stock are placeholders, not real listings. */
const L = (en, hi, kn) => ({ en, hi, kn });

export const EXPERT_ROLES = ['agronomist', 'kvk', 'protection', 'horticulture', 'soil'];

export const helpExperts = [
  {
    id: 'x1', role: 'kvk', km: 6, langs: ['kn', 'en'], crops: ['ragi', 'paddy', 'maize'], available: true, rating: 4.8, years: 16,
    name: L('Dr. K. Shivakumar', 'डॉ. के. शिवकुमार', 'ಡಾ. ಕೆ. ಶಿವಕುಮಾರ್'),
    org: L('Krishi Vigyan Kendra, Mandya (demo)', 'कृषि विज्ञान केंद्र, मांड्या (डेमो)', 'ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಮಂಡ್ಯ (ಡೆಮೊ)'),
    slots: ['10:00', '11:30', '15:00'],
  },
  {
    id: 'x2', role: 'protection', km: 12, langs: ['kn', 'hi', 'en'], crops: ['tomato', 'ragi', 'maize'], available: true, rating: 4.6, years: 11,
    name: L('Smt. Asha Hegde', 'श्रीमती आशा हेगड़े', 'ಶ್ರೀಮತಿ ಆಶಾ ಹೆಗಡೆ'),
    org: L('Raita Samparka Kendra (demo)', 'रैयत संपर्क केंद्र (डेमो)', 'ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (ಡೆಮೊ)'),
    slots: ['09:30', '12:00', '16:30'],
  },
  {
    id: 'x3', role: 'agronomist', km: 22, langs: ['en', 'hi'], crops: ['maize', 'paddy', 'groundnut'], available: false, rating: 4.7, years: 9,
    name: L('Mr. Rahul Verma', 'श्री राहुल वर्मा', 'ಶ್ರೀ ರಾಹುಲ್ ವರ್ಮಾ'),
    org: L('Agri advisory (demo)', 'कृषि सलाह केंद्र (डेमो)', 'ಕೃಷಿ ಸಲಹಾ ಕೇಂದ್ರ (ಡೆಮೊ)'),
    slots: ['11:00', '17:00'],
  },
  {
    id: 'x4', role: 'horticulture', km: 18, langs: ['kn', 'en'], crops: ['tomato'], available: true, rating: 4.5, years: 13,
    name: L('Mr. N. Prakash', 'श्री एन. प्रकाश', 'ಶ್ರೀ ಎನ್. ಪ್ರಕಾಶ್'),
    org: L('Horticulture Dept. (demo)', 'बागवानी विभाग (डेमो)', 'ತೋಟಗಾರಿಕೆ ಇಲಾಖೆ (ಡೆಮೊ)'),
    slots: ['10:30', '14:30'],
  },
  {
    id: 'x5', role: 'soil', km: 38, langs: ['kn', 'hi', 'en'], crops: ['ragi', 'paddy', 'tomato', 'maize', 'groundnut'], available: true, rating: 4.9, years: 20,
    name: L('Dr. Meena Rao', 'डॉ. मीना राव', 'ಡಾ. ಮೀನಾ ರಾವ್'),
    org: L('Soil testing lab (demo)', 'मिट्टी जांच प्रयोगशाला (डेमो)', 'ಮಣ್ಣು ಪರೀಕ್ಷಾ ಪ್ರಯೋಗಾಲಯ (ಡೆಮೊ)'),
    slots: ['09:00', '13:00', '16:00'],
  },
];

export const RESOURCE_TYPES = ['seed', 'fertilizer', 'cold', 'mandi'];

/** x/y place pins on the schematic map (0–100). Stock tags: { label, level: 'in'|'low'|'out' }. */
export const resources = [
  {
    id: 'r1', type: 'seed', km: 3.5, x: 58, y: 40, hours: '9:00 – 18:00', phone: '0823x-xxxx01',
    name: L('Raita Samparka Kendra – seed counter', 'रैयत संपर्क केंद्र – बीज काउंटर', 'ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ – ಬೀಜ ಕೌಂಟರ್'),
    town: 'Mandya',
    stock: [
      { label: L('Ragi seed', 'रागी बीज', 'ರಾಗಿ ಬೀಜ'), level: 'in' },
      { label: L('Cowpea seed', 'लोबिया बीज', 'ಅಲಸಂದೆ ಬೀಜ'), level: 'low' },
    ],
  },
  {
    id: 'r2', type: 'fertilizer', km: 2.1, x: 44, y: 56, hours: '8:30 – 20:00', phone: '0823x-xxxx02',
    name: L('Grama Agro Centre', 'ग्राम एग्रो सेंटर', 'ಗ್ರಾಮ ಆಗ್ರೋ ಕೇಂದ್ರ'),
    town: 'Kikkeri',
    stock: [
      { label: L('Urea', 'यूरिया', 'ಯೂರಿಯಾ'), level: 'in' },
      { label: L('DAP', 'डीएपी', 'ಡಿಎಪಿ'), level: 'low' },
      { label: L('Neem cake', 'नीम खली', 'ಬೇವಿನ ಹಿಂಡಿ'), level: 'in' },
    ],
  },
  {
    id: 'r3', type: 'fertilizer', km: 9.8, x: 75, y: 70, hours: '9:00 – 19:00', phone: '0823x-xxxx03',
    name: L('PACS Cooperative Store', 'पैक्स सहकारी स्टोर', 'ಪ್ಯಾಕ್ಸ್ ಸಹಕಾರಿ ಮಳಿಗೆ'),
    town: 'Krishnarajpet',
    stock: [
      { label: L('Urea', 'यूरिया', 'ಯೂರಿಯಾ'), level: 'out' },
      { label: L('Potash (MOP)', 'पोटाश (एमओपी)', 'ಪೊಟ್ಯಾಷ್ (ಎಂಒಪಿ)'), level: 'in' },
    ],
  },
  {
    id: 'r4', type: 'cold', km: 14, x: 22, y: 30, hours: '24 × 7', phone: '0823x-xxxx04',
    name: L('Farm Fresh Cold Storage', 'फार्म फ्रेश कोल्ड स्टोरेज', 'ಫಾರ್ಮ್ ಫ್ರೆಶ್ ಶೀತಲ ಗೃಹ'),
    town: 'Mandya',
    stock: [{ label: L('Space available', 'जगह उपलब्ध', 'ಸ್ಥಳ ಲಭ್ಯ'), level: 'in' }],
  },
  {
    id: 'r5', type: 'mandi', km: 8, x: 66, y: 22, hours: '6:00 – 14:00', phone: '0823x-xxxx05',
    name: L('Mandya APMC Yard', 'मांड्या एपीएमसी यार्ड', 'ಮಂಡ್ಯ ಎಪಿಎಂಸಿ ಪ್ರಾಂಗಣ'),
    town: 'Mandya',
    stock: [
      { label: L('Ragi trading today', 'आज रागी का व्यापार', 'ಇಂದು ರಾಗಿ ವಹಿವಾಟು'), level: 'in' },
      { label: L('Tomato arrivals high', 'टमाटर की आवक ज़्यादा', 'ಟೊಮೆಟೊ ಆವಕ ಹೆಚ್ಚು'), level: 'low' },
    ],
  },
  {
    id: 'r6', type: 'mandi', km: 47, x: 12, y: 78, hours: '5:30 – 13:00', phone: '0821x-xxxx06',
    name: L('Mysuru APMC (Bandipalya)', 'मैसूरु एपीएमसी (बंडीपाल्या)', 'ಮೈಸೂರು ಎಪಿಎಂಸಿ (ಬಂಡೀಪಾಳ್ಯ)'),
    town: 'Mysuru',
    stock: [{ label: L('Ragi trading today', 'आज रागी का व्यापार', 'ಇಂದು ರಾಗಿ ವಹಿವಾಟು'), level: 'in' }],
  },
];
