import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, Circle, Megaphone, Plus, Trash2, X, CalendarX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { categoryStyle, taskCategories } from '../data/tasks';
import { cropCatalog } from '../data/farmer';
import { addDays, fmtDate, parseISO, toISO, todayISO } from '../utils/date';
import { localeOf } from '../translations';
import { Badge, EmptyState, Field, PageHeader, SectionTitle } from '../components/ui';
import Modal from '../components/Modal';

export default function Calendar() {
  const { t, L, lang, tasks, addTask, toggleTask, deleteTask, toast, crops } = useApp();
  const today = todayISO();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [cat, setCat] = useState('all');
  const [day, setDay] = useState(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => tasks.filter((x) => (cat === 'all' || x.category === cat) && (!day || x.date === day)),
    [tasks, cat, day]
  );
  const pending = filtered.filter((x) => !x.done).sort((a, b) => a.date.localeCompare(b.date));
  const done = filtered.filter((x) => x.done).sort((a, b) => b.date.localeCompare(a.date));

  // Month grid
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startPad = first.getDay();
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: daysIn }, (_, i) => toISO(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const byDate = useMemo(() => {
    const m = {};
    tasks.filter((x) => cat === 'all' || x.category === cat).forEach((x) => (m[x.date] ||= []).push(x));
    return m;
  }, [tasks, cat]);
  const monthLabel = new Intl.DateTimeFormat(localeOf(lang), { month: 'long', year: 'numeric' }).format(month);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(localeOf(lang), { weekday: 'short' }).format(new Date(2024, 0, 7 + i))
  );

  const toggle = (tk) => {
    toggleTask(tk.id);
    toast(tk.done ? t('calendar.reopened') : t('calendar.completed'), tk.done ? 'info' : 'success');
  };

  return (
    <div>
      <PageHeader
        title={t('calendar.title')}
        subtitle={t('calendar.sub')}
        action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={20} /> {t('calendar.add')}</button>}
      />

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 md:mx-0 md:px-0 mb-4" role="tablist">
        {['all', ...taskCategories].map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={`chip shrink-0 ${cat === c ? 'chip-on' : 'chip-off'}`}>
            {c !== 'all' && <span className={`h-2.5 w-2.5 rounded-full ${categoryStyle[c].dot}`} />}
            {c === 'all' ? t('common.all') : t('cat.' + c)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Month grid */}
        <section className="card p-4 md:p-5 lg:col-span-2 h-fit">
          <div className="flex items-center justify-between mb-3">
            <button aria-label="Previous month" className="h-11 w-11 rounded-full hover:bg-forest-50 grid place-items-center" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button>
            <h2 className="font-extrabold text-forest-800 text-lg capitalize">{monthLabel}</h2>
            <button aria-label="Next month" className="h-11 w-11 rounded-full hover:bg-forest-50 grid place-items-center" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-bold text-forest-500 mb-1">
            {weekdays.map((w, i) => <div key={i} className="py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((iso, i) => {
              if (!iso) return <div key={i} />;
              const list = byDate[iso] || [];
              const isToday = iso === today;
              const sel = iso === day;
              return (
                <button
                  key={iso}
                  onClick={() => setDay(sel ? null : iso)}
                  aria-label={fmtDate(iso, lang, { day: 'numeric', month: 'long' })}
                  aria-pressed={sel}
                  className={`aspect-square min-h-[44px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm font-bold transition ${
                    sel ? 'bg-forest-700 text-cream-50' : isToday ? 'bg-earth-100 text-earth-700 ring-2 ring-earth-400' : 'hover:bg-forest-50 text-forest-800'
                  }`}
                >
                  {parseISO(iso).getDate()}
                  <span className="flex gap-0.5 h-1.5">
                    {list.slice(0, 3).map((x) => (
                      <span key={x.id} className={`h-1.5 w-1.5 rounded-full ${x.done ? 'bg-forest-300' : sel ? 'bg-cream-50' : categoryStyle[x.category].dot}`} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          {day && (
            <button onClick={() => setDay(null)} className="mt-3 chip chip-off"><X size={14} /> {fmtDate(day, lang, { day: 'numeric', month: 'long' })}</button>
          )}
        </section>

        {/* Tasks */}
        <div className="lg:col-span-3 space-y-5">
          <section className="card p-4 md:p-5">
            <SectionTitle>{t('calendar.upcoming')} <span className="text-forest-500 text-base">({pending.length})</span></SectionTitle>
            {pending.length === 0 ? (
              <EmptyState icon={CalendarX} text={t('calendar.noTasks')} action={<button className="btn-soft" onClick={() => setOpen(true)}><Plus size={18} /> {t('calendar.add')}</button>} />
            ) : (
              <ul className="space-y-2">
                {pending.map((tk) => <TaskRow key={tk.id} tk={tk} today={today} onToggle={toggle} onDelete={() => { deleteTask(tk.id); toast(t('calendar.deleted'), 'info'); }} />)}
              </ul>
            )}
          </section>

          {done.length > 0 && (
            <section className="card p-4 md:p-5">
              <SectionTitle>{t('calendar.completedList')} <span className="text-forest-500 text-base">({done.length})</span></SectionTitle>
              <ul className="space-y-2">
                {done.map((tk) => <TaskRow key={tk.id} tk={tk} today={today} onToggle={toggle} onDelete={() => { deleteTask(tk.id); toast(t('calendar.deleted'), 'info'); }} />)}
              </ul>
            </section>
          )}
        </div>
      </div>

      <TaskModal open={open} onClose={() => setOpen(false)} defaultDate={day || today} crops={crops} onSave={(tk) => { addTask(tk); setOpen(false); toast(t('calendar.created')); }} />
    </div>
  );
}

function TaskRow({ tk, today, onToggle, onDelete }) {
  const { t, L, lang } = useApp();
  const s = categoryStyle[tk.category] || categoryStyle.other;
  const overdue = !tk.done && tk.date < today;
  return (
    <li className={`flex items-center gap-2 rounded-2xl border px-2 min-h-[64px] ${tk.done ? 'bg-cream-100/60 border-transparent' : 'bg-white border-cream-300'}`}>
      <button onClick={() => onToggle(tk)} aria-label={tk.done ? t('calendar.reopened') : t('calendar.completed')} aria-pressed={tk.done} className="h-12 w-12 shrink-0 grid place-items-center text-forest-600">
        {tk.done ? <CheckCircle2 size={26} className="text-forest-500" /> : <Circle size={26} />}
      </button>
      <div className="flex-1 min-w-0 py-2">
        <div className={`font-bold leading-snug ${tk.done ? 'line-through text-forest-500/70' : 'text-forest-800'}`}>{L(tk.title)}</div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          <span className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5 ${s.bg} ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {t('cat.' + tk.category)}
          </span>
          <span className="text-xs text-forest-600/80">{tk.date === today ? t('common.today') : fmtDate(tk.date, lang, { day: 'numeric', month: 'short', weekday: 'short' })}</span>
          {tk.cropId && cropCatalog[tk.cropId] && <span className="text-xs text-forest-600/80">· {L(cropCatalog[tk.cropId].name).split(' (')[0]}</span>}
          {overdue && <Badge tone="red">{t('calendar.overdue')}</Badge>}
        </div>
      </div>
      <button onClick={onDelete} aria-label={t('calendar.delete')} className="h-11 w-11 shrink-0 grid place-items-center rounded-full text-forest-500/60 hover:text-clay-600 hover:bg-clay-100">
        <Trash2 size={18} />
      </button>
    </li>
  );
}

function TaskModal({ open, onClose, onSave, defaultDate, crops }) {
  const { t, L } = useApp();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [category, setCategory] = useState('inspection');
  const [cropId, setCropId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setDate(defaultDate);
      setCategory('inspection');
      setCropId('');
      setError('');
    }
  }, [open, defaultDate]);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError(t('calendar.titleRequired'));
    onSave({ title: title.trim(), date, category, cropId: cropId || null });
  };

  return (
    <Modal open={open} onClose={onClose} title={t('calendar.newTask')} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('calendar.taskTitle')} error={error}>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <Field label={t('calendar.date')}>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <div>
          <span className="label">{t('calendar.category')}</span>
          <div className="flex flex-wrap gap-2">
            {taskCategories.map((c) => (
              <button type="button" key={c} onClick={() => setCategory(c)} aria-pressed={category === c} className={`chip ${category === c ? 'chip-on' : 'chip-off'}`}>{t('cat.' + c)}</button>
            ))}
          </div>
        </div>
        <Field label={t('calendar.crop')}>
          <select className="input" value={cropId} onChange={(e) => setCropId(e.target.value)}>
            <option value="">—</option>
            {[...new Set(crops.map((c) => c.cropId))].map((id) => <option key={id} value={id}>{L(cropCatalog[id].name)}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 justify-end pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary"><CalendarPlus size={18} /> {t('common.add')}</button>
        </div>
      </form>
    </Modal>
  );
}
