/**
 * Local, simulated AI engine. Replace `getAssistantReply` / `analyzeLeaf` with
 * real API calls later – the signatures are intentionally async-friendly.
 */
import { todayPrices } from './markets';
import { translate } from '../translations';
import { APP_NAME } from '../config/brand';
import { conditionFromCode } from '../services/weather';
import { alertText, dayLabel, fmt, placeLabel } from '../utils/weatherText';

const L = (en, hi, kn) => ({ en, hi, kn });

export const suggestedPrompts = [
  { id: 'irrigate', text: L('When should I irrigate my crop?', 'मुझे अपनी फसल की सिंचाई कब करनी चाहिए?', 'ನನ್ನ ಬೆಳೆಗೆ ಯಾವಾಗ ನೀರು ಹಾಯಿಸಬೇಕು?') },
  { id: 'weather', text: L("Will tomorrow's weather affect my field?", 'कल का मौसम मेरे खेत पर असर डालेगा?', 'ನಾಳೆಯ ಹವಾಮಾನ ನನ್ನ ಹೊಲದ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆಯೇ?') },
  { id: 'fert', text: L('What fertilizer should I use?', 'मुझे कौन सी खाद डालनी चाहिए?', 'ನಾನು ಯಾವ ಗೊಬ್ಬರ ಬಳಸಬೇಕು?') },
  { id: 'disease', text: L('How do I identify crop diseases?', 'फसल की बीमारियां कैसे पहचानें?', 'ಬೆಳೆ ರೋಗಗಳನ್ನು ಹೇಗೆ ಗುರುತಿಸುವುದು?') },
  { id: 'schemes', text: L('Which government schemes am I eligible for?', 'मैं किन सरकारी योजनाओं के लिए पात्र हूं?', 'ನನಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಸಿಗುತ್ತವೆ?') },
];

/** The scripted demo question for the central journey, per language. */
export const demoQuestion = L(
  'Should I irrigate my ragi crop tomorrow?',
  'क्या मुझे कल अपनी रागी की फसल की सिंचाई करनी चाहिए?',
  'ನಾಳೆ ನನ್ನ ರಾಗಿ ಬೆಳೆಗೆ ನೀರು ಹಾಯಿಸಬೇಕೇ?'
);

const KEYWORDS = {
  disease: ['disease', 'blast', 'spot', 'pest', 'infect', 'ರೋಗ', 'ಕಲೆ', 'ಕೀಟ', 'रोग', 'बीमारी', 'धब्बे', 'कीट'],
  fert: ['fertili', 'urea', 'dap', 'manure', 'nutrient', 'ಗೊಬ್ಬರ', 'ಯೂರಿಯಾ', 'ರಸಗೊಬ್ಬರ', 'खाद', 'उर्वरक', 'यूरिया'],
  schemes: ['scheme', 'subsid', 'insurance', 'loan', 'pm-kisan', 'eligib', 'ಯೋಜನೆ', 'ಸಹಾಯಧನ', 'ವಿಮೆ', 'योजना', 'सब्सिडी', 'बीमा'],
  price: ['price', 'market', 'mandi', 'sell', 'rate', 'ಬೆಲೆ', 'ಮಾರುಕಟ್ಟೆ', 'ಮಂಡಿ', 'ಮಾರ', 'भाव', 'मंडी', 'बाज़ार', 'बाजार', 'बेच', 'कीमत'],
  irrigate: ['irrigat', 'water', 'ನೀರು', 'ನೀರಾವರಿ', 'सिंचाई', 'पानी'],
  weather: ['weather', 'rain', 'wind', 'forecast', 'ಹವಾಮಾನ', 'ಮಳೆ', 'ಗಾಳಿ', 'मौसम', 'बारिश', 'हवा'],
  harvest: ['harvest', 'ready', 'ಕೊಯ್ಲು', 'कटाई'],
  hello: ['hello', 'hi ', 'namaste', 'ನಮಸ್ಕಾರ', 'नमस्ते'],
};

