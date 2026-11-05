import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Mic, Send, Sparkles, Trash2, X, Square, MessageCircle, Minus, Volume2, VolumeX, Phone, UserRoundSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES, localeOf } from '../translations';
import { useApp } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { useWeather } from '../context/WeatherContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { analyzeLeaf, detectIntent, replyFor, suggestedPrompts, welcomeMessage } from '../data/ai';
import { fmt, placeLabel } from '../utils/weatherText';
import { askGroq } from '../services/groq';
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
  const { t, L, lang, profile, toast, activeField } = useApp();
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
  const recRef = useRef(null);
  const mounted = useRef(true);
  const [speakingId, setSpeakingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    mounted.current = true;
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      mounted.current = false;
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

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  /** Live context for the AI: today's date, place and the 3-day forecast + spray/irrigation advisory. */
  const buildContext = useCallback(() => {
    const w = weatherRef.current;
    const lines = [`Today: ${new Date().toDateString()}. Region: Karnataka, India.`];
    try {
      const place = placeLabel(w, t);
      if (place) lines.push(`Farmer's location: ${place}.`);
      if (w?.data?.daily?.length) {
        lines.push(
          'Forecast: ' +
            w.data.daily
              .slice(0, 3)
              .map((d) => `${d.date}: ${fmt(d.lo)}–${fmt(d.hi)}°C, rain chance ${fmt(d.prob)}%, ${fmt(d.mm, 1)} mm`)
              .join('; ') +
            '.'
        );
      }
      if (w?.decision?.status) lines.push(`App advisory today: ${t(`wx.status.${w.decision.status}`)} – ${t(`wx.reason.${w.decision.status}`)}`);
    } catch {
      /* context is optional */
    }
    return lines.join('\n');
  }, [t]);

  const reply = useCallback(
    async (userText) => {
      setBusy(true);
      const intent = detectIntent(userText);

      // 1) Groq (via server-side proxy). Prior turns give it conversational memory.
      try {
        const history = messagesRef.current
          .map((m) => {
            if (m.role === 'user' && m.text) return { role: 'user', content: m.text };
            if (m.role === 'bot' && m.text) return { role: 'assistant', content: m.text };
            if (m.role === 'bot' && m.intent) return { role: 'assistant', content: replyFor(m.intent, lang, m.weather || weatherRef.current).slice(0, 600) };
            return null;
          })
          .filter(Boolean);
        // The new question may not be in messagesRef yet (state update pending).
        if (history[history.length - 1]?.content !== userText) history.push({ role: 'user', content: userText });
        const text = await askGroq(history, { lang, context: buildContext() });
        setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', text, source: 'groq' }]);
        if (mounted.current) setBusy(false);
        return;
      } catch {
        // No key / offline / rate-limited / timeout → local rule-based answer below.
      }

      // 2) Local fallback – the chat never breaks.
      await delay(500 + Math.random() * 400);
      // Weather answers keep a snapshot of the forecast they were based on.
      const live = intent === 'irrigate' || intent === 'weather';
      const w = weatherRef.current;
      const snap = live && w?.data ? { data: w.data, decision: w.decision, alerts: w.alerts, coords: w.coords, source: w.source } : undefined;
      // Messages persist in storage, so the reply is kept even if the panel was closed meanwhile.
      setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', intent, weather: snap }]);
      if (mounted.current) setBusy(false);
    },
    [setMessages, lang, buildContext]
  );

  /**
   * Photo question → vision model (qwen/qwen3.8-27b) with the image as a base64 data URL.
   * If Groq can't answer, fall back to the simulated local diagnosis so a demo never breaks.
   */
  const replyImage = useCallback(
    async (userText, image) => {
      setBusy(true);
      try {
        const history = messagesRef.current
          .slice(-6)
          .map((m) => (m.role === 'user' && m.text ? { role: 'user', content: m.text } : m.role === 'bot' && m.text ? { role: 'assistant', content: m.text } : null))
          .filter(Boolean);
        history.push({ role: 'user', content: userText || t('chat.photoDefaultQ') });
        const text = await askGroq(history, { lang, context: buildContext(), image });
        setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', text, source: 'groq', vision: true }]);
      } catch {
        await delay(700);
        setMessages((m) => [...m, { id: `b${Date.now()}`, role: 'bot', analysis: activeField?.cropId || 'ragi' }]);
      }
      if (mounted.current) setBusy(false);
    },
    [setMessages, lang, buildContext, t, activeField?.cropId]
  );

  const send = useCallback(
    async (text) => {
      const msg = (text ?? input).trim();
      if (busy || (!msg && !photo)) return;
      if (photo) {
        const attached = photo;
        setPhoto(null);
        setInput('');
        // Small thumbnail for the chat history (localStorage), larger copy for the AI.
        const [thumb, full] = await Promise.all([shrink(attached.url), shrink(attached.url, 1024, 0.82)]);
        setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', image: thumb, text: msg }]);
        replyImage(msg, full);
        return;
      }
      setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text: msg }]);
      setInput('');
      reply(msg);
    },
    [input, busy, photo, setMessages, reply, replyImage]
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
    if (!/^image\/(jpeg|png)$/.test(f.type)) return toast(t('chat.imageOnly'), 'error');
    // Base64 data URL – previewed now, sent to the AI with the message.
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto({ url: reader.result, name: f.name });
      inputRef.current?.focus();
    };
    reader.onerror = () => toast(t('chat.imageOnly'), 'error');
    reader.readAsDataURL(f);
  };

  /* ── Voice input: Web Speech API → live transcript in the text box (the farmer reviews, then sends) ── */
  const stopVoice = () => {
    const r = recRef.current;
    if (r) {
      try {
        r.stop(); // stop() keeps what was heard so far; onend tidies up
      } catch {
        recRef.current = null;
        setListening(false);
      }
    } else {
      setListening(false);
    }
  };

  const startVoice = () => {
    if (listening) return stopVoice();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast(t('chat.voiceUnsupported'), 'error');
    stopSpeaking();
    // Speech is added after anything already typed.
    const base = input.trim() ? `${input.trim()} ` : '';
    try {
      const rec = new SR();
      rec.lang = localeOf(lang); // en-IN / hi-IN / kn-IN – follows the app language
      rec.interimResults = true;
      rec.continuous = false; // one utterance; stops on a pause
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const heard = Array.from(e.results).map((r) => r[0].transcript).join('');
        setInput(base + heard.trimStart());
      };
      rec.onerror = (e) => {
        const code = e.error;
        if (code === 'aborted') return;
        toast(
          t(
            code === 'not-allowed' || code === 'service-not-allowed'
              ? 'chat.micDenied'
              : code === 'no-speech'
                ? 'chat.noSpeech'
                : code === 'network'
                  ? 'chat.voiceNetwork'
                  : code === 'audio-capture'
                    ? 'chat.noMic'
                    : code === 'language-not-supported'
                      ? 'chat.voiceLang'
                      : 'chat.voiceUnsupported'
          ),
          code === 'no-speech' ? 'info' : 'error'
        );
      };
      rec.onend = () => {
        if (recRef.current === rec) recRef.current = null;
        if (!mounted.current) return;
        setListening(false);
        inputRef.current?.focus();
      };
      recRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      recRef.current = null;
      setListening(false);
      toast(t('chat.voiceUnsupported'), 'error');
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
                const text = res ? `${L(res.name)}. ${L(res.summary)}` : m.text || replyFor(m.intent, lang, m.weather || weather);
                const isAi = m.source === 'groq';
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
                      {isAi ? (
                        <Badge tone="green"><Sparkles size={12} className="inline -mt-0.5 mr-1" aria-hidden />{t('chat.aiBadge')}</Badge>
                      ) : (
                        !res && <Badge tone="amber">{t('chat.offlineBadge')}</Badge>
                      )}
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
            <div className="px-3 pt-3 pb-1 flex items-center gap-3">
              <div className="relative shrink-0">
                <img src={photo.url} alt={t('chat.photoAttached')} className="h-16 w-16 rounded-xl object-cover border border-black/[0.08]" />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  aria-label={t('assistant.removePhoto')}
                  title={t('assistant.removePhoto')}
                  className="absolute -top-2 -right-2 h-7 w-7 grid place-items-center rounded-full bg-forest-900 text-white shadow"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-forest-900 truncate">{t('chat.photoAttached')}</p>
                <p className="text-forest-600 text-xs">{t('chat.photoHint')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {listening && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-red-100 bg-red-50 text-sm text-red-800" role="status" aria-live="polite">
          <span className="relative flex h-3 w-3 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
          </span>
          <span className="flex-1 min-w-0 font-medium">{t('chat.listeningLang', { lang: LANGUAGES.find((l) => l.code === lang)?.label || lang })}</span>
          <span className="flex items-end gap-0.5 h-4" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="voice-bar w-1 rounded-full bg-red-500" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </span>
          <button type="button" onClick={stopVoice} className="ml-1 text-xs font-semibold underline min-h-[32px]">{t('chat.stop')}</button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (listening) stopVoice();
          send();
        }}
        className="flex items-center gap-1.5 p-2.5 border-t border-black/[0.06] bg-white pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onFile} />
        <button type="button" onClick={() => fileRef.current?.click()} aria-label={t('chat.attachPhoto')} title={t('chat.attachPhoto')} className={`h-11 w-11 shrink-0 rounded-full grid place-items-center ${photo ? 'bg-emerald-600 text-white' : 'bg-forest-50 text-forest-700 hover:bg-forest-100'}`}>
          <Camera size={20} />
        </button>
        <label className="sr-only" htmlFor="chat-input">{t('assistant.placeholder')}</label>
        <input
          ref={inputRef}
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? t('chat.listeningPh') : photo ? t('chat.photoPh') : t('assistant.placeholder')}
          className={`input !rounded-full min-w-0 !min-h-[44px] ${listening ? '!border-red-300 !ring-2 !ring-red-200' : ''}`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={startVoice}
          aria-label={listening ? t('chat.stop') : t('assistant.voice')}
          aria-pressed={listening}
          title={listening ? t('chat.stop') : t('assistant.voice')}
          className={`h-11 w-11 shrink-0 rounded-full grid place-items-center transition ${listening ? 'bg-red-600 text-white pulse-ring' : 'bg-forest-50 text-forest-700 hover:bg-forest-100'}`}
        >
          {listening ? <Square size={16} fill="currentColor" /> : <Mic size={20} />}
        </button>
        <button disabled={(!input.trim() && !photo) || busy} aria-label={t('common.send')} className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 text-white grid place-items-center hover:bg-emerald-500 disabled:opacity-40">
          <Send size={18} />
        </button>
      </form>

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

function shrink(dataUrl, max = 280, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
