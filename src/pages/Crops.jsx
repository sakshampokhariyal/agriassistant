import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Camera, ImagePlus, Plus, ScanLine, Trash2, Lightbulb, CalendarCheck, Wheat, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import useCropViews from '../hooks/useCropViews';
import { cropCatalog } from '../data/farmer';
import { analyzeLeaf } from '../data/ai';
import { fmtDate, todayISO } from '../utils/date';
import { Badge, EmptyState, Field, PageHeader, ProgressBar, SectionTitle } from '../components/ui';
import Modal from '../components/Modal';
import CropArt from '../components/CropArt';
import DiseaseResult from '../components/DiseaseResult';

export default function Crops() {
  const { t, L, lang, addCrop, removeCrop, setCropHealth, toast } = useApp();
  const crops = useCropViews();
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [scanCrop, setScanCrop] = useState('ragi');
  const [photo, setPhoto] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | analyzing | done
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const scanRef = useRef(null);
  const timer = useRef(null);
  const { hash } = useLocation();

  const active = crops.find((c) => c.id === selected) || crops[0];

  useEffect(() => {
    if (hash === '#scan') setTimeout(() => scanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
  }, [hash]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Image only', 'error');
    const url = URL.createObjectURL(f);
    setPhoto((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
    setPhase('idle');
    setResult(null);
    e.target.value = '';
  };

  const analyze = () => {
    setPhase('analyzing');
    timer.current = setTimeout(() => {
      const r = analyzeLeaf(scanCrop);
      setResult(r);
      setPhase('done');
      const target = crops.find((c) => c.cropId === scanCrop);
      if (target) setCropHealth(target.id, 'watch');
    }, 2400);
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setPhoto(null);
  };

  return (
    <div>
      <PageHeader
        title={t('crops.title')}
        subtitle={t('dash.activeCrops')}
        action={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={20} /> {t('crops.addCrop')}
          </button>
        }
      />

      {crops.length === 0 ? (
        <div className="card">
          <EmptyState icon={Wheat} text={t('crops.empty')} action={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={18} /> {t('crops.addCrop')}</button>} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              {crops.map((c) => {
                const on = active?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    aria-pressed={on}
                    className={`card overflow-hidden text-left transition hover:shadow-lift ${on ? 'ring-2 ring-forest-500' : ''}`}
                  >
                    <CropArt type={c.cat.art} className="h-32 w-full" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-lg text-forest-800 leading-tight">{L(c.cat.name)}</h3>
                          <p className="text-sm text-forest-600/80">{c.acres} {t('common.acres')}</p>
                        </div>
                        <Badge tone={c.health === 'healthy' ? 'green' : 'amber'}>
                          {c.health === 'healthy' ? t('crops.healthy') : t('crops.watch')}
                        </Badge>
                      </div>
                      <p className="mt-2 font-bold text-forest-700">{t('crops.stage')}: <span className="font-semibold">{L(c.stage)}</span></p>
                      <div className="mt-2"><ProgressBar value={c.progress} /></div>
                      <div className="mt-2 flex justify-between text-xs text-forest-600/80">
                        <span>{t('crops.sown')}: {fmtDate(c.sowDate, lang)}</span>
                        <span>{t('crops.harvest')}: {fmtDate(c.harvestDate, lang)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {active && (
              <motion.section key={active.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <SectionTitle icon={Lightbulb}>
                  {L(active.cat.name)} – {t('crops.tips')}
                </SectionTitle>
                <div className="grid sm:grid-cols-3 gap-3 mb-4">
                  <Info label={t('crops.stage')} value={L(active.stage)} />
                  <Info label={t('crops.harvest')} value={`${fmtDate(active.harvestDate, lang, { day: 'numeric', month: 'short', year: 'numeric' })}`} />
                  <Info label={t('weather.irrigation')} value={L(active.cat.waterNeed)} />
                </div>
                <ul className="space-y-2.5">
                  {active.cat.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2.5 rounded-xl bg-cream-100 p-3">
                      <CalendarCheck size={20} className="text-forest-500 shrink-0 mt-0.5" aria-hidden />
                      <span>{L(tip)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end">
                  <button
                    className="btn-ghost !min-h-[44px] text-clay-600 !border-clay-500/40 hover:!bg-clay-100"
                    onClick={() => {
                      removeCrop(active.id);
                      setSelected(null);
                      toast(t('crops.removed'), 'info');
                    }}
                  >
                    <Trash2 size={18} /> {t('crops.remove')}
                  </button>
                </div>
              </motion.section>
            )}
          </div>

          {/* Scan panel */}
          <section id="scan" ref={scanRef} className="card p-5 h-fit lg:sticky lg:top-24 scroll-mt-24">
            <SectionTitle icon={ScanLine}>{t('crops.scan')}</SectionTitle>
            <p className="text-forest-600/80 text-sm mb-3">{t('crops.scanSub')}</p>

            <div className="mb-3">
              <span className="label">{t('crops.forCrop')}</span>
              <div className="flex flex-wrap gap-2">
                {['ragi', 'tomato', 'maize'].map((id) => (
                  <button key={id} onClick={() => { setScanCrop(id); setPhase('idle'); setResult(null); }} className={`chip ${scanCrop === id ? 'chip-on' : 'chip-off'}`}>
                    {L(cropCatalog[id].name).split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
            {!photo ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-forest-300 bg-forest-50/60 hover:bg-forest-50 min-h-[180px] grid place-items-center text-forest-600 p-4"
              >
                <span className="flex flex-col items-center gap-2 font-bold text-center">
                  <span className="h-14 w-14 rounded-full bg-white grid place-items-center shadow-card"><Camera size={26} /></span>
                  {t('crops.dropHere')}
                  <span className="text-xs font-semibold text-forest-500/80">{t('crops.tryAnother')}</span>
                </span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-forest-900">
                <img src={photo} alt="" className="w-full max-h-72 object-cover" />
                {phase === 'analyzing' && (
                  <>
                    <div className="absolute inset-0 bg-forest-900/40" />
                    <div className="scan-line absolute left-0 right-0 h-1 bg-earth-400 shadow-[0_0_16px_4px_rgba(217,162,79,0.8)]" />
                  </>
                )}
              </div>
            )}

            {photo && phase === 'idle' && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button className="btn-ghost" onClick={() => fileRef.current?.click()}><ImagePlus size={18} /> {t('crops.choosePhoto').split(' ')[0]}</button>
                <button className="btn-primary" onClick={analyze}><ScanLine size={18} /> {t('crops.analyze')}</button>
              </div>
            )}
            {phase === 'analyzing' && (
              <p className="mt-3 font-bold text-forest-700 flex items-center gap-2" role="status">
                <RefreshCw size={18} className="animate-spin" /> {t('crops.analyzing')}
              </p>
            )}
            {phase === 'done' && result && (
              <div className="mt-4">
                <DiseaseResult result={result} />
                <button className="btn-soft w-full mt-4" onClick={reset}><Camera size={18} /> {t('crops.rescan')}</button>
              </div>
            )}
          </section>
        </div>
      )}

      <AddCropModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={(c) => { addCrop(c); setAddOpen(false); toast(t('crops.added')); }} />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-forest-50 p-3">
      <div className="text-xs font-bold text-forest-500 uppercase tracking-wide">{label}</div>
      <div className="font-extrabold text-forest-800 mt-0.5">{value}</div>
    </div>
  );
}

function AddCropModal({ open, onClose, onAdd }) {
  const { t, L } = useApp();
  const [cropId, setCropId] = useState('ragi');
  const [acres, setAcres] = useState('1');
  const [sowDate, setSowDate] = useState(todayISO());

  useEffect(() => {
    if (open) {
      setCropId('ragi');
      setAcres('1');
      setSowDate(todayISO());
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('crops.addCrop')}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={() => onAdd({ cropId, acres: Math.max(0.1, Number(acres) || 1), sowDate })}>{t('common.add')}</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('crops.selectCrop')}>
          <select className="input" value={cropId} onChange={(e) => setCropId(e.target.value)}>
            {Object.values(cropCatalog).map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
          </select>
        </Field>
        <Field label={t('crops.acresLabel') + ` (${t('common.acres')})`}>
          <input className="input" type="number" min="0.1" step="0.1" value={acres} onChange={(e) => setAcres(e.target.value)} />
        </Field>
        <Field label={t('crops.sowDate')}>
          <input className="input" type="date" value={sowDate} max={todayISO()} onChange={(e) => setSowDate(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