export function detectIntent(text) {
  const t = ` ${text.toLowerCase()} `;
  const order = ['disease', 'fert', 'schemes', 'price', 'irrigate', 'weather', 'harvest', 'hello'];
  return order.find((k) => KEYWORDS[k].some((w) => t.includes(w))) || 'fallback';
}

const replies = {
  // irrigate / weather replies are generated live – see liveWeatherReply()
  fert: L(
    `**For your ragi (tillering stage, red loam):**\n• Top-dress about 25 kg urea per acre around 30–35 days after sowing – but only after the rain passes (≈ Saturday).\n• Do not apply before heavy rain; nutrients wash away.\n• A free Soil Health Card test will tell you exactly what your soil needs.\n\n*Demo advice – confirm the dose with your local agriculture officer.*`,
    `**आपकी रागी के लिए (कल्ले की अवस्था, लाल दोमट):**\n• बुवाई के 30–35 दिन बाद प्रति एकड़ लगभग 25 किग्रा यूरिया ऊपरी खाद दें – लेकिन बारिश रुकने (लगभग शनिवार) के बाद ही।\n• भारी बारिश से पहले न डालें; पोषक तत्व बह जाते हैं।\n• मृदा स्वास्थ्य कार्ड की मुफ़्त जांच से पता चलेगा कि आपकी मिट्टी को क्या चाहिए।\n\n*डेमो सलाह – मात्रा अपने कृषि अधिकारी से पक्की करें।*`,
    `**ನಿಮ್ಮ ರಾಗಿಗೆ (ಟಿಲ್ಲರಿಂಗ್ ಹಂತ, ಕೆಂಪು ಮಣ್ಣು):**\n• ಬಿತ್ತನೆಯಾದ 30–35 ದಿನಗಳಲ್ಲಿ ಎಕರೆಗೆ ಸುಮಾರು 25 ಕೆ.ಜಿ ಯೂರಿಯಾ ಮೇಲುಗೊಬ್ಬರ ನೀಡಿ – ಆದರೆ ಮಳೆ ನಿಂತ ನಂತರ (ಸುಮಾರು ಶನಿವಾರ) ಮಾತ್ರ.\n• ಭಾರಿ ಮಳೆಗೆ ಮೊದಲು ಹಾಕಬೇಡಿ; ಪೋಷಕಾಂಶ ಕೊಚ್ಚಿ ಹೋಗುತ್ತದೆ.\n• ಉಚಿತ ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಪರೀಕ್ಷೆಯಿಂದ ನಿಮ್ಮ ಮಣ್ಣಿಗೆ ಏನು ಬೇಕೆಂದು ತಿಳಿಯುತ್ತದೆ.\n\n*ಡೆಮೊ ಸಲಹೆ – ಪ್ರಮಾಣವನ್ನು ನಿಮ್ಮ ಕೃಷಿ ಅಧಿಕಾರಿಯಿಂದ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.*`
  ),
  disease: L(
    `**How to spot common problems:**\n• Ragi blast: spindle-shaped grey spots with brown edges on leaves, worse after humid, cloudy days.\n• Tomato early blight: brown rings (target-like) on lower leaves.\n• Maize armyworm: ragged holes and sawdust-like droppings in the whorl.\n\nTap **Crop photo** below or open *My Crops* to upload a leaf photo for a (simulated) analysis.`,
    `**आम समस्याएं कैसे पहचानें:**\n• रागी ब्लास्ट: पत्तों पर भूरे किनारे वाले धूसर तकुए जैसे धब्बे, नम और बादल वाले दिनों के बाद ज़्यादा।\n• टमाटर अगेती झुलसा: निचले पत्तों पर निशाने जैसे भूरे छल्ले।\n• मक्का आर्मीवर्म: पत्तियों में फटे छेद और बुरादे जैसी बीट।\n\nनीचे **फसल फोटो** दबाएं या *मेरी फसलें* में पत्ते की फोटो डालें (नकली विश्लेषण)।`,
    `**ಸಾಮಾನ್ಯ ಸಮಸ್ಯೆಗಳನ್ನು ಗುರುತಿಸುವ ವಿಧಾನ:**\n• ರಾಗಿ ಬೆಂಕಿರೋಗ: ಎಲೆಗಳ ಮೇಲೆ ಕಂದು ಅಂಚಿನ ಬೂದು ಬಣ್ಣದ ಕಲೆಗಳು, ತೇವ ಮೋಡದ ದಿನಗಳ ನಂತರ ಹೆಚ್ಚು.\n• ಟೊಮೆಟೊ ಆರಂಭಿಕ ಅಂಗಮಾರಿ: ಕೆಳಗಿನ ಎಲೆಗಳಲ್ಲಿ ಗುರಿಯಂತಹ ಕಂದು ಉಂಗುರಗಳು.\n• ಮೆಕ್ಕೆಜೋಳ ಸೈನಿಕ ಹುಳು: ಎಲೆಗಳಲ್ಲಿ ಹರಿದ ರಂಧ್ರ ಮತ್ತು ಹುಡಿಯಂತಹ ಹಿಕ್ಕೆ.\n\nಕೆಳಗಿನ **ಬೆಳೆ ಫೋಟೋ** ಒತ್ತಿ ಅಥವಾ *ನನ್ನ ಬೆಳೆಗಳು* ನಲ್ಲಿ ಎಲೆಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (ಅನುಕರಣ ವಿಶ್ಲೇಷಣೆ).`
  ),
  schemes: L(
    `**Likely matches for you (3 acres, Mandya, ragi grower):**\n• Raita Siri – millet incentive (up to ₹10,000/ha)\n• PM Fasal Bima – crop insurance\n• Per Drop More Crop – drip/sprinkler subsidy (small farmer)\n\nOpen *Schemes* for eligibility, documents and how to apply. Always verify details with your Raita Samparka Kendra.`,
    `**आपके लिए संभावित योजनाएं (3 एकड़, मांड्या, रागी किसान):**\n• रैता सिरी – मोटा अनाज प्रोत्साहन (₹10,000/हेक्टेयर तक)\n• पीएम फसल बीमा – फसल बीमा\n• पर ड्रॉप मोर क्रॉप – ड्रिप/स्प्रिंकलर सब्सिडी (छोटे किसान)\n\nपात्रता, दस्तावेज़ और आवेदन के लिए *योजनाएं* खोलें। विवरण हमेशा अपने रैयत संपर्क केंद्र से पक्का करें।`,
    `**ನಿಮಗೆ ಸಾಧ್ಯವಿರುವ ಯೋಜನೆಗಳು (3 ಎಕರೆ, ಮಂಡ್ಯ, ರಾಗಿ ಬೆಳೆಗಾರ):**\n• ರೈತ ಸಿರಿ – ಸಿರಿಧಾನ್ಯ ಪ್ರೋತ್ಸಾಹ (ಹೆಕ್ಟೇರ್‌ಗೆ ₹10,000 ವರೆಗೆ)\n• ಪಿಎಂ ಫಸಲ್ ಬಿಮಾ – ಬೆಳೆ ವಿಮೆ\n• ಪರ್ ಡ್ರಾಪ್ ಮೋರ್ ಕ್ರಾಪ್ – ಹನಿ/ತುಂತುರು ಸಹಾಯಧನ (ಸಣ್ಣ ರೈತ)\n\nಅರ್ಹತೆ, ದಾಖಲೆ ಮತ್ತು ಅರ್ಜಿ ವಿಧಾನಕ್ಕಾಗಿ *ಯೋಜನೆಗಳು* ತೆರೆಯಿರಿ. ವಿವರಗಳನ್ನು ನಿಮ್ಮ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರದಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.`
  ),
  price: L(
    `**Ragi prices (demo data):**\n• Mandya ≈ ₹{m}/quintal, Mysuru ≈ ₹{y}, Bengaluru ≈ ₹{b}.\n• After transport, Bengaluru still pays more than your local mandi.\n• Prices have been drifting up this week. You are ~70 days from harvest, so watch the trend and set a price alert.\n\nSee *Market* for the full comparison and chart.`,
    `**रागी के भाव (डेमो डेटा):**\n• मांड्या ≈ ₹{m}/क्विंटल, मैसूरु ≈ ₹{y}, बेंगलुरु ≈ ₹{b}।\n• ढुलाई के बाद भी बेंगलुरु स्थानीय मंडी से ज़्यादा देता है।\n• इस हफ्ते भाव थोड़े बढ़े हैं। कटाई में लगभग 70 दिन हैं, इसलिए रुझान देखें और भाव अलर्ट लगाएं।\n\nपूरी तुलना और चार्ट के लिए *बाज़ार* देखें।`,
    `**ರಾಗಿ ಬೆಲೆಗಳು (ಡೆಮೊ ಮಾಹಿತಿ):**\n• ಮಂಡ್ಯ ≈ ₹{m}/ಕ್ವಿಂಟಾಲ್, ಮೈಸೂರು ≈ ₹{y}, ಬೆಂಗಳೂರು ≈ ₹{b}.\n• ಸಾಗಣೆ ನಂತರವೂ ಬೆಂಗಳೂರು ಸ್ಥಳೀಯ ಮಂಡಿಗಿಂತ ಹೆಚ್ಚು ನೀಡುತ್ತದೆ.\n• ಈ ವಾರ ಬೆಲೆ ಸ್ವಲ್ಪ ಏರಿದೆ. ಕೊಯ್ಲಿಗೆ ಸುಮಾರು 70 ದಿನ ಇದೆ, ಆದ್ದರಿಂದ ಪ್ರವೃತ್ತಿ ಗಮನಿಸಿ ಮತ್ತು ಬೆಲೆ ಎಚ್ಚರಿಕೆ ಇಡಿ.\n\nಪೂರ್ಣ ಹೋಲಿಕೆ ಮತ್ತು ಚಾರ್ಟ್‌ಗಾಗಿ *ಮಾರುಕಟ್ಟೆ* ನೋಡಿ.`
  ),
  harvest: L(
    `**Ragi harvest:** sown about 40 days ago, so harvest is expected in roughly 70 days. Harvest when most earheads turn brown and grains are hard. Plan dry weather for drying and threshing.`,
    `**रागी की कटाई:** बुवाई को लगभग 40 दिन हुए हैं, इसलिए कटाई लगभग 70 दिन में अपेक्षित है। जब अधिकतर बालियां भूरी और दाने सख्त हों तब काटें। सुखाने और गहाई के लिए सूखे मौसम की योजना बनाएं।`,
    `**ರಾಗಿ ಕೊಯ್ಲು:** ಬಿತ್ತನೆಯಾಗಿ ಸುಮಾರು 40 ದಿನ ಆಗಿದೆ, ಆದ್ದರಿಂದ ಕೊಯ್ಲು ಸುಮಾರು 70 ದಿನಗಳಲ್ಲಿ ನಿರೀಕ್ಷೆ. ಹೆಚ್ಚಿನ ತೆನೆಗಳು ಕಂದಾಗಿ ಕಾಳು ಗಟ್ಟಿಯಾದಾಗ ಕೊಯ್ಲು ಮಾಡಿ. ಒಣಗಿಸಲು ಮತ್ತು ಕಣ ಮಾಡಲು ಒಣ ಹವೆ ಯೋಜಿಸಿ.`
  ),
  hello: L(
    `Namaste! I can help with irrigation, weather, fertilizer, diseases, schemes and market prices for your farm in Mandya. What would you like to know?`,
    `नमस्ते! मैं मांड्या में आपके खेत के लिए सिंचाई, मौसम, खाद, रोग, योजनाओं और बाज़ार भाव में मदद कर सकता हूं। आप क्या जानना चाहेंगे?`,
    `ನಮಸ್ಕಾರ! ಮಂಡ್ಯದ ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ನೀರಾವರಿ, ಹವಾಮಾನ, ಗೊಬ್ಬರ, ರೋಗ, ಯೋಜನೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಬೆಲೆಯ ಬಗ್ಗೆ ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನಿಮಗೆ ಏನು ತಿಳಿಯಬೇಕು?`
  ),
  fallback: L(
    `I am a demo assistant, so I understand a few topics best: **irrigation, weather, fertilizer, diseases, schemes and market prices**. Try one of the suggested questions below.`,
    `मैं एक डेमो सहायक हूं, इसलिए कुछ विषय बेहतर समझता हूं: **सिंचाई, मौसम, खाद, रोग, योजनाएं और बाज़ार भाव**। नीचे दिए सुझाए सवालों में से कोई एक आज़माएं।`,
    `ನಾನು ಡೆಮೊ ಸಹಾಯಕ, ಆದ್ದರಿಂದ ಕೆಲವು ವಿಷಯಗಳನ್ನು ಚೆನ್ನಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತೇನೆ: **ನೀರಾವರಿ, ಹವಾಮಾನ, ಗೊಬ್ಬರ, ರೋಗ, ಯೋಜನೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಬೆಲೆ**. ಕೆಳಗಿನ ಸೂಚಿತ ಪ್ರಶ್ನೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಪ್ರಯತ್ನಿಸಿ.`
  ),
};

