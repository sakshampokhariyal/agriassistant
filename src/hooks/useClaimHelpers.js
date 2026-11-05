import { FILE_PREFIX } from '../config/brand';
import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { cropCatalog } from '../data/farmer';
import { localeOf } from '../translations';
import { assessEligibility, summaryFields, validate } from '../utils/claims';
import { downloadBlob } from '../utils/media';

/** Shared formatting + PDF helpers for the Crop Loss / Insurance screens. */
export default function useClaimHelpers() {
  const { t, L, lang, profile, auth, toast } = useApp();

  const cropName = useCallback(
    (id) => (id === 'other' ? t('ins.otherCrop') : cropCatalog[id] ? L(cropCatalog[id].name).split(' (')[0] : id || ''),
    [t, L]
  );

  const fmtDateTime = useCallback(
    (date) => new Intl.DateTimeFormat(localeOf(lang), { dateStyle: 'medium', timeStyle: 'short' }).format(date),
    [lang]
  );

  const analyse = useCallback(
    (claim, now = new Date()) => ({
      assessment: assessEligibility(claim, profile, cropName, now),
      issues: validate(claim, profile, now),
      fields: summaryFields(claim, { t, profile, auth, cropName, fmtDateTime }),
    }),
    [profile, auth, cropName, fmtDateTime, t]
  );

  /** Build the PDF; returns { blob, filename }. */
  const buildPdf = useCallback(
    async (claim) => {
      const { generateClaimPdf } = await import('../utils/claimPdf.jsx');
      const { assessment, issues, fields } = analyse(claim);
      const blob = await generateClaimPdf({ claim, t, fields, assessment, issues, fmtDateTime });
      return { blob, filename: `${FILE_PREFIX}-evidence-${claim.ref || 'draft'}.pdf` };
    },
    [analyse, t, fmtDateTime]
  );

  const downloadPdf = useCallback(
    async (claim) => {
      try {
        const { blob, filename } = await buildPdf(claim);
        downloadBlob(blob, filename);
        toast(t('ins.pdf.done'));
        return true;
      } catch (e) {
        console.error(e);
        toast(t('ins.pdf.error'), 'error');
        return false;
      }
    },
    [buildPdf, toast, t]
  );

  const canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare;

  const sharePdf = useCallback(
    async (claim) => {
      try {
        const { blob, filename } = await buildPdf(claim);
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: t('ins.pdf.title') });
        } else {
          downloadBlob(blob, filename);
          toast(t('ins.pdf.done'));
        }
        return true;
      } catch (e) {
        if (e?.name === 'AbortError') return false; // user closed the share sheet
        console.error(e);
        toast(t('ins.pdf.error'), 'error');
        return false;
      }
    },
    [buildPdf, toast, t]
  );

  return { cropName, fmtDateTime, analyse, downloadPdf, sharePdf, canShareFiles };
}
