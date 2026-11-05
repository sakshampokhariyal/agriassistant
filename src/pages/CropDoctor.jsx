import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, CalendarPlus, CheckCircle2, FlaskConical, ImagePlus, Leaf, RefreshCw, ScanLine, ShieldAlert, Sprout, Sun, Focus, Maximize, Hand, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { diagnose } from '../data/diagnosis';
import { addDays } from '../utils/date';
import { compressImage } from '../utils/media';
import { fieldLabel } from '../utils/fields';
import { Badge, PageHeader, ProgressBar } from '../components/ui';
import FieldTabs from '../components/FieldTabs';
import PestWatch from '../components/PestWatch';

const SEV = { low: 'green', medium: 'amber', high: 'red' };
const TIPS = [
  ['daylight', Sun],
  ['single', Leaf],
  ['fill', Maximize],
  ['focus', Focus],
  ['steady', Hand],
];

export default function CropDoctor() {
  const { t, L, activeField, addTask, setCropHealth, toast, dataSaver } = useApp();
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const timer = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | analyzing | done
  const [report, setReport] = useState(null);
  const [picked, setPicked] = useState({});

  useEffect(() => () => clearTimeout(timer.current), []);
  // New field selected → start over.
  useEffect(() => {
    setPhase('idle');
    setReport(null);
  }, [activeField?.id]);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      // Data Saver: smaller, more compressed preview.
      const data = await compressImage(f, dataSaver ? 640 : 1280, dataSaver ? 0.5 : 0.75);
      setPhoto(data);
      setPhase('idle');
      setReport(null);
    } catch {
      toast('Image only', 'error');
    }
  };

  const analyze = () => {
    setPhase('analyzing');
    timer.current = setTimeout(() => {
      const r = diagnose(activeField?.cropId);
      setReport(r);
      setPicked(Object.fromEntries(r.tasks.map((_, i) => [i, true])));
      setPhase('done');
      if (activeField) setCropHealth(activeField.id, 'watch');
    }, 2200);
  };

  const addTasks = () => {
    const chosen = report.tasks.filter((_, i) => picked[i]);
    if (!chosen.length) return;
    chosen.forEach((tk) =>
      addTask({
        title: { en: `${tk.title.en} – ${report.name.en.split(' (')[0]}`, hi: `${tk.title.hi} – ${report.name.hi.split(' (')[0]}`, kn: `${tk.title.kn} – ${report.name.kn.split(' (')[0]}` },
        date: addDays(tk.days),
        category: tk.category,
        cropId: activeField?.cropId || null,
      })
    );
    toast(t('dx.tasksAdded', { n: chosen.length }));
  };

  return (
    <div>
      <PageHeader title={t('dx.title')} subtitle={t('dx.sub')} demo />
      <FieldTabs className="mb-5" />

      <div className="grid lg:grid-cols-[minmax(0,26rem)_1fr] gap-5 items-start">
        {/* Capture */}
        <section className="card p-4 md:p-5 lg:sticky lg:top-24">
          <p className="text-sm text-forest-700 mb-3">
            {t('dx.for')}: <b className="text-forest-900">{activeField ? fieldLabel(activeField, t, L) : '—'}</b>
          </p>

          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-forest-900">
            {photo ? (
              <img src={photo} alt={t('dx.preview')} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-white/70 text-sm text-center px-8">
                <span><Leaf size={36} className="mx-auto mb-2 text-emerald-300" />{t('dx.placeLeaf')}</span>
              </div>
            )}
            {/* Framing guide */}
            <div className="absolute inset-[12%] rounded-2xl border-2 border-dashed border-white/70 pointer-events-none" aria-hidden>
              {['top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl', 'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl', 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl', 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl'].map((c) => (
                <span key={c} className={`absolute h-6 w-6 border-yellow-300 -m-0.5 ${c}`} />
              ))}
            </div>
            {phase === 'analyzing' && (
              <>
                <div className="absolute inset-0 bg-forest-900/40" />
                <div className="scan-line absolute left-0 right-0 h-1 bg-yellow-300 shadow-[0_0_16px_4px_rgba(253,224,71,0.8)]" />
              </>
            )}
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
            {TIPS.map(([k, Icon]) => (
              <li key={k} className="flex items-center gap-2 text-xs text-forest-700"><Icon size={14} className="text-emerald-600 shrink-0" /> {t(`dx.tip.${k}`)}</li>
            ))}
          </ul>

          <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button className="btn-soft" onClick={() => camRef.current?.click()}><Camera size={18} /> {t('dx.camera')}</button>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}><ImagePlus size={18} /> {t('dx.upload')}</button>
          </div>
          <button className="btn-primary w-full mt-2" disabled={!photo || phase === 'analyzing'} onClick={analyze}>
            {phase === 'analyzing' ? <RefreshCw size={18} className="animate-spin" /> : <ScanLine size={18} />} {phase === 'analyzing' ? t('crops.analyzing') : t('crops.analyze')}
          </button>
          {dataSaver && <p className="text-xs text-forest-600 mt-2">{t('set.compressNote')}</p>}
        </section>

        {/* Report */}
        <section className="min-w-0">
          {!report ? (
            <div className="card p-8 text-center text-forest-600">
              <ScanLine size={32} className="mx-auto text-forest-300" />
              <p className="mt-2">{t('dx.empty')}</p>
            </div>
          ) : (
            <Report report={report} picked={picked} setPicked={setPicked} onAddTasks={addTasks} />
          )}
        </section>
      </div>

      <PestWatch />
    </div>
  );
}

