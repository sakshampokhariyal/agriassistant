import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarClock, Check, FilePlus2, Info, Sparkles, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import useCropViews from '../../hooks/useCropViews';
import useClaimHelpers from '../../hooks/useClaimHelpers';
import { DAMAGE_TYPES } from '../../data/insurance';
import { incidentAt, splitHM, suggestDescription } from '../../utils/claims';
import { todayISO } from '../../utils/date';
import { Field } from '../ui';
import { ClaimClock, Choice, yesNoUnknown } from './parts';
import EvidenceStep from './EvidenceStep';
import ReviewStep from './ReviewStep';

const STEPS = ['when', 'incident', 'insurance', 'evidence', 'review'];

export default function ReportLoss({ draft, setDraft, onSave, onNew, editingRef, initialStep = 0 }) {
  const { t } = useApp();
  const [step, setStep] = useState(initialStep);
  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v?.target ? (v.target.type === 'checkbox' ? v.target.checked : v.target.value) : v }));

  const go = (i) => {
    setStep(i);
    requestAnimationFrame(() => document.getElementById('report-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div id="report-top" className="scroll-mt-24">
      {/* Stepper */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-forest-600">
          {t('ins.stepOf', { n: step + 1, total: STEPS.length })} · <b className="text-forest-900">{t(`ins.step.${STEPS[step]}`)}</b>
        </p>
        <button className="btn-ghost !min-h-[40px] text-sm" onClick={onNew}>
          <FilePlus2 size={16} /> {t('ins.startNew')}
        </button>
      </div>
      {editingRef && <p className="mb-3 text-xs text-emerald-700 font-medium">{t('ins.editing', { ref: editingRef })}</p>}
      <ol className="grid grid-cols-5 gap-1.5 mb-6" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              onClick={() => go(i)}
              aria-current={i === step ? 'step' : undefined}
              aria-label={`${i + 1}. ${t(`ins.step.${s}`)}`}
              className="w-full text-left group"
            >
              <span className={`block h-1.5 rounded-full ${i < step ? 'bg-emerald-500' : i === step ? 'bg-emerald-600' : 'bg-cream-300'}`} />
              <span className={`hidden sm:flex items-center gap-1 mt-1.5 text-xs ${i === step ? 'text-forest-900 font-semibold' : 'text-forest-600/80'}`}>
                {i < step && <Check size={12} className="text-emerald-600" />} {t(`ins.step.${s}`)}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="card p-4 md:p-6">
        {step === 0 && <StepWhen draft={draft} set={set} />}
        {step === 1 && <StepIncident draft={draft} set={set} setDraft={setDraft} />}
        {step === 2 && <StepInsurance draft={draft} set={set} />}
        {step === 3 && <EvidenceStep draft={draft} setDraft={setDraft} />}
        {step === 4 && <ReviewStep draft={draft} setDraft={setDraft} onSave={onSave} goTo={go} />}
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <button className="btn-ghost" onClick={() => go(step - 1)} disabled={step === 0}>
          <ArrowLeft size={18} /> {t('ins.prev')}
        </button>
        <span className="text-xs text-forest-600/80 hidden sm:block">{t('ins.draftSaved')}</span>
        {step < STEPS.length - 1 && (
          <button className="btn-primary" onClick={() => go(step + 1)}>
            {t('ins.next')} <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function StepWhen({ draft, set }) {
  const { t } = useApp();
  const at = incidentAt(draft);
  const elapsed = at && at <= new Date() ? splitHM(new Date() - at) : null;
  return (
    <div className="space-y-5">
      <p className="flex gap-2 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
        <CalendarClock size={18} className="shrink-0 mt-0.5" /> {t('ins.when.help')}
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('ins.f.date')}>
          <input type="date" className="input" value={draft.incidentDate} max={todayISO()} onChange={set('incidentDate')} required />
        </Field>
        <Field label={t('ins.f.time')}>
          <input type="time" className="input" value={draft.incidentTime} onChange={set('incidentTime')} disabled={draft.timeUnknown} />
        </Field>
      </div>
      <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
        <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={draft.timeUnknown} onChange={set('timeUnknown')} />
        <span>{t('ins.f.timeUnknown')}</span>
      </label>
      {draft.timeUnknown && <p className="text-sm text-forest-600">{t('ins.timeAssumed')}</p>}
      {elapsed && <p className="text-forest-800 font-medium">{t('ins.clock.elapsed', elapsed)}</p>}
      {at && at > new Date() && <p className="text-clay-600 text-sm">{t('ins.clock.future')}</p>}
    </div>
  );
}

function StepIncident({ draft, set, setDraft }) {
  const { t, profile } = useApp();
  const crops = useCropViews();
  const { cropName, fmtDateTime } = useClaimHelpers();
  const cropOptions = useMemo(() => [...new Set(crops.map((c) => c.cropId))], [crops]);

  const pickCrop = (id) =>
    setDraft((d) => {
      const c = crops.find((x) => x.cropId === id);
      return { ...d, cropId: id, area: d.area || (c ? String(c.acres) : '') };
    });

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="label">{t('ins.f.damageType')}</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" role="radiogroup">
          {DAMAGE_TYPES.map((d) => {
            const on = draft.damageType === d;
            return (
              <button
                type="button"
                key={d}
                role="radio"
                aria-checked={on}
                onClick={() => set('damageType')(d)}
                className={`rounded-2xl border min-h-[52px] px-3 text-sm font-medium text-left ${on ? 'bg-forest-700 text-white border-forest-700' : 'bg-white border-forest-200 text-forest-800 hover:bg-forest-50'}`}
              >
                {t(`ins.dmg.${d}`)}
              </button>
            );
          })}
        </div>
      </fieldset>
      {draft.damageType === 'other' && (
        <Field label={t('ins.f.otherDamage')}>
          <input className="input" value={draft.otherDamage} onChange={set('otherDamage')} />
        </Field>
      )}

      <Choice
        label={t('ins.f.cropState')}
        value={draft.cropState}
        onChange={set('cropState')}
        options={[
          { value: 'standing', label: t('ins.state.standing') },
          { value: 'harvested', label: t('ins.state.harvested') },
        ]}
      />
      {draft.cropState === 'harvested' && (
        <div className="grid sm:grid-cols-2 gap-4 rounded-2xl bg-cream-100 p-4">
          <Field label={t('ins.f.harvestDate')}>
            <input type="date" className="input !bg-white" value={draft.harvestDate} max={draft.incidentDate || todayISO()} onChange={set('harvestDate')} />
          </Field>
          <Choice label={t('ins.f.cutSpread')} value={draft.cutSpread} onChange={set('cutSpread')} options={yesNoUnknown(t)} />
        </div>
      )}
      {draft.cropState === 'standing' && ['heavyRain', 'flood'].includes(draft.damageType) && (
        <Choice label={t('ins.f.submerged')} value={draft.submerged} onChange={set('submerged')} options={yesNoUnknown(t)} />
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('ins.f.crop')}>
          <select className="input" value={draft.cropId} onChange={(e) => pickCrop(e.target.value)}>
            <option value="">—</option>
            {cropOptions.map((id) => <option key={id} value={id}>{cropName(id)}</option>)}
            <option value="other">{t('ins.otherCrop')}</option>
          </select>
        </Field>
        {draft.cropId === 'other' && (
          <Field label={t('ins.f.cropOther')}>
            <input className="input" value={draft.cropOther} onChange={set('cropOther')} />
          </Field>
        )}
        <Field label={t('ins.f.area')}>
          <input className="input" type="number" inputMode="decimal" min="0" step="0.1" value={draft.area} onChange={set('area')} />
        </Field>
        <Field label={`${t('ins.f.extent')}${draft.extent ? `: ${draft.extent}%` : ''}`}>
          <div className="flex items-center gap-3">
            <input type="range" min="1" max="100" step="1" value={draft.extent || 1} onChange={set('extent')} className="flex-1 accent-emerald-600" aria-label={t('ins.f.extent')} />
            <input className="input !w-24" type="number" inputMode="numeric" min="1" max="100" value={draft.extent} onChange={set('extent')} aria-label={t('ins.f.extent')} />
          </div>
        </Field>
      </div>

      <fieldset className="rounded-2xl border border-black/[0.06] p-4">
        <legend className="px-1 font-semibold text-forest-900">{t('ins.f.location')}</legend>
        <p className="text-xs text-emerald-700 flex items-center gap-1 mb-3"><UserRound size={13} /> {t('ins.prefilled')}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('profile.village')}><input className="input" value={draft.village} onChange={set('village')} /></Field>
          <Field label={t('profile.district')}><input className="input" value={draft.district} onChange={set('district')} /></Field>
          <Field label={t('profile.state')}><input className="input" value={draft.state} onChange={set('state')} /></Field>
          <Field label={t('ins.f.survey')}><input className="input" value={draft.surveyNo} onChange={set('surveyNo')} /></Field>
        </div>
        {profile.landSize ? <p className="text-xs text-forest-600/80 mt-2">{t('profile.land')}: {profile.landSize}</p> : null}
      </fieldset>

      <Field label={t('ins.f.description')}>
        <textarea className="input !py-3 min-h-[110px]" value={draft.description} onChange={set('description')} />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-2 -mt-3">
        <p className="text-xs text-forest-600/80">{t('ins.descHint')}</p>
        <button
          type="button"
          className="btn-soft !min-h-[40px] text-sm"
          onClick={() => set('description')(suggestDescription(draft, { t, cropName, fmtDateTime }))}
        >
          <Sparkles size={16} /> {t('ins.descSuggest')}
        </button>
      </div>

      {draft.damageType && draft.cropState && <ClaimClock draft={draft} />}
    </div>
  );
}

function StepInsurance({ draft, set }) {
  const { t } = useApp();
  const crops = useCropViews();
  const { cropName } = useClaimHelpers();
  const cropOptions = [...new Set(crops.map((c) => c.cropId))];
  const showDetails = draft.insured === 'yes' || draft.insured === 'unknown';
  return (
    <div className="space-y-6">
      <Choice
        label={t('ins.f.insured')}
        value={draft.insured}
        onChange={set('insured')}
        options={[
          { value: 'yes', label: t('ins.opt.yes') },
          { value: 'no', label: t('ins.opt.no') },
          { value: 'unknown', label: t('ins.opt.unsure') },
        ]}
      />
      {showDetails && (
        <>
          <p className="flex gap-2 text-sm text-forest-700 rounded-2xl bg-cream-100 p-3">
            <Info size={16} className="shrink-0 mt-0.5 text-forest-500" /> {t('ins.insHint')}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('ins.f.policyId')}><input className="input" value={draft.policyId} onChange={set('policyId')} autoComplete="off" /></Field>
            <Field label={t('ins.f.insurer')}><input className="input" value={draft.insurer} onChange={set('insurer')} /></Field>
            <Field label={t('ins.f.insuredCrop')}>
              <select className="input" value={draft.insuredCrop} onChange={set('insuredCrop')}>
                <option value="">—</option>
                {cropOptions.map((id) => <option key={id} value={id}>{cropName(id)}</option>)}
                <option value="other">{t('ins.otherCrop')}</option>
                <option value="unknown">{t('ins.opt.unknown')}</option>
              </select>
            </Field>
            <Field label={t('ins.f.insuredArea')}>
              <input className="input" type="number" inputMode="decimal" min="0" step="0.1" value={draft.insuredArea} onChange={set('insuredArea')} />
            </Field>
            <Field label={t('ins.f.year')}>
              <input className="input" type="number" inputMode="numeric" min="2016" max="2100" value={draft.year} onChange={set('year')} />
            </Field>
          </div>
          <Choice
            label={t('ins.f.season')}
            value={draft.season}
            onChange={set('season')}
            options={['kharif', 'rabi', 'other'].map((s) => ({ value: s, label: t(`ins.season.${s}`) }))}
          />
          <Choice label={t('ins.f.premiumProof')} value={draft.premiumProof} onChange={set('premiumProof')} options={yesNoUnknown(t)} />
          <Choice label={t('ins.f.notified')} value={draft.notified} onChange={set('notified')} options={yesNoUnknown(t)} />
        </>
      )}
      <p className="text-xs text-forest-600/80">{t('ins.noBank')}</p>
    </div>
  );
}
