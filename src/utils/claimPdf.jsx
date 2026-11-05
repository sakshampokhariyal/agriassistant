import { APP_NAME } from '../config/brand';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import ClaimReport from '../components/insurance/ClaimReport';

/**
 * Build the evidence-package PDF for a claim.
 * The report is rendered off-screen, then each [data-pdf-block] is rasterised
 * with html2canvas and placed on A4 pages with jsPDF (blocks never split mid-text).
 * Libraries are loaded lazily so they don't weigh down the rest of the app.
 */
export async function generateClaimPdf(reportProps) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;';
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    flushSync(() => root.render(<ClaimReport {...reportProps} />));
    await document.fonts?.ready;
    await Promise.all(
      [...host.querySelectorAll('img')].map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {})))
    );

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 28;
    const footer = 22;
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2 - footer;
    let y = margin;

    for (const block of host.querySelectorAll('[data-pdf-block]')) {
      const canvas = await html2canvas(block, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
      let w = usableW;
      let h = (canvas.height * usableW) / canvas.width;
      if (h > usableH) {
        // A single block taller than a page is scaled down to fit.
        w = (w * usableH) / h;
        h = usableH;
      }
      if (y + h > margin + usableH && y > margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.86), 'JPEG', margin, y, w, h);
      y += h + 4;
    }

    const pages = pdf.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(110);
      pdf.text(
        `${APP_NAME} - supporting evidence package, NOT an official PMFBY claim form or proof of submission.   Page ${i}/${pages}`,
        margin,
        pageH - 14
      );
    }
    return pdf.output('blob');
  } finally {
    root.unmount();
    host.remove();
  }
}
