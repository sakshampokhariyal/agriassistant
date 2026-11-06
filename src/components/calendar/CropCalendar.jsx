import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon, CalendarDays, CheckCircle2, Circle, CircleAlert, IndianRupee, NotebookPen, Plus, Sprout, Trash2, Wallet, CheckCheck, Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import useLocalStorage from '../../hooks/useLocalStorage';
import { cropCatalog, dateLabelKey } from '../../data/farmer';
import { buildSchedule, EXPENSE_CATEGORIES } from '../../utils/cropSchedule';
import { fmtDate, fmtNum, todayISO } from '../../utils/date';
import { fieldLabel } from '../../utils/fields';
import { EmptyState, SectionTitle } from '../ui';
import FieldTabs from '../FieldTabs';
import { TYPE_STYLE, STATUS_STYLE } from './scheduleStyles';

const PHASE_COLORS = ['#58a73c', '#1b7a32', '#17512f', '#e9a84f', '#a96d1b'];
const FILTERS = ['all', 'today', 'overdue', 'upcoming', 'done'];

/** Crop Calendar: dated cultivation schedule for the selected field (from data/cropSchedules.js). */
export default function CropCalendar() {
  const { t, L, activeField, crops, updateCrop, scheduleDone, setScheduleTaskDone, markScheduleTasksDone, toast } = useApp();
  const [notesAll, setNotesAll] = useLocalStorage('ks-field-notes-v1', {});
  const [expenses, setExpenses] = useLocalStorage('ks-expenses-v1', []);
  const [filter, setFilter] = useState('all');
  const field = activeField;
  const today = todayISO();
  const plan = useMemo(() => (field ? buildSchedule(field, scheduleDone[field.id], today) : null), [field, scheduleDone, today]);

  // No fields yet → explain what's needed.
  if (!crops.length || !field) {
    return (
      <div className="card">
        <EmptyState
          icon={Sprout}
          text={t('sch.empty.body')}
          action={<Link to="/crops" className="btn-primary"><Plus size={18} /> {t('sch.empty.cta')}</Link>}
        />
      </div>
    );
  }

  const fieldExpenses = expenses.filter((e) => e.fieldId === field.id).sort((a, b) => b.date.localeCompare(a.date));
  const total = fieldExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const side = (
    <div className="space-y-5 min-w-0">
      <section className="card p-5">
        <SectionTitle icon={NotebookPen}>{t('cc.notes')}</SectionTitle>
        <textarea
          className="input !py-3 min-h-[120px]"
          value={notesAll[field.id] || ''}
          onChange={(e) => setNotesAll((m) => ({ ...m, [field.id]: e.target.value }))}
          placeholder={t('cc.notesPh')}
          aria-label={t('cc.notes')}
        />
        <p className="text-xs text-forest-600/80 mt-1">{t('ins.draftSaved')}</p>
      </section>
      <ExpenseLog field={field} items={fieldExpenses} total={total} setExpenses={setExpenses} />
    </div>
  );

  if (!plan) {
    return (
      <div className="space-y-5">
        <FieldTabs />
        <div className="card p-6 text-forest-700 flex gap-2"><Info size={18} className="shrink-0 mt-0.5" /> {t('sch.noSchedule')}</div>
        {side}
      </div>
    );
  }

  const counts = plan.tasks.reduce((m, x) => ((m[x.status] = (m[x.status] || 0) + 1), m), {});
  const shown = plan.tasks.filter((x) => filter === 'all' || x.status === filter);
  const overdueIds = plan.tasks.filter((x) => x.status === 'overdue').map((x) => x.id);
  const toggle = (x) => {
    const done = x.status !== 'done';
    setScheduleTaskDone(field.id, x.id, done);
    toast(done ? t('calendar.completed') : t('calendar.reopened'), done ? 'success' : 'info');
  };
  const markPast = () => {
    markScheduleTasksDone(field.id, overdueIds);
    toast(t('sch.markedPast', { n: overdueIds.length }));
  };

  return (
    <div className="space-y-5">
      <FieldTabs />
      <CropHeader field={field} plan={plan} onUpdate={(patch) => { updateCrop(field.id, patch); toast(t('sch.updated')); }} />

      {plan.constraints.map((c) => (
        <div key={c.key} role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3 text-red-900">
          <AlertOctagon size={22} className="shrink-0 text-red-600" />
          <div><p className="font-semibold">{L(c.title)}</p><p className="text-sm mt-0.5">{L(c.detail)}</p></div>
        </div>
      ))}

      <Timeline plan={plan} />

      <div className="grid lg:grid-cols-5 gap-5">
        <section className="card p-5 lg:col-span-3 min-w-0">
          <SectionTitle>{t('sch.tasks')}</SectionTitle>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-2" role="tablist">
            {FILTERS.map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`chip shrink-0 !min-h-[38px] text-sm ${filter === f ? 'chip-on' : 'chip-off'}`}>
                {f === 'all' ? t('common.all') : t(`sch.st.${f}`)} {f !== 'all' && counts[f] ? `· ${counts[f]}` : ''}
              </button>
            ))}
          </div>
          {overdueIds.length > 0 && (filter === 'all' || filter === 'overdue') && (
            <button onClick={markPast} className="btn-ghost !min-h-[40px] text-sm mb-3"><CheckCheck size={16} /> {t('sch.markPast')} ({overdueIds.length})</button>
          )}
          {shown.length === 0 ? (
            <p className="text-forest-600 py-6 text-center">{t('calendar.noTasks')}</p>
          ) : (
            <PhaseGroups plan={plan} tasks={shown} onToggle={toggle} />
          )}
          <p className="text-xs text-forest-600/80 mt-4 flex gap-1.5"><Info size={14} className="shrink-0 mt-0.5" /> {t('sch.source')}</p>
        </section>
        <div className="lg:col-span-2">{side}</div>
      </div>
    </div>
  );
}

