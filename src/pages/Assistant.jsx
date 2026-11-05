import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Mic, Send, Sparkles, Trash2, X, Leaf, MapPin, Sprout, CloudRain, Square } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import useLocalStorage from '../hooks/useLocalStorage';
import useCropViews from '../hooks/useCropViews';
import { analyzeLeaf, detectIntent, replyFor, suggestedPrompts, welcomeMessage, demoQuestion } from '../data/ai';
import { addDays } from '../utils/date';
import { Badge, RichText } from '../components/ui';
import DiseaseResult from '../components/DiseaseResult';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Assistant() {
  const { t, L, lang, profile, tasks, addTask, toast } = useApp();
  const crops = useCropViews();
  const [messages, setMessages] = useLocalStorage('ks-chat-v1', []);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [photo, setPhoto] = useState(null); // {url}
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const voiceTimer = useRef(null);
  const location = useLocation();
  const nav = useNavigate();
  const handledAsk = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  useEffect(() => () => clearTimeout(voiceTimer.current), []);

  const reply = useCallback(
    async (userText) => {
      setBusy(true);
      const intent = detectIntent(userText);
      await delay(1100 + Math.random() * 600);
      setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', intent }]);
      if (intent === 'irrigate' && !tasks.some((x) => x.id === 'ai-irrigation-reminder')) {
        addTask({
          id: 'ai-irrigation-reminder',
          title: { en: 'Re-check rain forecast, decide on ragi irrigation', hi: 'बारिश का पूर्वानुमान फिर देखें, रागी सिंचाई तय करें', kn: 'ಮಳೆ ಮುನ್ಸೂಚನೆ ಮತ್ತೆ ನೋಡಿ, ರಾಗಿ ನೀರಾವರಿ ನಿರ್ಧರಿಸಿ' },
          date: addDays(4),
          category: 'irrigation',
          cropId: 'ragi',
        });
      }
      setBusy(false);
    },
    [setMessages, tasks, addTask]
  );

  const send = useCallback(
    (text) => {
      const msg = (text ?? input).trim();
      if (!msg || busy) return;
      setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: msg }]);
      setInput('');
      reply(msg);
    },
    [input, busy, setMessages, reply]
  );

  // Auto-send when navigated here with a question (dashboard search / demo journey).
  useEffect(() => {
    const ask = location.state?.ask;
    if (ask && !handledAsk.current) {
      handledAsk.current = true;
      nav('/assistant', { replace: true, state: null });
      send(ask);
    }
  }, [location.state, nav, send]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast('Image only', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto({ url: reader.result });
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const sendPhoto = async () => {
    if (!photo || busy) return;
    // Large data URLs would overflow localStorage, so keep a small thumbnail in chat.
    const thumb = await shrink(photo.url);
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', image: thumb }]);
    setPhoto(null);
    setBusy(true);
    await delay(2200);
    setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', analysis: 'ragi' }]);
    setBusy(false);
    toast(t('assistant.photoSent'));
  };

  const startVoice = () => {
    if (listening) {
      clearTimeout(voiceTimer.current);
      setListening(false);
      return;
    }
    setListening(true);
    voiceTimer.current = setTimeout(() => {
      setListening(false);
      send(L(demoQuestion));
    }, 2600);
  };

  const clear = () => {
    setMessages([]);
    toast(t('assistant.cleared'), 'info');
  };

  const Prompts = ({ className = '' }) => (
    <div className={className}>
      {suggestedPrompts.map((p) => (
        <button
          key={p.id}
          disabled={busy}
          onClick={() => send(L(p.text))}
          className="chip chip-off text-left whitespace-normal !rounded-2xl py-2 disabled:opacity-50"
        >
          {L(p.text)}
        </button>
      ))}
    </div>
  );

  const ragi = crops.find((c) => c.cropId === 'ragi');

  return (
    <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-5">
      <section className="card flex flex-col h-[calc(100dvh-10rem)] lg:h-[calc(100dvh-7.5rem)] overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-cream-300 bg-forest-700 text-cream-50">
          <span className="h-11 w-11 rounded-2xl bg-white/15 grid place-items-center">
            <Sparkles size={22} className="text-earth-400" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-lg leading-tight">{t('assistant.title')}</h1>
            <p className="text-xs text-cream-200 truncate">{t('assistant.sub')}</p>
          </div>
          {messages.length > 0 && (
            <button onClick={clear} aria-label={t('assistant.clear')} title={t('assistant.clear')} className="h-11 w-11 rounded-full hover:bg-white/15 grid place-items-center">
              <Trash2 size={20} />
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-cream-50" aria-live="polite">
          <Bubble role="bot" label={t('assistant.bot')}>
            <p>{welcomeMessage(profile.name.split(' ')[0], lang)}</p>
          </Bubble>

          {messages.length === 0 && (
            <div className="pt-2">
              <p className="text-sm font-bold text-forest-600 mb-2">{t('assistant.suggested')}</p>
              <Prompts className="flex flex-wrap gap-2" />
            </div>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <Bubble key={m.id} role="user" label={t('assistant.you')}>
                {m.image && <img src={m.image} alt={t('assistant.photoSent')} className="rounded-xl max-h-48 object-cover" />}
                {m.text && <p>{m.text}</p>}
              </Bubble>
            ) : (
              <Bubble key={m.id} role="bot" label={t('assistant.bot')}>
                {m.analysis ? (
                  <DiseaseResult result={analyzeLeaf(m.analysis)} compact />
                ) : (
                  <>
                    <RichText text={replyFor(m.intent, lang)} />
                    <div className="mt-2"><Badge tone="amber">{t('assistant.simulated')}</Badge></div>
                  </>
                )}
              </Bubble>
            )
          )}

          {busy && (
            <Bubble role="bot" label={t('assistant.bot')}>
              <div className="flex items-center gap-2 text-forest-600">
                <span>{t('assistant.thinking')}</span>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="typing-dot h-2 w-2 rounded-full bg-forest-500" style={{ animationDelay: `${i * 0.18}s` }} />
                  ))}
                </span>
              </div>
            </Bubble>
          )}
          <div ref={endRef} />
        </div>

        {messages.length > 0 && (
          <div className="px-3 pt-2 border-t border-cream-200 bg-white">
            <Prompts className="flex gap-2 overflow-x-auto scrollbar-none pb-2" />
          </div>
        )}

        <AnimatePresence>
          {photo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white border-t border-cream-200">
              <div className="p-3 flex items-center gap-3">
                <img src={photo.url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-forest-800 text-sm">{t('assistant.photoSent')}</p>
                  <button onClick={sendPhoto} className="btn-primary !min-h-[44px] mt-1 text-sm">{t('assistant.sendPhoto')}</button>
                </div>
                <button onClick={() => setPhoto(null)} aria-label={t('assistant.removePhoto')} className="h-11 w-11 grid place-items-center rounded-full hover:bg-forest-50">
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 p-3 border-t border-cream-300 bg-white"
        >
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
          <button type="button" onClick={() => fileRef.current?.click()} aria-label={t('assistant.photo')} title={t('assistant.photo')} className="h-12 w-12 shrink-0 rounded-full bg-forest-50 text-forest-700 grid place-items-center hover:bg-forest-100">
            <Camera size={22} />
          </button>
          <label className="sr-only" htmlFor="chat-input">{t('assistant.placeholder')}</label>
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('assistant.placeholder')}
            className="input !rounded-full min-w-0"
            autoComplete="off"
          />
          <button type="button" onClick={startVoice} aria-label={t('assistant.voice')} title={t('assistant.voice')} className={`h-12 w-12 shrink-0 rounded-full grid place-items-center ${listening ? 'bg-clay-500 text-white pulse-ring' : 'bg-forest-50 text-forest-700 hover:bg-forest-100'}`}>
            {listening ? <Square size={18} /> : <Mic size={22} />}
          </button>
          <button disabled={!input.trim() || busy} aria-label={t('common.send')} className="h-12 w-12 shrink-0 rounded-full bg-forest-700 text-cream-50 grid place-items-center hover:bg-forest-800 disabled:opacity-40">
            <Send size={20} />
          </button>
        </form>

        <AnimatePresence>
          {listening && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 grid place-items-center bg-forest-900/70" onClick={startVoice}>
              <div className="text-center text-cream-50">
                <span className="h-24 w-24 rounded-full bg-clay-500 grid place-items-center mx-auto pulse-ring"><Mic size={40} /></span>
                <p className="mt-4 text-xl font-extrabold">{t('assistant.listening')}</p>
                <p className="text-cream-200">{t('assistant.listeningHint')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Desktop context panel */}
      <aside className="hidden lg:block space-y-4">
        <div className="card p-5">
          <h2 className="h-section mb-3">{t('assistant.suggested')}</h2>
          <Prompts className="flex flex-col gap-2" />
        </div>
        <div className="card p-5 space-y-3">
          <h2 className="h-section">{t('nav.profile')}</h2>
          <p className="flex items-center gap-2 text-forest-700"><MapPin size={18} className="text-forest-500" /> {profile.village}, {profile.district}</p>
          {ragi && <p className="flex items-center gap-2 text-forest-700"><Sprout size={18} className="text-forest-500" /> {L(ragi.cat.name)} · {L(ragi.stage)}</p>}
          <p className="flex items-center gap-2 text-forest-700"><CloudRain size={18} className="text-sky-500" /> {t('dash.rain')}: 70%</p>
          <p className="flex items-center gap-2 text-forest-700"><Leaf size={18} className="text-forest-500" /> {profile.landSize} {t('common.acres')}</p>
        </div>
        <p className="text-xs text-earth-700 bg-earth-100/70 rounded-xl px-3 py-2">{t('common.demoNote')}</p>
      </aside>
    </div>
  );
}

function Bubble({ role, label, children }) {
  const user = role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${user ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] md:max-w-[80%] rounded-2xl px-4 py-3 space-y-2 ${user ? 'bg-forest-700 text-cream-50 rounded-br-md' : 'bg-white border border-cream-300 shadow-card rounded-bl-md text-forest-900'}`}>
        <div className={`text-[11px] font-bold uppercase tracking-wide ${user ? 'text-cream-200' : 'text-forest-500'}`}>{label}</div>
        {children}
      </div>
    </motion.div>
  );
}

function shrink(dataUrl, max = 280) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