/** Irrigation / weather answers come from live Open-Meteo data + the irrigation engine. */
function liveWeatherReply(intent, lang, weather) {
  const t = (k, v) => translate(lang, k, v);
  if (!weather?.data || !weather.decision) return t('wx.notReady');
  const d = weather.data;
  const today = d.daily[0] || {};
  const place = placeLabel(weather, t);
  const st = weather.decision.status;
  if (intent === 'irrigate') {
    return [
      `**${t(`wx.status.${st}`)}**`,
      `• ${t('wx.rain24')}: ${fmt(today.prob)}% · ${t('wx.rainMm')}: ${fmt(today.mm, 1)} ${t('weather.mm')}`,
      `• ${t('weather.temp')}: ${fmt(d.current.temp, 1)}°C · ${t('weather.humidity')}: ${fmt(d.current.humidity)}%`,
      `• ${t(`wx.reason.${st}`)}`,
      '',
      `*${t('wx.liveNote', { place })} ${t('wx.checkSoil')}*`,
    ].join('\n');
  }
  const lines = d.daily.slice(0, 3).map(
    (x) =>
      `• ${dayLabel(x.date, t, lang)}: ${t('cond.' + conditionFromCode(x.code))}, ${fmt(x.hi)}°/${fmt(x.lo)}° · ${t('weather.rain')} ${fmt(x.prob)}% · ${fmt(x.mm, 1)} ${t('weather.mm')}`
  );
  const alerts = weather.alerts.map((a) => {
    const at = alertText(a, t, lang);
    return `• **${at.title}** – ${at.body}`;
  });
  return [
    `**${t('wx.next3')}**`,
    ...lines,
    ...(alerts.length ? ['', ...alerts] : ['', t('wx.noAlerts')]),
    '',
    `**${t('wx.advisory')}: ${t(`wx.status.${st}`)}** – ${t(`wx.reason.${st}`)}`,
    '',
    `*${t('wx.liveNote', { place })}*`,
  ].join('\n');
}

