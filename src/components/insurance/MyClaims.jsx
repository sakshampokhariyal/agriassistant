import { useState } from 'react';
import { Calendar, Download, ExternalLink, FileText, Images, MapPin, Pencil, RefreshCw, Share2, Sprout, Trash2, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import useClaimHelpers from '../../hooks/useClaimHelpers';
import { CLAIM_STATUSES, LINKS } from '../../data/insurance';
import { incidentAt, splitHM } from '../../utils/claims';
import { EmptyState } from '../ui';
import { ResultBadge, useNow } from './parts';

export default function MyClaims({ claims, updateClaim, deleteClaim, openClaim, onReport }) {
  const { t } = useApp();
  if (!claims.length) {
    return (
      <div className="card">
        <EmptyState icon={FileText} text={t('ins.my.empty')} action={<button className="btn-primary" onClick={onReport}>{t('ins.tab.report')}</button>} />
      </div>
    );
  }
  const sorted = [...claims].sort((a, b) => (b.incidentDate || '').localeCompare(a.incidentDate || '') || b.createdAt - a.createdAt);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-3">
        <p className="text-sm text-amber-900">{t('ins.my.statusNote')}</p>
        <a href={LINKS.portal} target="_blank" rel="noopener noreferrer" className="btn-ghost !min-h-[40px] text-sm bg-white">
          <ExternalLink size={16} /> {t('ins.my.checkOfficial')}
        </a>
      </div>
      <ul className="grid lg:grid-cols-2 gap-4">
        {sorted.map((c) => (
          <ClaimCard key={c.id} claim={c} updateClaim={updateClaim} deleteClaim={deleteClaim} openClaim={openClaim} />
        ))}
      </ul>
    </div>
  );
}

function ClaimCard({ claim, updateClaim, deleteClaim, openClaim }) {
  const { t, toast } = useApp();
  const { analyse, cropName, fmtDateTime, downloadPdf, sharePdf, canShareFiles } = useClaimHelpers();
  const now = useNow();
  const { assessment } = analyse(claim, now);
  const dl = assessment.deadline;
  const at = incidentAt(claim);
  const [busy, setBusy] = useState(false);

  const pdf = async (share) => {
    setBusy(true);
    const ok = share ? await sharePdf(claim) : await downloadPdf(claim);
    if (ok) updateClaim(claim.id, { pdfAt: Date.now() }, true);
    setBusy(false);
  };

  const deadlineText =
    dl.applies === 'no' || dl.state === 'noDate'
      ? t('ins.my.noDeadline')
      : dl.state === 'expired'
      ? t('ins.clock.expired')
      : t('ins.clock.left', splitHM(dl.leftMs));
  const deadlineTone = dl.applies === 'no' ? 'text-forest-600' : dl.state === 'expired' ? 'text-red-700' : dl.state === 'soon' ? 'text-amber-700' : 'text-emerald-700';

  return (
    <li className="card p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {claim.photos[0] ? (
          <img src={claim.photos[0].data} alt="" className="h-16 w-16 rounded-xl object-cover shrink-0" />
        ) : (
          <span className="h-16 w-16 rounded-xl bg-cream-100 grid place-items-center shrink-0"><Sprout className="text-forest-400" /></span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-forest-900">
              {claim.damageType ? t(`ins.dmg.${claim.damageType}`) : '—'} · {claim.cropId === 'other' ? claim.cropOther : cropName(claim.cropId)}
            </h3>
          </div>
          <div className="mt-1"><ResultBadge result={assessment.result} /></div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5 text-forest-700"><Calendar size={14} className="text-forest-500" /> {at ? fmtDateTime(at) : '—'}</div>
        <div className="flex items-center gap-1.5 text-forest-700 min-w-0"><MapPin size={14} className="text-forest-500 shrink-0" /> <span className="truncate">{claim.village}, {claim.district}</span></div>
        <div className={`flex items-center gap-1.5 ${deadlineTone}`}><Clock size={14} /> {deadlineText}</div>
        <div className="flex items-center gap-1.5 text-forest-700"><Images size={14} className="text-forest-500" /> {claim.photos.length}</div>
        <div className="col-span-2 text-xs text-forest-600">
          {t('ins.my.appRef')}: <b>{claim.ref}</b> · {t('ins.my.updated', { time: fmtDateTime(new Date(claim.updatedAt)) })}
        </div>
      </dl>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="label">{t('ins.my.status')}</span>
          <select className="input" value={claim.status} onChange={(e) => { updateClaim(claim.id, { status: e.target.value, statusUpdatedAt: Date.now() }); toast(t('ins.my.saved')); }}>
            {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{t(`ins.st.${s}`)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">{t('ins.my.officialRef')}</span>
          <input
            className="input"
            defaultValue={claim.officialRef}
            placeholder={t('ins.my.refPlaceholder')}
            onChange={(e) => updateClaim(claim.id, { officialRef: e.target.value.trim() })}
            onBlur={(e) => e.target.value.trim() && toast(t('ins.my.saved'))}
          />
        </label>
      </div>
      <label className="block">
        <span className="label">{t('ins.my.notes')}</span>
        <textarea
          className="input !py-2 min-h-[64px]"
          defaultValue={claim.notes}
          onChange={(e) => updateClaim(claim.id, { notes: e.target.value })}
          onBlur={(e) => e.target.value && toast(t('ins.my.saved'))}
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button className="btn-primary !min-h-[44px] text-sm" onClick={() => openClaim(claim.id)}><Pencil size={16} /> {t('ins.my.open')}</button>
        <button className="btn-ghost !min-h-[44px] text-sm" onClick={() => pdf(false)} disabled={busy}>
          {busy ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />} PDF
        </button>
        {canShareFiles && (
          <button className="btn-ghost !min-h-[44px] text-sm" onClick={() => pdf(true)} disabled={busy}><Share2 size={16} /> {t('ins.pdf.share')}</button>
        )}
        <button
          className="btn-ghost !min-h-[44px] text-sm !text-red-700 !border-red-200 hover:!bg-red-50 ml-auto"
          onClick={() => window.confirm(t('ins.my.deleteConfirm')) && deleteClaim(claim.id)}
        >
          <Trash2 size={16} /> {t('ins.my.delete')}
        </button>
      </div>
    </li>
  );
}
