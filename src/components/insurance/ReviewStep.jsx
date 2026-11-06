import { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ClipboardCopy, Copy, Download, ExternalLink, Phone, RefreshCw, Save, Share2, ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import useClaimHelpers from '../../hooks/useClaimHelpers';
import { LINKS } from '../../data/insurance';
import { makeRef } from '../../utils/claims';
import { copyText } from '../../utils/media';
import { ClaimClock, EligibilityCard } from './parts';

const GUIDE = [1, 2, 3, 4, 5, 6, 7];
const PRE_LEAVE = [1, 2, 3, 4, 5, 6];

export default function ReviewStep({ draft, setDraft, onSave, goTo }) {
  const { t, toast } = useApp();
  const { analyse, downloadPdf, sharePdf, canShareFiles } = useClaimHelpers();
  const { assessment, issues, fields } = analyse(draft);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [copied, setCopied] = useState(null);

  const errors = issues.filter((i) => i.severity === 'error');

  const copy = async (key, text) => {
    if (await copyText(text)) {
      setCopied(key);
      toast(t('ins.copied'));
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    }
  };

  const withRef = () => {
    if (draft.ref) return draft;
    const next = { ...draft, ref: makeRef() };
    setDraft(next);
    return next;
  };

  const pdf = async (share) => {
    setPdfBusy(true);
    const claim = withRef();
    const ok = share ? await sharePdf(claim) : await downloadPdf(claim);
    if (ok) setDraft((d) => ({ ...d, ref: claim.ref, pdfAt: Date.now() }));
    setPdfBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-4">
        <ClaimClock draft={draft} />
        <EligibilityCard assessment={assessment} insured={draft.insured} />
      </div>

      {/* Missing / inconsistent */}
      <section>
        <h3 className="font-semibold text-forest-900 mb-2 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" /> {t('ins.issues')}
        </h3>
        {issues.length === 0 ? (
          <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-emerald-800"><CheckCircle2 size={18} /> {t('ins.noIssues')}</p>
        ) : (
          <ul className="space-y-2">
            {issues.map((i, k) => (
              <li key={k} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white px-3 py-2">
                <span className={`text-xs font-semibold rounded-full px-2 py-0.5 shrink-0 ${i.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                  {t(`ins.sev.${i.severity}`)}
                </span>
                <span className="flex-1 text-sm text-forest-800">{t(`ins.v.${i.key}`, i.vars)}</span>
                <button className="text-sm font-medium text-emerald-700 hover:underline min-h-[40px] px-2 shrink-0" onClick={() => goTo(i.step)}>
                  {t('ins.fix')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Summary with copy buttons */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
          <div>
            <h3 className="font-semibold text-forest-900">{t('ins.sum.title')}</h3>
            <p className="text-sm text-forest-600">{t('ins.sum.help')}</p>
          </div>
          <button className="btn-ghost !min-h-[40px] text-sm" onClick={() => copy('__all', fields.map((f) => `${f.label}: ${f.value}`).join('\n'))}>
            <ClipboardCopy size={16} /> {t('ins.copyAll')}
          </button>
        </div>
        <dl className="rounded-2xl border border-black/[0.06] divide-y divide-black/[0.06] bg-white">
          {fields.map((f, idx) => {
            const missing = f.value === t('ins.notProvided');
            return (
              <div key={f.key} className="flex items-center gap-3 px-3 py-2.5">
                <span className="text-xs text-forest-500 w-5 shrink-0">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-forest-600">{f.label}</dt>
                  <dd className={`font-medium break-words ${missing ? 'text-amber-700 italic' : 'text-forest-900'}`}>{f.value}</dd>
                </div>
                {!missing && (
                  <button
                    onClick={() => copy(f.key, f.value)}
                    aria-label={`${t('ins.copy')}: ${f.label}`}
                    className={`h-10 shrink-0 rounded-full px-3 text-xs font-medium inline-flex items-center gap-1.5 ${copied === f.key ? 'bg-emerald-600 text-white' : 'bg-cream-100 text-forest-800 hover:bg-emerald-50'}`}
                  >
                    {copied === f.key ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copied === f.key ? t('ins.copied') : t('ins.copy')}</span>
                  </button>
                )}
              </div>
            );
          })}
        </dl>
      </section>

      {/* PDF */}
      <section className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" onClick={() => pdf(false)} disabled={pdfBusy}>
          {pdfBusy ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />} {pdfBusy ? t('ins.pdf.making') : t('ins.pdf.make')}
        </button>
        {canShareFiles && (
          <button className="btn-ghost" onClick={() => pdf(true)} disabled={pdfBusy}><Share2 size={18} /> {t('ins.pdf.share')}</button>
        )}
        <p className="text-xs text-forest-600/80 basis-full">{t('ins.pdf.notOfficial')}</p>
      </section>

      {/* Official channel */}
      <section className="rounded-3xl bg-forest-800 text-white p-5 md:p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2"><ShieldAlert size={20} className="text-brand-gold-light" /> {t('ins.off.title')}</h3>
        <p className="text-white/85 mt-1">{t('ins.off.cannot')}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <a href={LINKS.helplineTel} className="btn bg-white text-forest-900 hover:bg-cream-100"><Phone size={18} /> {t('ins.off.call')}</a>
          <a href={LINKS.portal} target="_blank" rel="noopener noreferrer" className="btn-primary"><ExternalLink size={18} /> {t('ins.off.portal')}</a>
        </div>
        <p className="text-sm text-white/75 mt-2">{t('ins.off.helpline')}: <b>{LINKS.helpline}</b> · pmfby.gov.in</p>
        <p className="text-sm text-white/75">{t('ins.off.other')}</p>

        <h4 className="font-semibold mt-5 mb-2">{t('ins.off.steps')}</h4>
        <ol className="space-y-2">
          {GUIDE.map((n) => (
            <li key={n} className="flex gap-3">
              <span className="h-7 w-7 rounded-full bg-brand-gold text-emerald-950 text-sm font-semibold grid place-items-center shrink-0">{n}</span>
              <span className="text-white/90 pt-0.5">{t(`ins.g.${n}`)}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Before leaving */}
      <section className="rounded-2xl border border-black/[0.06] bg-white p-4">
        <h3 className="font-semibold text-forest-900 mb-2">{t('ins.off.checklist')}</h3>
        <ul className="space-y-1">
          {PRE_LEAVE.map((n) => (
            <li key={n}>
              <label className="flex items-start gap-3 min-h-[44px] py-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 mt-0.5 accent-emerald-600"
                  checked={!!draft.preLeave?.[n]}
                  onChange={(e) => setDraft((d) => ({ ...d, preLeave: { ...d.preLeave, [n]: e.target.checked } }))}
                />
                <span className="text-forest-800">{t(`ins.p.${n}`)}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" onClick={() => onSave(withRef())}>
          <Save size={18} /> {draft.id ? t('ins.updateClaim') : t('ins.saveClaim')}
        </button>
        {errors.length > 0 && <span className="text-sm text-amber-700">{t('ins.r.missing', { n: errors.length })}</span>}
      </div>
    </div>
  );
}
