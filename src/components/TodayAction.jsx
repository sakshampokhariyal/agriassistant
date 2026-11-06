import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon, BellRing, CalendarClock, CalendarDays, CheckCircle2, Circle, CloudRain, Droplets, FlaskRound, Leaf, ListChecks, Sparkles, Sprout, Sun, Wheat, Undo2, Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import useCropViews from '../hooks/useCropViews';
import useLocalStorage from '../hooks/useLocalStorage';
import { buildDailyActions } from '../utils/dailyAction';
import { scheduleOverview } from '../utils/cropSchedule';
import { cropCatalog } from '../data/farmer';
import { fieldLabel } from '../utils/fields';
import { todayISO } from '../utils/date';
import { TYPE_STYLE } from './calendar/scheduleStyles';

const ICONS = { rain: CloudRain, sun: Sun, leaf: Leaf, task: ListChecks, fert: FlaskRound, harvest: Wheat, water: Droplets, sprout: Sprout, alert: AlertOctagon };
const SNOOZE_MS = 3 * 3600 * 1000;

/**
 * Dashboard card: the single most important thing to do today (weather + crop calendar + own
 * tasks), with Mark as done / Remind later, plus the full crop-calendar checklist for today.
 * Calendar completion is shared app state, so ticking here also ticks the Crop Calendar.
 */
