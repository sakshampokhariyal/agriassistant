/**
 * Offline answers for the chat when the Groq AI is unreachable. Every answer is built from
 * real data: live weather, the farmer's own fields, the crop calendar, NPK baselines,
 * cached Agmarknet prices and the official scheme directory – never scripted examples.
 */
import { schemes, isRelevant } from './schemes';
import { NPK_BASELINES, npkKeyFor, HA_PER_ACRE } from './cropMasterData';
import { buildSchedule } from '../utils/cropSchedule';
import { cachedPrices, COMMODITY } from '../services/agmarknet';
import { fieldLabel } from '../utils/fields';
import { fmtDate } from '../utils/date';
import { translate } from '../translations';
import { APP_NAME } from '../config/brand';
import { conditionFromCode } from '../services/weather';
import { alertText, dayLabel, fmt, placeLabel } from '../utils/weatherText';

const L = (en, hi, kn) => ({ en, hi, kn });
const NL = String.fromCharCode(10);
const fmt1 = (n) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 });

export const suggestedPrompts = [
  { id: 'irrigate', text: L('When should I irrigate my crop?', 'मुझे अपनी फसल की सिंचाई कब करनी चाहिए?', 'ನನ್ನ ಬೆಳೆಗೆ ಯಾವಾಗ ನೀರು ಹಾಯಿಸಬೇಕು?') },
  { id: 'weather', text: L("Will tomorrow's weather affect my field?", 'कल का मौसम मेरे खेत पर असर डालेगा?', 'ನಾಳೆಯ ಹವಾಮಾನ ನನ್ನ ಹೊಲದ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆಯೇ?') },
  { id: 'fert', text: L('What fertilizer should I use?', 'मुझे कौन सी खाद डालनी चाहिए?', 'ನಾನು ಯಾವ ಗೊಬ್ಬರ ಬಳಸಬೇಕು?') },
  { id: 'disease', text: L('How do I identify crop diseases?', 'फसल की बीमारियां कैसे पहचानें?', 'ಬೆಳೆ ರೋಗಗಳನ್ನು ಹೇಗೆ ಗುರುತಿಸುವುದು?') },
  { id: 'schemes', text: L('Which government schemes am I eligible for?', 'मैं किन सरकारी योजनाओं के लिए पात्र हूं?', 'ನನಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಸಿಗುತ್ತವೆ?') },
];

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
  // irrigate / weather replies are generated live – see liveWeatherReply();
  // fert / harvest / price / schemes come from the farmer's own fields – see farmReply().
  disease: L(
    `**How to spot common problems:**\n• Ragi blast: spindle-shaped grey spots with brown edges on leaves, worse after humid, cloudy days.\n• Tomato early blight: brown rings (target-like) on lower leaves.\n• Maize armyworm: ragged holes and sawdust-like droppings in the whorl.\n\nTap **Crop photo** below or open *My Crops* to upload a leaf photo for a (simulated) analysis.`,
    `**आम समस्याएं कैसे पहचानें:**\n• रागी ब्लास्ट: पत्तों पर भूरे किनारे वाले धूसर तकुए जैसे धब्बे, नम और बादल वाले दिनों के बाद ज़्यादा।\n• टमाटर अगेती झुलसा: निचले पत्तों पर निशाने जैसे भूरे छल्ले।\n• मक्का आर्मीवर्म: पत्तियों में फटे छेद और बुरादे जैसी बीट।\n\nनीचे **फसल फोटो** दबाएं या *मेरी फसलें* में पत्ते की फोटो डालें (नकली विश्लेषण)।`,
    `**ಸಾಮಾನ್ಯ ಸಮಸ್ಯೆಗಳನ್ನು ಗುರುತಿಸುವ ವಿಧಾನ:**\n• ರಾಗಿ ಬೆಂಕಿರೋಗ: ಎಲೆಗಳ ಮೇಲೆ ಕಂದು ಅಂಚಿನ ಬೂದು ಬಣ್ಣದ ಕಲೆಗಳು, ತೇವ ಮೋಡದ ದಿನಗಳ ನಂತರ ಹೆಚ್ಚು.\n• ಟೊಮೆಟೊ ಆರಂಭಿಕ ಅಂಗಮಾರಿ: ಕೆಳಗಿನ ಎಲೆಗಳಲ್ಲಿ ಗುರಿಯಂತಹ ಕಂದು ಉಂಗುರಗಳು.\n• ಮೆಕ್ಕೆಜೋಳ ಸೈನಿಕ ಹುಳು: ಎಲೆಗಳಲ್ಲಿ ಹರಿದ ರಂಧ್ರ ಮತ್ತು ಹುಡಿಯಂತಹ ಹಿಕ್ಕೆ.\n\nಕೆಳಗಿನ **ಬೆಳೆ ಫೋಟೋ** ಒತ್ತಿ ಅಥವಾ *ನನ್ನ ಬೆಳೆಗಳು* ನಲ್ಲಿ ಎಲೆಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (ಅನುಕರಣ ವಿಶ್ಲೇಷಣೆ).`
  ),
  hello: L(
    `Namaste! I can help with irrigation, weather, fertilizer, diseases, schemes and market prices for your fields. What would you like to know?`,
    `नमस्ते! मैं आपके खेतों के लिए सिंचाई, मौसम, खाद, रोग, योजनाओं और बाज़ार भाव में मदद कर सकता हूं। आप क्या जानना चाहते हैं?`,
    `ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಹೊಲಗಳಿಗೆ ನೀರಾವರಿ, ಹವಾಮಾನ, ಗೊಬ್ಬರ, ರೋಗ, ಯೋಜನೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಬೆಲೆಯ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಏನು ತಿಳಿಯಬೇಕು?`
  ),
  fallback: L(
    `The AI assistant is not reachable right now, so I can only answer from your own farm data: **irrigation, weather, fertilizer, diseases, schemes, prices and harvest**. Try one of the questions below.`,
    `AI सहायक अभी उपलब्ध नहीं है, इसलिए मैं केवल आपके खेत की जानकारी से जवाब दे सकता हूं: **सिंचाई, मौसम, खाद, रोग, योजनाएं, भाव और कटाई**। नीचे दिया कोई सवाल पूछें।`,
    `AI ಸಹಾಯಕ ಈಗ ಲಭ್ಯವಿಲ್ಲ, ಆದ್ದರಿಂದ ನಿಮ್ಮ ಹೊಲದ ಮಾಹಿತಿಯಿಂದ ಮಾತ್ರ ಉತ್ತರಿಸಬಲ್ಲೆ: **ನೀರಾವರಿ, ಹವಾಮಾನ, ಗೊಬ್ಬರ, ರೋಗ, ಯೋಜನೆ, ಬೆಲೆ ಮತ್ತು ಕೊಯ್ಲು**. ಕೆಳಗಿನ ಪ್ರಶ್ನೆಯೊಂದನ್ನು ಕೇಳಿ.`
  ),
};