export const replyFor = (intent, lang, weather) => {
  if (intent === 'irrigate' || intent === 'weather') return liveWeatherReply(intent, lang, weather);
  const text = (replies[intent] || replies.fallback)[lang] ?? replies.fallback.en;
  if (intent !== 'price') return text;
  const p = Object.fromEntries(todayPrices('ragi').map((r) => [r.id, r.modal.toLocaleString('en-IN')]));
  return text.replace('{m}', p.mandya).replace('{y}', p.mysuru).replace('{b}', p.bengaluru);
};

export function getAssistantReply(text, lang, weather) {
  const intent = detectIntent(text);
  return { intent, text: replyFor(intent, lang, weather) };
}

/** Greeting; `name` is optional (guests are greeted without one). */
export const welcomeMessage = (name, lang) => {
  const n = name ? ` ${name}` : '';
  return {
    en: `Namaste${n}! I am ${APP_NAME}, your farming assistant. Ask me about irrigation, weather, fertilizer, diseases, schemes or prices.`,
    hi: `नमस्ते${n}! मैं ${APP_NAME} हूं, आपका खेती सहायक। सिंचाई, मौसम, खाद, रोग, योजनाओं या भाव के बारे में पूछें।`,
    kn: `ನಮಸ್ಕಾರ${n}! ನಾನು ${APP_NAME}, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ನೀರಾವರಿ, ಹವಾಮಾನ, ಗೊಬ್ಬರ, ರೋಗ, ಯೋಜನೆ ಅಥವಾ ಬೆಲೆಯ ಬಗ್ಗೆ ಕೇಳಿ.`,
  }[lang];
};

