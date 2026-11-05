import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Mic, Send, Sparkles, Trash2, X, Square, MessageCircle, Minus, Volume2, VolumeX, Phone, UserRoundSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { localeOf } from '../translations';
import { useApp } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { useWeather } from '../context/WeatherContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { analyzeLeaf, detectIntent, replyFor, suggestedPrompts, welcomeMessage, demoQuestion } from '../data/ai';
import { fmt } from '../utils/weatherText';
import { Badge, RichText } from './ui';
import DiseaseResult from './DiseaseResult';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const CHIP = {
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-sky-100 text-sky-800',
  green: 'bg-emerald-100 text-emerald-800',
  gray: 'bg-white/20 text-white',
};

/** Floating chatbot: launcher button bottom-right + popup panel (full screen on phones). */
export default function ChatWidget() {
  const { t } = useApp();
  const { open, setOpen } = useChat();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            role="dialog"
            aria-label={t('assistant.title')}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed z-[70] inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[min(620px,calc(100dvh-10rem))] bg-white sm:rounded-3xl shadow-[0_20px_60px_rgba(4,30,18,0.30)] border border-black/[0.06] overflow-hidden flex flex-col"
          >
            <ChatPanel onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? t('chat.close') : t('chat.open')}
        aria-expanded={open}
        className={`fixed z-[65] right-4 sm:right-6 bottom-24 lg:bottom-6 h-14 rounded-full bg-emerald-600 text-white shadow-[0_10px_30px_rgba(5,150,105,0.45)] hover:bg-emerald-500 active:scale-95 transition flex items-center gap-2 px-4 ${
          open ? 'hidden sm:flex w-14 justify-center !px-0' : 'flex'
        }`}
      >
        {open ? (
          <X size={24} />
        ) : (
          <>
            <span className="relative">
              <MessageCircle size={24} />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-yellow-400 ring-2 ring-emerald-600" />
            </span>
            <span className="hidden sm:inline font-semibold pr-1">{t('chat.launcher')}</span>
          </>
        )}
      </button>
    </>
  );
}

