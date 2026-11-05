import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, IndianRupee, NotebookPen, Plus, Trash2, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import useLocalStorage from '../../hooks/useLocalStorage';
import { EXPENSE_CATEGORIES, planTasks, stageTimeline } from '../../utils/cropPlan';
import { fmtDate, fmtNum, todayISO } from '../../utils/date';
import { fieldLabel } from '../../utils/fields';
import { EmptyState, SectionTitle } from '../ui';
import FieldTabs from '../FieldTabs';

const STAGE_COLOR = { landPrep: '#a8a29e', sowing: '#84cc16', vegetative: '#16a34a', flowering: '#d97706', harvest: '#b45309' };
const STATUS = {
  done: 'bg-emerald-100 text-emerald-800',
  due: 'bg-amber-100 text-amber-800',
  upcoming: 'bg-sky-100 text-sky-800',
  overdue: 'bg-red-100 text-red-800',
};
const FILTERS = ['all', 'overdue', 'due', 'upcoming', 'done'];

export default function CropCalendar() {
  const { t, L, lang, activeField, crops, toast } = useApp();
  // First run (demo): tasks more than 3 days in the past are treated as already done,
  // so the demo farm isn't flooded with "overdue" items. Fields added later start clean.
  const [doneAll, setDoneAll] = useLocalStorage('ks-plan-done-v1', () =>
    Object.fromEntries(
      crops.map((f) => [f.id, Object.fromEntries(planTasks(f, {}, todayISO()).filter((x) => x.diff < -3).map((x) => [x.key, true]))])
    )
  );
  const [notesAll, setNotesAll] = useLocalStorage('ks-field-notes-v1', {});
  const [expenses, setExpenses] = useLocalStorage('ks-expenses-v1', []);
  const [filter, setFilter] = useState('all');

  const field = activeField;
  const today = todayISO();
  const timeline = useMemo(() => (field ? stageTimeline(field, today) : null), [field, today]);
  const tasks = useMemo(() => (field ? planTasks(field, doneAll[field.id], today) : []), [field, doneAll, today]);

  if (!field || !timeline?.stages.length) return <div className="card"><EmptyState text={t('crops.empty')} /></div>;

  const counts = tasks.reduce((m, x) => ((m[x.status] = (m[x.status] || 0) + 1), m), {});
  const shown = tasks.filter((x) => filter === 'all' || x.status === filter);
  const toggle = (key) => {
    const was = !!doneAll[field.id]?.[key];
    setDoneAll((m) => ({ ...m, [field.id]: { ...(m[field.id] || {}), [key]: !was } }));
    toast(was ? t('calendar.reopened') : t('calendar.completed'), was ? 'info' : 'success');
  };

  const span = timeline.totalEnd - timeline.totalStart;
  const pos = (day) => `${Math.min(100, Math.max(0, ((day - timeline.totalStart) / span) * 100))}%`;
  const fieldExpenses = expenses.filter((e) => e.fieldId === field.id).sort((a, b) => b.date.localeCompare(a.date));
  const total = fieldExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5">
      <FieldTabs />

      {/* Stage timeline */}
      <section className="card p-5">
        <SectionTitle>{t('cc.timeline')} · {fieldLabel(field, t, L)}</SectionTitle>
        <div className="relative pt-8">
          <div className="flex h-4 rounded-full overflow-hidden">
            {timeline.stages.map((s) => (
              <div key={s.key} style={{ width: `${((s.endDay - s.startDay) / span) * 100}%`, background: STAGE_COLOR[s.key], opacity: s.key === timeline.current ? 1 : 0.45 }} />
            ))}
          </div>
          {timeline.age >= timeline.totalStart && timeline.age <= timeline.totalEnd && (
            <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: pos(timeline.age) }}>
              <span className="text-[11px] font-semibold text-white bg-forest-900 rounded-full px-2 py-0.5 whitespace-nowrap">{t('common.today')}</span>
              <span className="h-7 w-0.5 bg-forest-900" />
            </div>
          )}
        </div>
        <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
          {timeline.stages.map((s, i) => {
            const cur = s.key === timeline.current;
            return (
              <li key={s.key} className={`rounded-xl p-2.5 border ${cur ? 'border-emerald-500 bg-emerald-50' : 'border-black/[0.06] bg-white'}`}>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-forest-900">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STAGE_COLOR[s.key] }} /> {i + 1}. {t(`cc.stage.${s.key}`)}
                </div>
                <div className="text-[11px] text-forest-600 mt-0.5">{fmtDate(s.start, lang)} – {fmtDate(s.end, lang)}</div>
                {cur && <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">{t('cc.current')}</div>}
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-forest-600/80 mt-3">{t('cc.autoNote')}</p>
      </section>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Scheduled tasks */}
        <section className="card p-5 lg:col-span-3 min-w-0">
          <SectionTitle>{t('cc.tasks')}</SectionTitle>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-2" role="tablist">
            {FILTERS.map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`chip shrink-0 !min-h-[38px] text-sm ${filter === f ? 'chip-on' : 'chip-off'}`}>
                {f === 'all' ? t('common.all') : t(`cc.st.${f}`)} {f !== 'all' && counts[f] ? `· ${counts[f]}` : ''}
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="text-forest-600 py-6 text-center">{t('calendar.noTasks')}</p>
          ) : (
            <ul className="space-y-2">
              {shown.map((x) => (
                <li key={x.key} className={`flex items-center gap-2 rounded-2xl border px-2 min-h-[60px] ${x.status === 'done' ? 'bg-cream-100/70 border-transparent' : 'bg-white border-black/[0.06]'}`}>
                  <button onClick={() => toggle(x.key)} aria-pressed={x.status === 'done'} aria-label={t('common.done')} className="h-11 w-11 shrink-0 grid place-items-center text-emerald-600">
                    {x.status === 'done' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  <div className="flex-1 min-w-0 py-2">
                    <div className={`font-medium leading-snug ${x.status === 'done' ? 'line-through text-forest-500' : 'text-forest-900'}`}>
                      {t(`cc.task.${x.scout ? 'scout' : x.key}`)}
                    </div>
                    <div className="text-xs text-forest-600 mt-0.5">{fmtDate(x.date, lang, { weekday: 'short', day: 'numeric', month: 'short' })} · {t(`cat.${x.cat}`)}</div>
                  </div>
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 shrink-0 ${STATUS[x.status]}`}>{t(`cc.st.${x.status}`)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="lg:col-span-2 space-y-5 min-w-0">
          {/* Notes */}
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

          {/* Expenses */}
          <ExpenseLog field={field} items={fieldExpenses} total={total} setExpenses={setExpenses} />
        </div>
      </div>
    </div>
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
