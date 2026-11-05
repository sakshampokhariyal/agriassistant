import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, CalendarDays, Droplets, Layers, Lightbulb, Pencil, Plus, ScanLine, Sprout, Trash2, Wheat, Mountain, Ruler, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import useCropViews from '../hooks/useCropViews';
import { cropCatalog, irrigationOptions, soilOptions } from '../data/farmer';
import { fmtDate, todayISO } from '../utils/date';
import { fieldLabel } from '../utils/fields';
import { Badge, EmptyState, Field, PageHeader, ProgressBar, SectionTitle } from '../components/ui';
import Modal from '../components/Modal';
import CropArt from '../components/CropArt';
import FieldTabs from '../components/FieldTabs';
import NpkCalculator from '../components/NpkCalculator';

export default function Crops() {
  const { t, L, lang, activeField, addCrop, updateCrop, removeCrop, toast } = useApp();
  const views = useCropViews();
  const [modal, setModal] = useState(null); // null | 'add' | field

  const field = views.find((v) => v.id === activeField?.id) || views[0];

  return (
    <div>
      <PageHeader
        title={t('crops.title')}
        subtitle={t('fld.sub')}
        action={
          <button className="btn-primary" onClick={() => setModal('add')}>
            <Plus size={20} /> {t('fld.add')}
          </button>
        }
      />

      {views.length === 0 ? (
        <div className="card">
          <EmptyState icon={Wheat} text={t('crops.empty')} action={<button className="btn-primary" onClick={() => setModal('add')}><Plus size={18} /> {t('fld.add')}</button>} />
        </div>
      ) : (
        <>
          <FieldTabs onAdd={() => setModal('add')} className="mb-5" />
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5 min-w-0">
              {field && <FieldDetail field={field} onEdit={() => setModal(field)} onRemove={() => { removeCrop(field.id); toast(t('crops.removed'), 'info'); }} />}
            </div>
            <div className="space-y-5 min-w-0">
              <CombinedOverview views={views} />
            </div>
          </div>
        </>
      )}

      <NpkCalculator field={field} />

      <FieldModal
        open={!!modal}
        field={modal && modal !== 'add' ? modal : null}
        onClose={() => setModal(null)}
        onSave={(data) => {
          if (modal === 'add') {
            addCrop(data);
            toast(t('crops.added'));
          } else {
            updateCrop(modal.id, data);
            toast(t('fld.saved'));
          }
          setModal(null);
        }}
      />
    </div>
  );
}