/** Crop facts, today's day count, sowing-date editor and (paddy) duration group. */
function CropHeader({ field, plan, onUpdate }) {
  const { t, L, lang } = useApp();
  const { schedule, params, das, dap } = plan;
  const cropName = L(cropCatalog[field.cropId]?.name || { en: field.cropId }).split(' (')[0];
  const variants = Object.entries(schedule.variants);
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-forest-900">
            {fieldLabel(field, t, L, { withCrop: false })} · {cropName} <span className="text-sm font-normal italic text-forest-600">({schedule.sci})</span>
          </h2>
          <p className="text-sm text-forest-700 mt-1">
            {plan.perennial ? t('kb.perennialNote') : <>{t('sch.duration', { range: params.range })} · {t(plan.transplanted ? 'sch.transplanted' : schedule.dateIsTransplant ? 'kb.fromTransplant' : 'sch.direct')}</>}
          </p>
          {params.examples && <p className="text-xs text-forest-600 mt-0.5">{t('sch.varieties', { v: params.examples })}</p>}
          {params.spacing && variants.length === 1 && <p className="text-xs text-forest-600 mt-0.5">{t('kb.spacing', { v: params.spacing })}</p>}
        </div>
        <label className="block shrink-0">
          <span className="label">{t(plan.transplanted ? 'sch.nurseryDate' : dateLabelKey(field.cropId) === 'crops.sowDate' ? 'sch.sowDate' : dateLabelKey(field.cropId))}</span>
          <input type="date" className="input !min-h-[44px]" value={field.sowDate} onChange={(e) => e.target.value && onUpdate({ sowDate: e.target.value })} />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {plan.perennial ? (
          plan.age < 0 ? (
            <span className="chip chip-on !min-h-[36px] text-sm">{t('sch.sowIn', { n: -plan.age })}</span>
          ) : (
            <>
              <span className="chip chip-on !min-h-[36px] text-sm">{t('kb.yearN', { n: Math.floor(plan.age / 365) + 1 })}</span>
              {plan.currentPhase && <span className="chip chip-off !min-h-[36px] text-sm">{t('kb.seasonChip')}: {L(plan.currentPhase.name)}</span>}
            </>
          )
        ) : das < 0 ? (
          <span className="chip chip-on !min-h-[36px] text-sm">{t('sch.sowIn', { n: -das })}</span>
        ) : (
          <>
            <span className="chip chip-on !min-h-[36px] text-sm">{t('sch.dayLong', { n: das })}</span>
            {dap != null && <span className="chip chip-off !min-h-[36px] text-sm">{t('sch.dapLong', { n: dap })}</span>}
            {plan.currentPhase && <span className="chip chip-off !min-h-[36px] text-sm">{t('sch.phaseNow')}: {L(plan.currentPhase.name)}</span>}
          </>
        )}
        {plan.harvestDate && <span className="chip chip-off !min-h-[36px] text-sm"><CalendarDays size={14} /> {t('sch.harvestOn', { date: fmtDate(plan.harvestDate, lang, { day: 'numeric', month: 'short', year: 'numeric' }) })}</span>}
      </div>

      {plan.routines?.map((r) => (
        <div key={r.key} className="mt-4 rounded-2xl bg-navy-50 border border-navy-200 p-3 text-sm text-forest-800">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-navy-800">{t('kb.routine')} · {L(r.title)}</span>
          {L(r.detail)}
        </div>
      ))}

      {variants.length > 1 && (
        <div className="mt-4">
          <span className="label">{t('sch.variantTitle')}</span>
          <div className="grid sm:grid-cols-2 gap-2">
            {variants.map(([key, v]) => (
              <button
                key={key}
                type="button"
                aria-pressed={params.variantKey === key}
                onClick={() => onUpdate({ variant: key })}
                className={`rounded-2xl border px-3 py-2 text-left transition ${params.variantKey === key ? 'border-emerald-500 bg-emerald-50' : 'border-black/[0.08] hover:bg-cream-100'}`}
              >
                <div className="font-semibold text-forest-900 text-sm">{L(v.name)} · {v.range} {t('sch.daysUnit')}</div>
                <div className="text-xs text-forest-600">{v.examples} · {v.spacing}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Timeline({ plan }) {
  const { t, L, lang } = useApp();
  const first = plan.phases[0].start;
  const last = plan.phases[plan.phases.length - 1].end;
  const span = last - first;
  const pos = (day) => `${Math.min(100, Math.max(0, ((day - first) / span) * 100))}%`;
  const showMarker = plan.das >= first && plan.das <= last;
  return (
    <section className="card p-5">
      <SectionTitle>{t('sch.timeline')}</SectionTitle>
      <div className="relative pt-8">
        <div className="flex h-4 rounded-full overflow-hidden">
          {plan.phases.map((ph, i) => (
            <div key={ph.key} style={{ width: `${((ph.end - ph.start) / span) * 100}%`, background: PHASE_COLORS[i % PHASE_COLORS.length], opacity: plan.currentPhase?.key === ph.key ? 1 : 0.4 }} />
          ))}
        </div>
        {showMarker && (
          <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: pos(plan.das) }}>
            <span className="text-[11px] font-semibold text-white bg-forest-900 rounded-full px-2 py-0.5 whitespace-nowrap">{t('common.today')}</span>
            <span className="h-7 w-0.5 bg-forest-900" />
          </div>
        )}
      </div>
      <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
        {plan.phases.map((ph, i) => {
          const cur = plan.currentPhase?.key === ph.key;
          return (
            <li key={ph.key} className={`rounded-xl p-2.5 border ${cur ? 'border-emerald-500 bg-emerald-50' : 'border-black/[0.06] bg-white'}`}>
              <div className="flex items-start gap-1.5 text-sm font-semibold text-forest-900 leading-snug">
                <span className="h-2.5 w-2.5 rounded-full shrink-0 mt-1" style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }} /> {L(ph.name)}
              </div>
              {!plan.perennial && <div className="text-[11px] text-forest-600 mt-0.5">{t('sch.dayRange', { a: Math.max(0, ph.start), b: ph.end - 1 })}</div>}
              <div className="text-[11px] text-forest-600">{fmtDate(ph.startDate, lang)} – {fmtDate(ph.endDate, lang)}</div>
              {cur && <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">{t('cc.current')}</div>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PhaseGroups({ plan, tasks, onToggle }) {
  const { L } = useApp();
  // Plantation tasks span several years, so they read best as one dated list.
  if (plan.perennial) return <ul className="space-y-2">{tasks.map((x) => <TaskItem key={x.id} x={x} onToggle={onToggle} />)}</ul>;
  return (
    <div className="space-y-4">
      {plan.phases.map((ph) => {
        const list = tasks.filter((x) => x.phaseKey === ph.key);
        if (!list.length) return null;
        return (
          <div key={ph.key}>
            <h3 className="text-xs font-bold uppercase tracking-wide text-forest-600 mb-2">{L(ph.name)}</h3>
            <ul className="space-y-2">{list.map((x) => <TaskItem key={x.id} x={x} onToggle={onToggle} />)}</ul>
          </div>
        );
      })}
    </div>
  );
}

function TaskItem({ x, onToggle }) {
  const { t, L, lang } = useApp();
  const done = x.status === 'done';
  const ts = TYPE_STYLE[x.type] || TYPE_STYLE.other;
  const dates = x.start === x.end ? fmtDate(x.start, lang, { weekday: 'short', day: 'numeric', month: 'short' }) : `${fmtDate(x.start, lang)} – ${fmtDate(x.end, lang)}`;
  const days = x.everyDays
    ? t('kb.everyDays', { n: x.everyDays })
    : x.months
      ? fmtDate(x.start, lang, { month: 'short', year: 'numeric' }) + (x.months.length > 1 ? ` – ${fmtDate(x.end, lang, { month: 'short', year: 'numeric' })}` : '')
      : x.startDay === x.endDay ? t('sch.day', { n: x.startDay }) : t('sch.dayRange', { a: x.startDay, b: x.endDay });
  return (
    <li className={`flex items-start gap-2 rounded-2xl border px-2 py-2 ${done ? 'bg-cream-100/70 border-transparent' : x.status === 'today' ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-black/[0.06]'}`}>
      <button onClick={() => onToggle(x)} aria-pressed={done} aria-label={done ? t('calendar.reopened') : t('calendar.completed')} className="h-11 w-11 shrink-0 grid place-items-center text-emerald-600">
        {done ? <CheckCircle2 size={24} /> : <Circle size={24} />}
      </button>
      <div className="flex-1 min-w-0 py-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${ts.chip}`}>{t(`sch.type.${x.type}`)}</span>
          {x.priority === 'critical' && !done && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 bg-red-100 text-red-800"><CircleAlert size={11} /> {t('sch.critical')}</span>
          )}
          {x.round && <span className="text-[11px] text-forest-600">{t('sch.round', { n: x.round })}</span>}
        </div>
        <div className={`font-semibold leading-snug mt-1 ${done ? 'line-through text-forest-500' : 'text-forest-900'}`}>{L(x.title)}</div>
        {!done && <p className="text-sm text-forest-700 mt-0.5">{L(x.detail)}</p>}
        <div className="text-xs text-forest-600 mt-1">
          {days}{x.dapStart != null ? ` · ${t('sch.dapShort', { n: x.dapStart })}` : ''}{x.months ? '' : ` · ${dates}`}
        </div>
      </div>
      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 shrink-0 mt-1 ${STATUS_STYLE[x.status]}`}>{t(`sch.st.${x.status}`)}</span>
    </li>
  );
}

function ExpenseLog({ field, items, total, setExpenses }) {
  const { t, lang, toast } = useApp();
  const [form, setForm] = useState({ date: todayISO(), category: 'fertilizer', amount: '', note: '' });
  const byCat = items.reduce((m, e) => ((m[e.category] = (m[e.category] || 0) + Number(e.amount)), m), {});

  const add = (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return toast(t('cc.amountRequired'), 'error');
    setExpenses((xs) => [...xs, { id: `e${Date.now()}`, fieldId: field.id, ...form, amount }]);
    setForm((f) => ({ ...f, amount: '', note: '' }));
    toast(t('cc.expenseAdded'));
  };

  return (
    <section className="card p-5">
      <SectionTitle icon={Wallet}>{t('cc.expenses')}</SectionTitle>
      <div className="rounded-xl bg-emerald-50 p-3 flex items-center justify-between">
        <span className="text-sm text-forest-700">{t('cc.total')}</span>
        <span className="text-2xl font-semibold text-forest-900">₹{fmtNum(total, lang)}</span>
      </div>
      {Object.keys(byCat).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(byCat).map(([c, v]) => (
            <span key={c} className="text-xs rounded-full bg-cream-100 px-2 py-1 text-forest-800">{t(`cc.exp.${c}`)}: ₹{fmtNum(v, lang)}</span>
          ))}
        </div>
      )}

      <form onSubmit={add} className="grid grid-cols-2 gap-2 mt-4">
        <input type="date" className="input !min-h-[44px]" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label={t('calendar.date')} />
        <select className="input !min-h-[44px]" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} aria-label={t('calendar.category')}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t(`cc.exp.${c}`)}</option>)}
        </select>
        <label className="relative">
          <span className="sr-only">{t('cc.amount')}</span>
          <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-500" />
          <input className="input !min-h-[44px] !pl-8" type="number" min="1" inputMode="numeric" placeholder={t('cc.amount')} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </label>
        <input className="input !min-h-[44px]" placeholder={t('cc.note')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} aria-label={t('cc.note')} />
        <button className="btn-primary col-span-2 !min-h-[44px]"><Plus size={16} /> {t('cc.addExpense')}</button>
      </form>

      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-black/[0.06]">
          {items.map((e) => (
            <li key={e.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="flex-1 min-w-0">
                <span className="font-medium text-forest-900">{t(`cc.exp.${e.category}`)}</span>
                <span className="text-forest-600"> · {fmtDate(e.date, lang)}{e.note ? ` · ${e.note}` : ''}</span>
              </span>
              <span className="font-semibold text-forest-900">₹{fmtNum(e.amount, lang)}</span>
              <button className="h-9 w-9 grid place-items-center rounded-full text-forest-500 hover:text-red-700 hover:bg-red-50" aria-label={t('calendar.delete')} onClick={() => setExpenses((xs) => xs.filter((x) => x.id !== e.id))}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
