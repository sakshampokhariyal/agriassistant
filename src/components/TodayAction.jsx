import { useMemo } from 'react';
import {
  BellRing, CheckCircle2, CloudRain, Droplets, FlaskRound, Leaf, ListChecks, Sparkles, Sun, Wheat, Undo2, Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import useCropViews from '../hooks/useCropViews';
import useLocalStorage from '../hooks/useLocalStorage';
import { buildDailyActions } from '../utils/dailyAction';
import { fieldLabel } from '../utils/fields';
import { todayISO } from '../utils/date';

const ICONS = { rain: CloudRain, sun: Sun, leaf: Leaf, task: ListChecks, fert: FlaskRound, harvest: Wheat, water: Droplets };
const SNOOZE_MS = 3 * 3600 * 1000;

/** Dashboard card: the single most important thing to do today, with Mark as done / Remind later. */
export default function TodayAction() {
  const { t, L, lang, tasks, toggleTask, toast, pushNotification } = useApp();
  const weather = useWeather();
  const fields = useCropViews();
  const today = todayISO();
  const [state, setState] = useLocalStorage('ks-today-action-v1', { date: today, done: [], snoozed: {} });
  const st = state.date === today ? state : { date: today, done: [], snoozed: {} };

  const actions = useMemo(
    () => buildDailyActions({ weather, fields, tasks, fieldName: (f) => fieldLabel(f, t, L) }),
    [weather, fields, tasks, t, L]
  );
  const now = Date.now();
  const open = actions.filter((a) => !st.done.includes(a.id) && !(st.snoozed[a.id] > now));
  const snoozed = actions.filter((a) => st.snoozed[a.id] > now && !st.done.includes(a.id));
  const top = open[0];

  const text = (a, part) => t(`ta.${a.key}.${part}`, { ...a.vars, task: a.vars.task ? L(a.vars.task) : '' });
  const fmtTime = (ms) => new Date(ms).toLocaleTimeString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { hour: 'numeric', minute: '2-digit' });

  const markDone = (a) => {
    setState({ ...st, done: [...st.done, a.id] });
    if (a.taskId) toggleTask(a.taskId);
    toast(t('ta.doneToast'));
  };
  const remind = (a) => {
    const until = Date.now() + SNOOZE_MS;
    setState({ ...st, snoozed: { ...st.snoozed, [a.id]: until } });
    pushNotification({
      type: 'task',
      title: { en: "Reminder: today's action", hi: 'याद दिलाना: आज का काम', kn: 'ನೆನಪು: ಇಂದಿನ ಕೆಲಸ' },
      body: { en: t('ta.reminderAt', { time: fmtTime(until) }), hi: t('ta.reminderAt', { time: fmtTime(until) }), kn: t('ta.reminderAt', { time: fmtTime(until) }) },
      to: '/',
    });
    toast(t('ta.reminderAt', { time: fmtTime(until) }), 'info');
  };
  const undo = () => setState({ date: today, done: [], snoozed: {} });

  const Icon = top ? ICONS[top.icon] || Sparkles : CheckCircle2;

  return (
    <section className="rounded-3xl bg-gradient-to-br from-forest-800 to-[#0b3b24] text-white p-5 md:p-6 shadow-lift" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="pill-badge-glass"><Sparkles size={13} className="text-yellow-300" /> {t('ta.title')}</span>
        <span className="text-xs text-white/70">{t('ta.doneCount', { n: st.done.length, total: actions.length })}</span>
      </div>

      {top ? (
        <div className="grid lg:grid-cols-[1fr_17rem] gap-5 mt-4">
          <div>
            <div className="flex items-start gap-3">
              <span className="h-12 w-12 rounded-2xl bg-white/15 grid place-items-center shrink-0"><Icon size={24} className="text-yellow-300" /></span>
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-yellow-300 font-semibold">{t('ta.priority', { n: 1 })}</span>
                <h2 className="text-2xl md:text-3xl font-semibold leading-tight">{text(top, 'title')}</h2>
                <p className="text-white/85 mt-1.5">{text(top, 'why')}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {top.reasons.map((r) => <span key={r} className="text-[11px] rounded-full bg-white/10 px-2 py-0.5 text-white/80">{t(`ta.reason.${r}`)}</span>)}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <button onClick={() => markDone(top)} className="btn bg-white text-forest-900 hover:bg-cream-100"><CheckCircle2 size={18} /> {t('ta.done')}</button>
              <button onClick={() => remind(top)} className="btn bg-white/15 text-white hover:bg-white/25"><BellRing size={18} /> {t('ta.later')}</button>
            </div>
          </div>
          {open.length > 1 && (
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-xs uppercase tracking-wider text-white/70 mb-2">{t('ta.next')}</div>
              <ol className="space-y-2">
                {open.slice(1, 4).map((a, i) => {
                  const I = ICONS[a.icon] || Sparkles;
                  return (
                    <li key={a.id} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-300 font-semibold w-4">{i + 2}</span>
                      <I size={15} className="mt-0.5 shrink-0 text-white/80" />
                      <span className="flex-1">{text(a, 'title')}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Icon size={28} className="text-emerald-300" />
          <p className="text-lg flex-1">{t('ta.allDone')}</p>
        </div>
      )}

      {(snoozed.length > 0 || st.done.length > 0) && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
          {snoozed.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1"><Clock size={12} /> {text(a, 'title')} – {fmtTime(st.snoozed[a.id])}</span>
          ))}
          <button onClick={undo} className="inline-flex items-center gap-1 underline ml-auto min-h-[32px]"><Undo2 size={12} /> {t('ta.reset')}</button>
        </div>
      )}
    </section>
  );
}