function FieldDetail({ field, onEdit, onRemove }) {
  const { t, L, lang } = useApp();
  return (
    <section className="card overflow-hidden">
      <CropArt type={field.cat.art} className="h-40 w-full" />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-forest-900 leading-tight">{fieldLabel(field, t, L)}</h2>
            <p className="text-forest-600 mt-0.5">{t('crops.stage')}: <b className="text-forest-800">{L(field.stage)}</b></p>
          </div>
          <Badge tone={field.health === 'healthy' ? 'green' : 'amber'}>{field.health === 'healthy' ? t('crops.healthy') : t('crops.watch')}</Badge>
        </div>

        <div className="mt-4"><ProgressBar value={field.progress} tone="bg-emerald-600" /></div>
        <div className="mt-1.5 flex justify-between text-xs text-forest-600">
          <span>{t('crops.sown')}: {fmtDate(field.sowDate, lang)}</span>
          <span>{field.daysToHarvest} {t('common.daysLeft')}</span>
          <span>{t('crops.harvest')}: {fmtDate(field.harvestDate, lang)}</span>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <Info icon={Ruler} label={t('fld.area')} value={`${field.acres} ${t('common.acres')}`} />
          <Info icon={CalendarDays} label={t('crops.sowDate')} value={fmtDate(field.sowDate, lang, { day: 'numeric', month: 'short', year: 'numeric' })} />
          <Info icon={Mountain} label={t('profile.soil')} value={t(`opt.soil.${field.soil || 'red'}`)} />
          <Info icon={Droplets} label={t('fld.irrigation')} value={t(`opt.irr.${field.irrigation || 'rainfed'}`)} />
        </dl>

        <SectionTitle icon={Lightbulb}>{t('crops.tips')}</SectionTitle>
        <ul className="space-y-2">
          {field.cat.tips.map((tip, i) => (
            <li key={i} className="flex gap-2.5 rounded-xl bg-cream-100 p-3 text-forest-800">
              <CalendarCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" /> <span>{L(tip)}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2 mt-5">
          <Link to="/calendar?view=crop" className="btn-primary !min-h-[44px] text-sm"><CalendarDays size={16} /> {t('fld.openCalendar')}</Link>
          <Link to="/crop-doctor" className="btn-soft !min-h-[44px] text-sm"><ScanLine size={16} /> {t('fld.checkLeaf')}</Link>
          <button className="btn-ghost !min-h-[44px] text-sm" onClick={onEdit}><Pencil size={16} /> {t('common.edit')}</button>
          <button className="btn-ghost !min-h-[44px] text-sm !text-red-700 !border-red-200 hover:!bg-red-50 ml-auto" onClick={() => window.confirm(t('fld.removeConfirm')) && onRemove()}>
            <Trash2 size={16} /> {t('crops.remove')}
          </button>
        </div>
      </div>
    </section>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-emerald-50/60 p-3">
      <dt className="text-xs text-forest-600 flex items-center gap-1"><Icon size={13} /> {label}</dt>
      <dd className="font-semibold text-forest-900 mt-0.5">{value}</dd>
    </div>
  );
}

const BAR_COLORS = ['#059669', '#c98a2b', '#3d8fa8', '#a8452c', '#6b7d33', '#7c3aed'];

/** Combined Field Overview: totals across every field. */
function CombinedOverview({ views }) {
  const { t, L, lang, setActiveFieldId } = useApp();
  const total = views.reduce((s, v) => s + Number(v.acres || 0), 0);
  const byCrop = useMemo(() => {
    const m = {};
    views.forEach((v) => (m[v.cropId] = (m[v.cropId] || 0) + Number(v.acres || 0)));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [views]);
  const next = [...views].sort((a, b) => a.daysToHarvest - b.daysToHarvest)[0];
  const attention = views.filter((v) => v.health !== 'healthy');

  return (
    <section className="card p-5">
      <SectionTitle icon={Layers}>{t('fld.overview')}</SectionTitle>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat value={views.length} label={t('fld.fields')} />
        <Stat value={total.toFixed(1)} label={t('common.acres')} />
        <Stat value={byCrop.length} label={t('fld.crops')} />
      </div>

      <div className="mt-4">
        <div className="flex h-3 rounded-full overflow-hidden bg-cream-200" aria-hidden>
          {byCrop.map(([id, ac], i) => <div key={id} style={{ width: `${(ac / total) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />)}
        </div>
        <ul className="mt-2 space-y-1">
          {byCrop.map(([id, ac], i) => (
            <li key={id} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
              <span className="flex-1 text-forest-800">{L(cropCatalog[id]?.name || id).split(' (')[0]}</span>
              <span className="text-forest-600">{ac} {t('common.acres')}</span>
            </li>
          ))}
        </ul>
      </div>

      {next && (
        <button onClick={() => setActiveFieldId(next.id)} className="mt-4 w-full text-left rounded-xl bg-cream-100 p-3 hover:bg-emerald-50">
          <div className="text-xs text-forest-600 flex items-center gap-1"><Sprout size={13} /> {t('fld.nextHarvest')}</div>
          <div className="font-semibold text-forest-900">{fieldLabel(next, t, L)}</div>
          <div className="text-sm text-forest-700">{fmtDate(next.harvestDate, lang)} · {next.daysToHarvest} {t('common.daysLeft')}</div>
        </button>
      )}
      {attention.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <div className="text-sm font-semibold text-amber-900 flex items-center gap-1.5"><AlertTriangle size={15} /> {t('crops.watch')}</div>
          <ul className="mt-1 text-sm">
            {attention.map((v) => (
              <li key={v.id}><button className="text-amber-900 underline" onClick={() => setActiveFieldId(v.id)}>{fieldLabel(v, t, L)}</button></li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-xl bg-emerald-50/60 py-3">
      <div className="text-2xl font-semibold text-forest-900">{value}</div>
      <div className="text-xs text-forest-600">{label}</div>
    </div>
  );
}

function FieldModal({ open, field, onClose, onSave }) {
  const { t, L, profile } = useApp();
  const blank = { name: '', cropId: 'ragi', acres: '1', sowDate: todayISO(), soil: profile.soil, irrigation: profile.irrigation };
  const [f, setF] = useState(blank);
  useEffect(() => {
    if (open) setF(field ? { name: field.name || '', cropId: field.cropId, acres: String(field.acres), sowDate: field.sowDate, soil: field.soil || profile.soil, irrigation: field.irrigation || profile.irrigation } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, field]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={field ? t('fld.edit') : t('fld.add')}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={() => onSave({ ...f, name: f.name.trim(), acres: Math.max(0.1, Number(f.acres) || 1) })}>{t('common.save')}</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('fld.name')}>
          <input className="input" value={f.name} onChange={set('name')} placeholder={t('fld.namePh')} />
        </Field>
        <Field label={t('crops.selectCrop')}>
          <select className="input" value={f.cropId} onChange={set('cropId')}>
            {Object.values(cropCatalog).map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`${t('fld.area')} (${t('common.acres')})`}>
            <input className="input" type="number" min="0.1" step="0.1" inputMode="decimal" value={f.acres} onChange={set('acres')} />
          </Field>
          <Field label={t('crops.sowDate')}>
            <input className="input" type="date" value={f.sowDate} onChange={set('sowDate')} />
          </Field>
        </div>
        <Field label={t('profile.soil')}>
          <select className="input" value={f.soil} onChange={set('soil')}>
            {soilOptions.map((o) => <option key={o} value={o}>{t(`opt.soil.${o}`)}</option>)}
          </select>
        </Field>
        <Field label={t('fld.irrigation')}>
          <select className="input" value={f.irrigation} onChange={set('irrigation')}>
            {irrigationOptions.map((o) => <option key={o} value={o}>{t(`opt.irr.${o}`)}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