export default function TodayAction() {
  const { t, L, lang, tasks, toggleTask, toast, scheduleDone, setScheduleTaskDone } = useApp();
  const weather = useWeather();
  const fields = useCropViews();
  const today = todayISO();
  const [state, setState] = useLocalStorage('ks-today-action-v1', { date: today, done: [], snoozed: {} });
  const st = state.date === today ? state : { date: today, done: [], snoozed: {} };

  const overview = useMemo(() => scheduleOverview(fields, scheduleDone, today), [fields, scheduleDone, today]);

  /** "Maize · Day 35" (+ DAP for transplanted crops) and the task text, localized. */
  const calendarText = useMemo(() => {
    const crop = (x) => {
      const name = L(cropCatalog[x.cropId]?.name || { en: x.cropId }).split(' (')[0];
      const own = x.field?.name?.trim();
      return own && own !== name ? `${own} · ${name}` : name;
    };
    // Perennials run on the calendar, so they show the season window instead of a day count.
    const when = (x) => (x.perennial ? t('kb.yearRound') : `${t('sch.day', { n: x.das })}${x.dap != null ? ` (${t('sch.dapShort', { n: x.dap })})` : ''}`);
    return (x) => ({
      label: `${crop(x)} · ${when(x)}`,
      title: L(x.title),
      detail: L(x.detail),
    });
  }, [t, L]);

  const actions = useMemo(
    () => buildDailyActions({ weather, fields, tasks, fieldName: (f) => fieldLabel(f, t, L), calendarTasks: overview.todayTasks, calendarText }),
    [weather, fields, tasks, t, L, overview.todayTasks, calendarText]
  );
  const now = Date.now();
  const isDone = (a) => st.done.includes(a.id);
  const open = actions.filter((a) => !isDone(a) && !(st.snoozed[a.id] > now));
  const snoozed = actions.filter((a) => st.snoozed[a.id] > now && !isDone(a));
  const top = open[0];

  const text = (a, part) => t(`ta.${a.key}.${part}`, { ...a.vars, task: a.vars.task ? L(a.vars.task) : '' });
  const fmtTime = (ms) => new Date(ms).toLocaleTimeString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { hour: 'numeric', minute: '2-digit' });

  const markDone = (a) => {
    setState({ ...st, done: [...st.done, a.id] });
    if (a.taskId) toggleTask(a.taskId);
    if (a.schedule) setScheduleTaskDone(a.schedule.fieldId, a.schedule.taskId, true);
    toast(t('ta.doneToast'));
  };
  const remind = (a) => {
    const until = Date.now() + SNOOZE_MS;
    setState({ ...st, snoozed: { ...st.snoozed, [a.id]: until } });
    toast(t('ta.reminderAt', { time: fmtTime(until) }), 'info');
  };
  const undo = () => setState({ date: today, done: [], snoozed: {} });
  const toggleCalendar = (x) => {
    const done = x.status !== 'done';
    setScheduleTaskDone(x.fieldId, x.id, done);
    toast(done ? t('ta.doneToast') : t('calendar.reopened'), done ? 'success' : 'info');
  };

  const Icon = top ? ICONS[top.icon] || Sparkles : CheckCircle2;
  // Calendar tasks ticked today leave `actions` (they're no longer due), so count them separately.
  const calendarDone = overview.todayAll.filter((x) => x.status === 'done').length;
  const doneCount = actions.filter(isDone).length + calendarDone;
  const totalCount = actions.length + calendarDone;

  return (
    <section className="rounded-3xl bg-gradient-to-br from-forest-800 to-[#0b3b24] text-white p-6 md:p-8 lg:p-10 shadow-lift min-h-[22rem]" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="pill-badge-glass !text-sm"><Sparkles size={15} className="text-brand-gold-light" /> {t('ta.title')}</span>
        {totalCount > 0 && <span className="text-sm text-white/75">{t('ta.doneCount', { n: doneCount, total: totalCount })}</span>}
      </div>

      {!fields.length && !top ? null : top ? (
        <div className="grid lg:grid-cols-[1fr_20rem] gap-6 mt-6">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <span className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-white/15 grid place-items-center shrink-0"><Icon size={30} className="text-brand-gold-light" /></span>
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-brand-gold-light font-semibold">{t('ta.priority', { n: 1 })}</span>
                <h2 className="text-2xl md:text-4xl font-semibold leading-tight">{text(top, 'title')}</h2>
                <p className="text-white/85 mt-2 text-base md:text-lg">{text(top, 'why')}</p>
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
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wider text-white/70 mb-2">{t('ta.next')}</div>
              <ol className="space-y-2">
                {open.slice(1, 4).map((a, i) => {
                  const I = ICONS[a.icon] || Sparkles;
                  return (
                    <li key={a.id} className="flex items-start gap-2 text-sm md:text-base">
                      <span className="text-brand-gold-light font-semibold w-4">{i + 2}</span>
                      <I size={15} className="mt-0.5 shrink-0 text-white/80" />
                      <span className="flex-1 min-w-0">{text(a, 'title')}</span>
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

      <CalendarToday overview={overview} calendarText={calendarText} onToggle={toggleCalendar} />

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

/** Today's crop-calendar checklist; when nothing is due, the next task + the daily field check. */
function CalendarToday({ overview, calendarText, onToggle }) {
  const { t, L } = useApp();
  return (
    <div className="mt-6 rounded-2xl bg-white/10 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-sm uppercase tracking-wider text-white/85 font-semibold flex items-center gap-1.5"><CalendarDays size={16} /> {t('ta.cal.title')}</h3>
        <Link to="/calendar" className="text-xs underline text-white/80 min-h-[32px] inline-flex items-center">{t('ta.cal.open')}</Link>
      </div>

      {overview.constraints.map((c) => (
        <p key={`${c.field.id}-${c.key}`} className="mb-2 flex gap-2 rounded-xl bg-red-500/20 border border-red-300/30 px-3 py-2 text-sm">
          <AlertOctagon size={16} className="shrink-0 mt-0.5 text-red-200" />
          <span><b>{fieldLabel(c.field, t, L)}:</b> {L(c.title)} – {L(c.detail)}</span>
        </p>
      ))}

      {!overview.hasSchedules ? (
        <p className="text-sm text-white/85">
          {t('ta.cal.setup')} <Link to="/crops" className="underline">{t('sch.empty.cta')}</Link>
        </p>
      ) : overview.todayAll.length > 0 ? (
        <ul className="space-y-2">
          {overview.todayAll.map((x) => {
            const done = x.status === 'done';
            const txt = calendarText(x);
            return (
              <li key={`${x.fieldId}-${x.id}`} className="flex items-start gap-2">
                <button onClick={() => onToggle(x)} aria-pressed={done} aria-label={done ? t('calendar.reopened') : t('calendar.completed')} className="h-10 w-10 -ml-1 shrink-0 grid place-items-center text-emerald-300">
                  {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${(TYPE_STYLE[x.type] || TYPE_STYLE.other).chip}`}>{t(`sch.type.${x.type}`)}</span>
                    <span className="text-[11px] text-white/70">{txt.label}</span>
                  </div>
                  <p className={`text-base md:text-lg font-semibold leading-snug mt-0.5 ${done ? 'line-through text-white/50' : ''}`}>{txt.title}</p>
                  {!done && <p className="text-sm text-white/80">{txt.detail}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-2 text-sm md:text-base">
          <p className="font-semibold text-base md:text-lg">{t('kb.noOps')}</p>
          {overview.next && (
            <p className="flex gap-2">
              <CalendarClock size={16} className="shrink-0 mt-0.5 text-brand-gold-light" />
              <span>
                <b>{overview.next.inDays === 1 ? t('ta.cal.nextTomorrow') : t('ta.cal.next', { n: overview.next.inDays })}</b>{' '}
                {calendarText({ ...overview.next, das: overview.next.startDay, dap: overview.next.dapStart }).label}: {L(overview.next.title)}
              </span>
            </p>
          )}
          <p className="flex gap-2 text-white/85"><Leaf size={16} className="shrink-0 mt-0.5 text-emerald-300" /> {t('ta.cal.dailyCheck')}</p>
        </div>
      )}
    </div>
  );
}