function ChatPanel({ onClose }) {
  const { t, L, lang, profile, toast } = useApp();
  const { pendingAsk, clearPending } = useChat();
  const weather = useWeather();
  const weatherRef = useRef(weather);
  weatherRef.current = weather;
  const [messages, setMessages] = useLocalStorage('ks-chat-v1', []);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [photo, setPhoto] = useState(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const voiceTimer = useRef(null);
  const recRef = useRef(null);
  const mounted = useRef(true);
  const [transcript, setTranscript] = useState('');
  const [voiceMode, setVoiceMode] = useState('demo'); // live | demo
  const [speakingId, setSpeakingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    mounted.current = true;
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      mounted.current = false;
      clearTimeout(voiceTimer.current);
      clearInterval(voiceTimer.current);
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const reply = useCallback(
    async (userText) => {
      setBusy(true);
      const intent = detectIntent(userText);
      await delay(1100 + Math.random() * 600);
      // Weather answers keep a snapshot of the forecast they were based on.
      const live = intent === 'irrigate' || intent === 'weather';
      const w = weatherRef.current;
      const snap = live && w?.data ? { data: w.data, decision: w.decision, alerts: w.alerts, coords: w.coords, source: w.source } : undefined;
      // Messages persist in storage, so the reply is kept even if the panel was closed meanwhile.
      setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', intent, weather: snap }]);
      if (mounted.current) setBusy(false);
    },
    [setMessages]
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

  // Questions sent from elsewhere (dashboard search, "Ask the assistant" buttons).
  useEffect(() => {
    if (pendingAsk && !busy) {
      clearPending();
      send(pendingAsk.text);
    }
  }, [pendingAsk, busy, send, clearPending]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Image only', 'error');
    const reader = new FileReader();
    reader.onload = () => setPhoto({ url: reader.result });
    reader.readAsDataURL(f);
  };

  const sendPhoto = async () => {
    if (!photo || busy) return;
    const thumb = await shrink(photo.url); // small thumbnail keeps localStorage light
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', image: thumb }]);
    setPhoto(null);
    setBusy(true);
    await delay(2200);
    setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', analysis: 'ragi' }]);
    if (mounted.current) setBusy(false);
    toast(t('assistant.photoSent'));
  };

  /* ── Voice input: browser speech recognition when available, otherwise a simulated demo ── */
  const stopVoice = () => {
    clearInterval(voiceTimer.current);
    clearTimeout(voiceTimer.current);
    if (recRef.current) {
      const r = recRef.current;
      recRef.current = null;
      try {
        r.abort();
      } catch {
        /* ignore */
      }
    }
    setListening(false);
  };

  const simulateVoice = () => {
    setVoiceMode('demo');
    const q = L(demoQuestion);
    let i = 0;
    voiceTimer.current = setInterval(() => {
      i += 2;
      setTranscript(q.slice(0, i));
      if (i >= q.length) {
        clearInterval(voiceTimer.current);
        voiceTimer.current = setTimeout(() => {
          setListening(false);
          send(q);
        }, 600);
      }
    }, 70);
  };

  const startVoice = () => {
    if (listening) return stopVoice();
    stopSpeaking();
    setTranscript('');
    setListening(true);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return simulateVoice();
    try {
      const rec = new SR();
      rec.lang = localeOf(lang);
      rec.interimResults = true;
      let finalText = '';
      let gotAudio = false;
      rec.onresult = (e) => {
        gotAudio = true;
        const txt = Array.from(e.results).map((r) => r[0].transcript).join('');
        setTranscript(txt);
        if (e.results[e.results.length - 1].isFinal) finalText = txt;
      };
      rec.onerror = () => {
        // Permission denied / no mic / unsupported language → fall back to the demo.
        if (recRef.current === rec) {
          recRef.current = null;
          if (!gotAudio) simulateVoice();
          else setListening(false);
        }
      };
      rec.onend = () => {
        if (recRef.current !== rec) return;
        recRef.current = null;
        setListening(false);
        if (finalText.trim()) send(finalText.trim());
      };
      recRef.current = rec;
      setVoiceMode('live');
      rec.start();
    } catch {
      simulateVoice();
    }
  };

  /* ── Text-to-speech for answers ── */
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  };
  const speak = (id, text) => {
    if (!('speechSynthesis' in window)) return toast(t('chat.ttsUnsupported'), 'error');
    if (speakingId === id) return stopSpeaking();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*•]/g, '').replace(/\n+/g, '. '));
    u.lang = localeOf(lang);
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.onend = () => setSpeakingId((s) => (s === id ? null : s));
    u.onerror = () => setSpeakingId((s) => (s === id ? null : s));
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
  };

  const goExpert = () => {
    stopSpeaking();
    onClose();
    navigate('/help');
  };

  const clear = () => {
    setMessages([]);
    toast(t('assistant.cleared'), 'info');
  };

  const Prompts = ({ className = '', inline = false }) => (
    <div className={className}>
      {suggestedPrompts.map((p) => (
        <button
          key={p.id}
          disabled={busy}
          onClick={() => send(L(p.text))}
          className={`chip chip-off text-left !rounded-2xl py-2 !min-h-[40px] text-sm disabled:opacity-50 ${inline ? 'whitespace-nowrap shrink-0' : 'whitespace-normal'}`}
        >
          {L(p.text)}
        </button>
      ))}
    </div>
  );

  const decision = weather.decision;

  return (
    <div className="relative flex flex-col h-full min-h-0">
      <header className="flex items-center gap-3 px-4 py-3 bg-forest-800 text-white pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="h-10 w-10 rounded-2xl bg-white/15 grid place-items-center shrink-0">
          <Sparkles size={20} className="text-yellow-300" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold leading-tight">{t('assistant.title')}</h2>
          {decision ? (
            <p className="text-xs text-white/75 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
              <span>{t('wx.rain24')}: {fmt(weather.data.daily[0]?.prob)}%</span>
              <span className={`rounded-full px-1.5 py-0.5 font-medium whitespace-nowrap ${CHIP[decision.tone]}`}>{t(`wx.status.${decision.status}`)}</span>
            </p>
          ) : (
            <p className="text-xs text-white/75 truncate">{t('assistant.sub')}</p>
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={clear} aria-label={t('assistant.clear')} title={t('assistant.clear')} className="h-10 w-10 rounded-full hover:bg-white/15 grid place-items-center">
            <Trash2 size={18} />
          </button>
        )}
        <button onClick={onClose} aria-label={t('chat.close')} title={t('chat.close')} className="h-10 w-10 rounded-full hover:bg-white/15 grid place-items-center">
          <span className="sm:hidden"><X size={22} /></span>
          <span className="hidden sm:inline"><Minus size={22} /></span>
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3 bg-cream-50" aria-live="polite">
        <Bubble role="bot" label={t('assistant.bot')}>
          <p>{welcomeMessage(profile.name?.trim().split(' ')[0], lang)}</p>
        </Bubble>

        {messages.length === 0 && (
          <div className="pt-1">
            <p className="text-sm font-semibold text-forest-600 mb-2">{t('assistant.suggested')}</p>
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
              {(() => {
                const res = m.analysis ? analyzeLeaf(m.analysis) : null;
                const text = res ? `${L(res.name)}. ${L(res.summary)}` : replyFor(m.intent, lang, m.weather || weather);
                const speaking = speakingId === m.id;
                return (
                  <>
                    {res ? <DiseaseResult result={res} compact /> : <RichText text={text} />}
                    {m.intent === 'fallback' && (
                      <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                        <p className="font-medium">{t('chat.notAnswered')}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button onClick={goExpert} className="btn-primary !min-h-[38px] !px-3 text-xs"><UserRoundSearch size={14} /> {t('chat.findExpert')}</button>
                          <a href="tel:18001801551" className="btn-ghost !min-h-[38px] !px-3 text-xs bg-white"><Phone size={14} /> 1800-180-1551</a>
                        </div>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {!res && <Badge tone="amber">{t('assistant.simulated')}</Badge>}
                      <button
                        onClick={() => speak(m.id, text)}
                        aria-pressed={speaking}
                        aria-label={speaking ? t('chat.stopAudio') : t('chat.listen')}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 min-h-[32px] text-xs font-medium ${speaking ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
                      >
                        {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />} {speaking ? t('chat.stopAudio') : t('chat.listen')}
                      </button>
                      {m.intent !== 'fallback' && (
                        <button onClick={goExpert} className="text-xs text-forest-600 underline min-h-[32px]">{t('chat.askExpert')}</button>
                      )}
                    </div>
                  </>
                );
              })()}
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
        <div className="px-3 pt-2 border-t border-black/[0.06] bg-white">
          <Prompts inline className="flex gap-2 overflow-x-auto scrollbar-none pb-2" />
        </div>
      )}

      <AnimatePresence>
        {photo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white border-t border-black/[0.06]">
            <div className="p-3 flex items-center gap-3">
              <img src={photo.url} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <button onClick={sendPhoto} className="btn-primary !min-h-[40px] text-sm">{t('assistant.sendPhoto')}</button>
              </div>
              <button onClick={() => setPhoto(null)} aria-label={t('assistant.removePhoto')} className="h-10 w-10 grid place-items-center rounded-full hover:bg-forest-50">
                <X size={18} />
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
        className="flex items-center gap-1.5 p-2.5 border-t border-black/[0.06] bg-white pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        <button type="button" onClick={() => fileRef.current?.click()} aria-label={t('assistant.photo')} title={t('assistant.photo')} className="h-11 w-11 shrink-0 rounded-full bg-forest-50 text-forest-700 grid place-items-center hover:bg-forest-100">
          <Camera size={20} />
        </button>
        <label className="sr-only" htmlFor="chat-input">{t('assistant.placeholder')}</label>
        <input
          ref={inputRef}
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('assistant.placeholder')}
          className="input !rounded-full min-w-0 !min-h-[44px]"
          autoComplete="off"
        />
        <button type="button" onClick={startVoice} aria-label={t('assistant.voice')} title={t('assistant.voice')} className={`h-11 w-11 shrink-0 rounded-full grid place-items-center ${listening ? 'bg-clay-500 text-white pulse-ring' : 'bg-forest-50 text-forest-700 hover:bg-forest-100'}`}>
          {listening ? <Square size={16} /> : <Mic size={20} />}
        </button>
        <button disabled={!input.trim() || busy} aria-label={t('common.send')} className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 text-white grid place-items-center hover:bg-emerald-500 disabled:opacity-40">
          <Send size={18} />
        </button>
      </form>

      <AnimatePresence>
        {listening && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 grid place-items-center bg-forest-900/85" role="status">
            <div className="text-center text-white px-6 w-full">
              <span className="h-20 w-20 rounded-full bg-clay-500 grid place-items-center mx-auto pulse-ring"><Mic size={36} /></span>
              {/* Speech level indicator */}
              <div className="flex items-end justify-center gap-1 h-10 mt-4" aria-hidden>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <span key={i} className="voice-bar w-1.5 rounded-full bg-yellow-300" style={{ animationDelay: `${i * 0.11}s` }} />
                ))}
              </div>
              <p className="mt-2 text-xl font-semibold">{t('assistant.listening')}</p>
              <p className="text-white/70 text-xs">{voiceMode === 'live' ? t('chat.voiceLive') : t('assistant.listeningHint')}</p>
              <p className="mt-4 min-h-[3rem] rounded-2xl bg-white/10 px-4 py-3 text-lg">{transcript || '…'}</p>
              <button onClick={stopVoice} className="btn bg-white text-forest-900 hover:bg-cream-100 mt-4"><Square size={16} /> {t('chat.stop')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Bubble({ role, label, children }) {
  const user = role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${user ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 space-y-1.5 text-[15px] ${user ? 'bg-forest-700 text-white rounded-br-md' : 'bg-white border border-black/[0.06] shadow-card rounded-bl-md text-forest-900'}`}>
        <div className={`text-[10px] font-semibold uppercase tracking-wide ${user ? 'text-white/70' : 'text-emerald-700'}`}>{label}</div>
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