/** Simulated leaf analysis. Pick a result by crop so each demo feels contextual. */
const diseaseResults = {
  ragi: {
    name: L('Finger millet leaf blast (Magnaporthe)', 'रागी पत्ती ब्लास्ट (मैग्नापोर्थे)', 'ರಾಗಿ ಎಲೆ ಬೆಂಕಿರೋಗ (ಮ್ಯಾಗ್ನಪೋರ್ಥೆ)'),
    confidence: 87,
    severity: 'medium',
    summary: L('Spindle-shaped grey lesions with brown margins were detected on the leaf. Humid, cloudy weather favours this disease.', 'पत्ते पर भूरे किनारे वाले धूसर तकुए जैसे धब्बे पाए गए। नम, बादल वाला मौसम इस रोग के अनुकूल है।', 'ಎಲೆಯಲ್ಲಿ ಕಂದು ಅಂಚಿನ ಬೂದು ಬಣ್ಣದ ಕಲೆಗಳು ಕಂಡುಬಂದಿವೆ. ತೇವ, ಮೋಡದ ಹವೆ ಈ ರೋಗಕ್ಕೆ ಅನುಕೂಲ.'),
    steps: [
      L('Remove and destroy badly affected leaves.', 'ज़्यादा प्रभावित पत्ते तोड़कर नष्ट करें।', 'ತೀವ್ರವಾಗಿ ಬಾಧಿತ ಎಲೆಗಳನ್ನು ತೆಗೆದು ನಾಶಮಾಡಿ.'),
      L('Avoid extra nitrogen and do not irrigate during the rain spell.', 'अतिरिक्त नाइट्रोजन न दें और बारिश के दौरान सिंचाई न करें।', 'ಹೆಚ್ಚುವರಿ ಸಾರಜನಕ ಬೇಡ, ಮಳೆ ಸಮಯದಲ್ಲಿ ನೀರಾವರಿ ಮಾಡಬೇಡಿ.'),
      L('On a dry day, spray a fungicide recommended by your agriculture officer.', 'सूखे दिन अपने कृषि अधिकारी द्वारा बताया फफूंदनाशक छिड़कें।', 'ಒಣ ದಿನ ಕೃಷಿ ಅಧಿಕಾರಿ ಶಿಫಾರಸು ಮಾಡಿದ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಿಸಿ.'),
      L('Re-inspect after 5–7 days and photograph again.', '5–7 दिन बाद फिर जांचें और दोबारा फोटो लें।', '5–7 ದಿನಗಳ ನಂತರ ಮತ್ತೆ ಪರೀಕ್ಷಿಸಿ ಮತ್ತು ಫೋಟೋ ತೆಗೆಯಿರಿ.'),
    ],
  },
  tomato: {
    name: L('Tomato early blight (Alternaria)', 'टमाटर अगेती झुलसा (अल्टरनेरिया)', 'ಟೊಮೆಟೊ ಆರಂಭಿಕ ಅಂಗಮಾರಿ (ಆಲ್ಟರ್ನೇರಿಯಾ)'),
    confidence: 82,
    severity: 'medium',
    summary: L('Concentric brown rings on lower leaves suggest early blight, common in humid weather.', 'निचले पत्तों पर संकेंद्रित भूरे छल्ले अगेती झुलसा दर्शाते हैं, जो नम मौसम में आम है।', 'ಕೆಳಗಿನ ಎಲೆಗಳಲ್ಲಿ ವೃತ್ತಾಕಾರದ ಕಂದು ಉಂಗುರಗಳು ಆರಂಭಿಕ ಅಂಗಮಾರಿ ಸೂಚಿಸುತ್ತವೆ; ತೇವದ ಹವೆಯಲ್ಲಿ ಸಾಮಾನ್ಯ.'),
    steps: [
      L('Remove infected lower leaves and keep foliage dry (drip, not overhead).', 'संक्रमित निचले पत्ते हटाएं और पत्ते सूखे रखें (ऊपर से नहीं, ड्रिप से)।', 'ಬಾಧಿತ ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ತೆಗೆದು ಎಲೆಗಳನ್ನು ಒಣಗಿಡಿ (ಮೇಲಿನಿಂದ ಅಲ್ಲ, ಹನಿ ನೀರಾವರಿ).'),
      L('Improve spacing and staking for airflow.', 'हवा के लिए दूरी और सहारा बेहतर करें।', 'ಗಾಳಿಯಾಡಲು ಅಂತರ ಮತ್ತು ಆಧಾರ ಸುಧಾರಿಸಿ.'),
      L('Use a recommended fungicide on a dry day.', 'सूखे दिन अनुशंसित फफूंदनाशक का उपयोग करें।', 'ಒಣ ದಿನ ಶಿಫಾರಸು ಮಾಡಿದ ಶಿಲೀಂಧ್ರನಾಶಕ ಬಳಸಿ.'),
    ],
  },
  maize: {
    name: L('Fall armyworm feeding damage', 'फॉल आर्मीवर्म से पत्ती क्षति', 'ಸೈನಿಕ ಹುಳುವಿನಿಂದ ಎಲೆ ಹಾನಿ'),
    confidence: 79,
    severity: 'low',
    summary: L('Ragged feeding holes and frass in the whorl indicate early armyworm attack.', 'गुच्छे में फटे छेद और बीट शुरुआती आर्मीवर्म हमले का संकेत हैं।', 'ಸುರುಳಿಯಲ್ಲಿ ಹರಿದ ರಂಧ್ರ ಮತ್ತು ಹಿಕ್ಕೆ ಆರಂಭಿಕ ಸೈನಿಕ ಹುಳು ದಾಳಿ ಸೂಚಿಸುತ್ತವೆ.'),
    steps: [
      L('Scout 20 plants in the early morning.', 'सुबह जल्दी 20 पौधे जांचें।', 'ಬೆಳಿಗ್ಗೆ ಬೇಗ 20 ಗಿಡಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ.'),
      L('Apply sand or ash into whorls as a first step.', 'पहले कदम के रूप में गुच्छों में रेत या राख डालें।', 'ಮೊದಲ ಹಂತವಾಗಿ ಸುರುಳಿಗಳಿಗೆ ಮರಳು ಅಥವಾ ಬೂದಿ ಹಾಕಿ.'),
      L('If damage exceeds 10% of plants, consult your agriculture officer.', 'अगर 10% से ज़्यादा पौधे प्रभावित हों तो कृषि अधिकारी से मिलें।', '10% ಕ್ಕಿಂತ ಹೆಚ್ಚು ಗಿಡಗಳು ಬಾಧಿತವಾದರೆ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.'),
    ],
  },
};

export function analyzeLeaf(cropId = 'ragi') {
  return diseaseResults[cropId] || diseaseResults.ragi;
}