/**
 * Answers built from the farmer's real data: fields (with stage), the crop calendar,
 * NPK baselines, cached Agmarknet prices and the scheme directory.
 * ctx: { fields: cropViews[], profile, today }
 */
function farmReply(intent, lang, ctx = {}) {
  const t = (k, v) => translate(lang, k, v);
  const Lx = (o) => (o ? o[lang] ?? o.en : '');
  const fields = ctx.fields || [];
  const name = (f) => fieldLabel(f, t, Lx);
  const date = (iso) => fmtDate(iso, lang, { day: 'numeric', month: 'short' });

  if (intent === 'schemes') {
    const list = schemes.filter((s) => isRelevant(s, ctx.profile || {}, fields)).slice(0, 4);
    if (!list.length) return t('ai.schemes.none');
    return [`**${t('ai.schemes.title')}**`, ...list.map((s) => `• **${Lx(s.name) || s.name}** – ${Lx(s.benefit)}`), '', `*${t('ai.schemes.more')}*`].join(NL);
  }

  if (!fields.length) return t('ai.noFields');

  if (intent === 'fert') {
    const lines = fields.slice(0, 4).map((f) => {
      const key = npkKeyFor(f);
      const b = key && NPK_BASELINES[key];
      const plan = buildSchedule(f, {}, ctx.today);
      const next = plan?.tasks.find((x) => x.type === 'fertilizer' && (x.status === 'today' || x.status === 'upcoming'));
      const dose = b ? t('ai.fert.dose', { n: fmt1(b.N * HA_PER_ACRE), p: fmt1(b.P * HA_PER_ACRE), k: fmt1(b.K * HA_PER_ACRE) }) : '';
      const step = next ? t(next.status === 'today' ? 'ai.fert.today' : 'ai.fert.next', { task: Lx(next.title), date: date(next.start) }) : t('ai.fert.none');
      return `• **${name(f)}** (${Lx(f.stage)}): ${dose} ${step}`;
    });
    return [`**${t('ai.fert.title')}**`, ...lines, '', `*${t('ai.fert.note')}*`].join(NL);
  }

  if (intent === 'harvest') {
    const lines = fields.slice(0, 5).map((f) =>
      f.perennial
        ? `• **${name(f)}**: ${t('ai.harvest.perennial', { stage: Lx(f.stage) })}`
        : f.elapsed < 0
          ? `• **${name(f)}**: ${t('sch.sowIn', { n: f.sowIn })}`
          : `• **${name(f)}**: ${Lx(f.stage)} – ${t('ai.harvest.on', { date: date(f.harvestDate), n: f.daysToHarvest })}`
    );
    return [`**${t('ai.harvest.title')}**`, ...lines].join(NL);
  }

  if (intent === 'price') {
    const ids = [...new Set(fields.map((f) => f.cropId))].filter((id) => COMMODITY[id]);
    const lines = ids.map((id) => {
      const c = cachedPrices(id);
      const crop = Lx(fields.find((f) => f.cropId === id)?.cat?.name).split(' (')[0];
      if (!c?.rows?.length) return `• **${crop}**: ${t('ai.price.notLoaded')}`;
      const best = c.rows[0];
      return `• **${crop}**: ${t('ai.price.best', { market: best.market, price: best.modal.toLocaleString('en-IN'), date: best.date || '' })}`;
    });
    if (!lines.length) return t('ai.price.none');
    return [`**${t('ai.price.title')}**`, ...lines, '', `*${t('ai.price.note')}*`].join(NL);
  }
  return null;
}

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

export const replyFor = (intent, lang, weather, ctx) => {
  if (intent === 'irrigate' || intent === 'weather') return liveWeatherReply(intent, lang, weather);
  const farm = farmReply(intent, lang, ctx);
  if (farm) return farm;
  return (replies[intent] || replies.fallback)[lang] ?? replies.fallback.en;
};

/** Greeting; `name` is optional (guests are greeted without one). */
export const welcomeMessage = (name, lang) => {
  const n = name ? ` ${name}` : '';
  return {
    en: `Namaste${n}! I am ${APP_NAME}, your farming assistant. Ask me about irrigation, weather, fertilizer, diseases, schemes or prices.`,
    hi: `नमस्ते${n}! मैं ${APP_NAME} हूं, आपका खेती सहायक। सिंचाई, मौसम, खाद, रोग, योजनाओं या भाव के बारे में पूछें।`,
    kn: `ನಮಸ್ಕಾರ${n}! ನಾನು ${APP_NAME}, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ನೀರಾವರಿ, ಹವಾಮಾನ, ಗೊಬ್ಬರ, ರೋಗ, ಯೋಜನೆ ಅಥವಾ ಬೆಲೆಯ ಬಗ್ಗೆ ಕೇಳಿ.`,
  }[lang];
};
