import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, HelpCircle, Info, ShieldAlert, ShieldCheck, ShieldQuestion, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { categoryLabelKey, deadlineInfo, resolveVars, splitHM } from '../../utils/claims';
import useClaimHelpers from '../../hooks/useClaimHelpers';

/** Big, touch-friendly single-choice buttons (radio group). */
export function Choice({ label, value, onChange, options, name }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              type="button"
              key={o.value}
              role="radio"
              aria-checked={on}
              name={name}
              onClick={() => onChange(on ? '' : o.value)}
              className={`chip ${on ? 'chip-on' : 'chip-off'}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export const yesNoUnknown = (t) => [
  { value: 'yes', label: t('ins.opt.yes') },
  { value: 'no', label: t('ins.opt.no') },
  { value: 'unknown', label: t('ins.opt.unknown') },
];

/** Re-render every 30 s so countdowns stay current. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** ClaimClock: 72-hour countdown – shown only where the PMFBY 72-hour rule applies. */
export function ClaimClock({ draft, compact = false }) {
  const { t } = useApp();
  const { fmtDateTime } = useClaimHelpers();
  const now = useNow();
  const dl = deadlineInfo(draft, now);

  const box = (tone, Icon, children) => (
    <section className={`rounded-2xl border p-4 ${tone}`} aria-live="polite">
      <div className="flex items-center gap-2 font-semibold text-forest-900 mb-1.5">
        <Icon size={18} /> {t('ins.clock.title')}
      </div>
      {children}
    </section>
  );

  if (dl.state === 'noDate') return box('bg-cream-100 border-black/[0.06]', Clock, <p className="text-sm text-forest-700">{t('ins.clock.needDate')}</p>);
  if (dl.state === 'future') return box('bg-clay-100 border-clay-500/30', AlertTriangle, <p className="text-sm text-clay-600">{t('ins.clock.future')}</p>);

  const elapsed = splitHM(dl.elapsedMs);
  if (dl.applies === 'no') {
    return box(
      'bg-cream-100 border-black/[0.06]',
      Info,
      <>
        <p className="text-sm text-forest-700">{t('ins.clock.elapsed', elapsed)}</p>
        <p className="text-sm text-forest-700 mt-1">{dl.cat === 'areaBased' ? t('ins.clock.naArea') : t('ins.clock.naOther')}</p>
      </>
    );
  }

  const left = splitHM(dl.leftMs);
  const pct = Math.min(100, (dl.elapsedMs / (72 * 3600 * 1000)) * 100);
  const tone =
    dl.state === 'expired' ? 'bg-red-50 border-red-300' : dl.state === 'soon' ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-200';
  const bar = dl.state === 'expired' ? 'bg-red-500' : dl.state === 'soon' ? 'bg-amber-500' : 'bg-emerald-500';

  return box(
    tone,
    Clock,
    <>
      {dl.state === 'expired' ? (
        <p className="text-lg font-semibold text-red-700">{t('ins.clock.expired')}</p>
      ) : (
        <p className={`text-2xl font-semibold ${dl.state === 'soon' ? 'text-amber-700' : 'text-emerald-700'}`}>{t('ins.clock.left', left)}</p>
      )}
      <div className="h-2 rounded-full bg-white mt-2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-forest-700 mt-1.5">
        <span>{t('ins.clock.elapsed', elapsed)}</span>
        <span>{t('ins.clock.deadlineAt', { time: fmtDateTime(dl.deadline) })}</span>
      </div>
      {!compact && (
        <div className="text-sm mt-2 space-y-1">
          {dl.applies === 'maybe' && <p className="text-amber-800">{t('ins.clock.maybe')}</p>}
          {dl.state === 'expired' ? (
            <p className="text-red-800">{t('ins.clock.expiredDo')}</p>
          ) : dl.state === 'soon' ? (
            <p className="text-amber-800 font-medium">{t('ins.clock.soon')}</p>
          ) : (
            <p className="text-emerald-800">{t('ins.clock.ok')}</p>
          )}
          <p className="text-xs text-forest-600/80">{t('ins.clock.rule')}</p>
          {(draft.timeUnknown || !draft.incidentTime) && <p className="text-xs text-forest-600/80">{t('ins.timeAssumed')}</p>}
        </div>
      )}
    </>
  );
}

const RESULT = {
  eligible: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', Icon: ShieldCheck },
  moreInfo: { cls: 'bg-amber-50 border-amber-300 text-amber-800', Icon: ShieldQuestion },
  notCovered: { cls: 'bg-red-50 border-red-300 text-red-800', Icon: ShieldAlert },
};

export function ResultBadge({ result }) {
  const { t } = useApp();
  const r = RESULT[result];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${r.cls}`}>
      <r.Icon size={14} /> {t(`ins.el.${result}`)}
    </span>
  );
}

/** Preliminary eligibility card with reasons and next steps. */
export function EligibilityCard({ assessment, insured }) {
  const { t } = useApp();
  const r = RESULT[assessment.result];
  const toneIcon = { good: CheckCircle2, info: HelpCircle, bad: XCircle };
  const toneColor = { good: 'text-emerald-600', info: 'text-amber-600', bad: 'text-red-600' };
  return (
    <section className={`rounded-2xl border p-4 md:p-5 ${r.cls.split(' ').slice(0, 2).join(' ')}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-forest-900">{t('ins.el.title')}</h3>
        <span className="text-xs text-forest-600">{t(categoryLabelKey(assessment.cat))}</span>
      </div>
      <div className={`mt-2 flex items-center gap-2 text-xl font-semibold ${r.cls.split(' ').pop()}`}>
        <r.Icon size={26} /> {t(`ins.el.${assessment.result}`)}
      </div>

      {assessment.reasons.length > 0 && (
        <>
          <h4 className="text-sm font-semibold text-forest-800 mt-3 mb-1">{t('ins.el.why')}</h4>
          <ul className="space-y-1.5">
            {assessment.reasons.map((x, i) => {
              const I = toneIcon[x.tone];
              return (
                <li key={i} className="flex gap-2 text-sm text-forest-800">
                  <I size={16} className={`shrink-0 mt-0.5 ${toneColor[x.tone]}`} />
                  <span>{t(`ins.r.${x.key}`, resolveVars(x.vars, t))}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {assessment.next.length > 0 && (
        <>
          <h4 className="text-sm font-semibold text-forest-800 mt-3 mb-1">{t('ins.el.next')}</h4>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-forest-800">
            {assessment.next.map((n) => <li key={n}>{t(`ins.n.${n}`)}</li>)}
          </ol>
        </>
      )}

      {insured === 'no' && (
        <div className="mt-4 rounded-xl bg-white border border-black/[0.06] p-3">
          <h4 className="font-semibold text-forest-900">{t('ins.relief.title')}</h4>
          <p className="text-sm text-forest-700 mt-1">{t('ins.relief.body')}</p>
          <p className="text-sm text-forest-700 mt-1">{t('ins.relief.how')}</p>
          <p className="text-xs text-earth-700 mt-1">{t('ins.info.depends')}</p>
        </div>
      )}

      <p className="text-xs text-forest-600/80 mt-3">{t('ins.el.disclaimer')}</p>
    </section>
  );
}