function Report({ report, picked, setPicked, onAddTasks }) {
  const { t, L } = useApp();
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge tone="amber"><FlaskConical size={13} /> {t('dx.mock')}</Badge>
        </div>
        <div className="flex items-start gap-3">
          <span className="h-12 w-12 rounded-2xl bg-red-50 text-red-700 grid place-items-center shrink-0"><ShieldAlert size={24} /></span>
          <div>
            <h2 className="text-xl font-semibold text-forest-900 leading-tight">{L(report.name)}</h2>
            <p className="text-forest-700 mt-1">{L(report.symptoms)}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl bg-cream-100 p-3">
            <div className="text-xs text-forest-600">{t('crops.severity')}</div>
            <div className="mt-1"><Badge tone={SEV[report.severity]}>{t(`sev.${report.severity}`)}</Badge></div>
          </div>
          <div className="rounded-xl bg-cream-100 p-3">
            <div className="flex justify-between text-xs text-forest-600 mb-1.5"><span>{t('crops.confidence')}</span><b className="text-forest-900">{report.confidence}%</b></div>
            <ProgressBar value={report.confidence} tone="bg-emerald-600" />
          </div>
          <div className="rounded-xl bg-cream-100 p-3">
            <div className="text-xs text-forest-600">{t('dx.affected')}</div>
            <div className="font-semibold text-forest-900 mt-0.5">~{report.affected}%</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <RemedyCol n={1} title={t('dx.rem.traditional')} tone="bg-amber-50 border-amber-200">
          <ul className="space-y-2">{report.traditional.map((r, i) => <li key={i} className="flex gap-2 text-sm"><Sprout size={15} className="text-amber-700 shrink-0 mt-0.5" />{L(r)}</li>)}</ul>
        </RemedyCol>
        <RemedyCol n={2} title={t('dx.rem.organic')} tone="bg-emerald-50 border-emerald-200">
          <Doses items={report.organic} />
        </RemedyCol>
        <RemedyCol n={3} title={t('dx.rem.chemical')} tone="bg-sky-50 border-sky-200">
          <Doses items={report.chemical} />
          <p className="text-xs text-red-800 mt-3 flex gap-1.5"><AlertTriangle size={14} className="shrink-0 mt-0.5" /> {t('dx.safety')}</p>
        </RemedyCol>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-forest-900 flex items-center gap-2"><CalendarPlus size={18} className="text-emerald-600" /> {t('dx.makeTasks')}</h3>
        <ul className="mt-2 space-y-1">
          {report.tasks.map((tk, i) => (
            <li key={i}>
              <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={!!picked[i]} onChange={(e) => setPicked((p) => ({ ...p, [i]: e.target.checked }))} />
                <span className="flex-1 text-forest-800">{L(tk.title)}</span>
                <span className="text-xs text-forest-600 shrink-0">{t('dx.inDays', { n: tk.days })}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="btn-primary" onClick={onAddTasks} disabled={!Object.values(picked).some(Boolean)}><CalendarPlus size={18} /> {t('dx.addToCalendar')}</button>
          <Link to="/calendar?view=tasks" className="btn-ghost"><CheckCircle2 size={18} /> {t('dx.openCalendar')}</Link>
        </div>
      </div>
      <p className="text-xs text-forest-600/80">{t('dx.disclaimer')}</p>
    </div>
  );
}

function RemedyCol({ n, title, tone, children }) {
  return (
    <section className={`rounded-2xl border p-4 ${tone}`}>
      <h3 className="font-semibold text-forest-900 mb-3 flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-forest-800 text-white text-xs grid place-items-center">{n}</span> {title}
      </h3>
      {children}
    </section>
  );
}

function Doses({ items }) {
  const { t, L } = useApp();
  return (
    <ul className="space-y-3">
      {items.map((d, i) => (
        <li key={i} className="text-sm">
          <div className="font-medium text-forest-900">{L(d.name)}</div>
          <div className="text-forest-700">{t('dx.dose')}: <b>{d.dose}</b></div>
          <div className="text-forest-700">{t('dx.perAcre')}: <b>{L(d.perAcre)}</b></div>
        </li>
      ))}
    </ul>
  );
}
