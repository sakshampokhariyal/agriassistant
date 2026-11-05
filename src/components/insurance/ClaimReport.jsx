import { APP_NAME } from '../../config/brand';
import { CHECKLIST } from '../../data/insurance';
import { categoryLabelKey, resolveVars, splitHM } from '../../utils/claims';

/**
 * Printable evidence package. Rendered off-screen and rasterised block-by-block
 * (every [data-pdf-block] becomes an image in the PDF) so Indic scripts render correctly.
 * Receives everything via props because it is mounted in a separate React root.
 */
export default function ClaimReport({ claim, t, fields, assessment, issues, fmtDateTime }) {
  const dl = assessment.deadline;
  const resultColor = { eligible: '#047857', moreInfo: '#b45309', notCovered: '#b91c1c' }[assessment.result];

  const Section = ({ title, children }) => (
    <div data-pdf-block style={{ padding: '14px 0', borderBottom: '1px solid #e5e7eb' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0a2e1a', margin: '0 0 8px' }}>{title}</h2>
      {children}
    </div>
  );

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', gap: 12, fontSize: 13, padding: '3px 0' }}>
      <div style={{ width: 210, color: '#4b5563', flexShrink: 0 }}>{label}</div>
      <div style={{ color: '#111827', fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );

  const pick = (keys) => fields.filter((f) => keys.includes(f.key));

  // Photos two per row
  const rows = [];
  for (let i = 0; i < claim.photos.length; i += 2) rows.push(claim.photos.slice(i, i + 2));

  return (
    <div style={{ width: 794, padding: '28px 36px', background: '#fff', fontFamily: 'Inter, "Noto Sans Devanagari", "Noto Sans Kannada", sans-serif', color: '#111827' }}>
      <div data-pdf-block style={{ paddingBottom: 12, borderBottom: '3px solid #059669' }}>
        <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, letterSpacing: 1 }}>{APP_NAME.toUpperCase()}</div>
        <h1 style={{ fontSize: 24, margin: '4px 0', color: '#0a2e1a' }}>{t('ins.pdf.title')}</h1>
        <div style={{ fontSize: 12, color: '#4b5563' }}>
          {t('ins.pdf.ref', { ref: claim.ref })} · {t('ins.pdf.generated', { time: fmtDateTime(new Date()) })}
        </div>
        <div style={{ marginTop: 10, padding: '8px 10px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, fontSize: 12, color: '#78350f', fontWeight: 600 }}>
          {t('ins.pdf.notOfficial')}
        </div>
      </div>

      <Section title={t('ins.pdf.farmer')}>
        {pick(['name', 'mobile', 'village', 'district', 'state', 'survey']).map((f) => <Row key={f.key} {...f} />)}
      </Section>

      <Section title={t('ins.pdf.incident')}>
        {pick(['crop', 'damage', 'when', 'cropState', 'affectedArea', 'extent', 'description']).map((f) => <Row key={f.key} {...f} />)}
      </Section>

      <Section title={t('ins.pdf.insurance')}>
        <Row label={t('ins.f.insured')} value={claim.insured ? t(`ins.opt.${claim.insured}`) : t('ins.notProvided')} />
        {pick(['policy', 'insurer', 'season', 'insuredArea']).map((f) => <Row key={f.key} {...f} />)}
        <Row label={t('ins.f.premiumProof')} value={claim.premiumProof ? t(`ins.opt.${claim.premiumProof}`) : t('ins.notProvided')} />
        <Row label={t('ins.f.notified')} value={claim.notified ? t(`ins.opt.${claim.notified}`) : t('ins.notProvided')} />
        <Row label={t('ins.pdf.officialRef')} value={claim.officialRef || t('ins.my.noRef')} />
        <Row label={t('ins.pdf.statusNote')} value={t(`ins.st.${claim.status}`)} />
      </Section>

      <Section title={t('ins.el.title')}>
        <div style={{ fontSize: 15, fontWeight: 700, color: resultColor }}>{t(`ins.el.${assessment.result}`)}</div>
        <div style={{ fontSize: 12, color: '#4b5563', margin: '2px 0 6px' }}>{t(categoryLabelKey(assessment.cat))}</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
          {assessment.reasons.map((r, i) => <li key={i}>{t(`ins.r.${r.key}`, resolveVars(r.vars, t))}</li>)}
        </ul>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>{t('ins.el.disclaimer')}</div>
      </Section>

      <Section title={t('ins.clock.title')}>
        {dl.state === 'noDate' ? (
          <div style={{ fontSize: 13 }}>{t('ins.clock.needDate')}</div>
        ) : dl.applies === 'no' ? (
          <div style={{ fontSize: 13 }}>{assessment.cat === 'areaBased' ? t('ins.clock.naArea') : t('ins.clock.naOther')}</div>
        ) : (
          <div style={{ fontSize: 13 }}>
            <div>{t('ins.clock.rule')}</div>
            {dl.deadline && <div style={{ fontWeight: 700, marginTop: 4 }}>{t('ins.clock.deadlineAt', { time: fmtDateTime(dl.deadline) })}</div>}
            {dl.state === 'expired' ? (
              <div style={{ color: '#b91c1c', fontWeight: 700 }}>{t('ins.clock.expired')}</div>
            ) : dl.leftMs != null ? (
              <div>{t('ins.clock.left', splitHM(dl.leftMs))}</div>
            ) : null}
            {dl.applies === 'maybe' && <div style={{ color: '#b45309' }}>{t('ins.clock.maybe')}</div>}
          </div>
        )}
      </Section>

      <Section title={t('ins.pdf.missing')}>
        {issues.length === 0 ? (
          <div style={{ fontSize: 13 }}>{t('ins.noIssues')}</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {issues.map((i, k) => (
              <li key={k}>
                <b style={{ color: i.severity === 'error' ? '#b91c1c' : '#b45309' }}>{t(`ins.sev.${i.severity}`)}:</b> {t(`ins.v.${i.key}`, i.vars)}
              </li>
            ))}
          </ul>
        )}
        <div style={{ fontSize: 12, marginTop: 8 }}>
          <b>{t('ins.ev.checklist')}:</b>{' '}
          {CHECKLIST.map((c) => `${claim.photos.some((p) => p.tag === c) ? '☑' : '☐'} ${t(`ins.ev.c.${c}`)}`).join('   ')}
        </div>
      </Section>

      <div data-pdf-block style={{ paddingTop: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0a2e1a', margin: 0 }}>
          {t('ins.pdf.photos')} ({claim.photos.length})
        </h2>
        {claim.photos.length === 0 && <div style={{ fontSize: 13, marginTop: 6 }}>{t('ins.ev.empty')}</div>}
      </div>
      {rows.map((row, i) => (
        <div key={i} data-pdf-block style={{ display: 'flex', gap: 14, padding: '10px 0' }}>
          {row.map((p, j) => (
            <div key={p.id} style={{ width: 354, border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
              <img src={p.data} alt="" style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                #{i * 2 + j + 1} · {p.tag ? t(`ins.ev.c.${p.tag}`) : '—'}
              </div>
              {p.caption && <div style={{ fontSize: 12 }}>{p.caption}</div>}
              <div style={{ fontSize: 10.5, color: '#4b5563', marginTop: 4 }}>
                <b>{t('ins.pdf.meta')}:</b>{' '}
                {p.fileTime ? t('ins.ev.fileTime', { time: fmtDateTime(new Date(p.fileTime)) }) : t('ins.ev.noFileTime')}
                {p.gps && (
                  <>
                    {' · '}
                    {t('ins.ev.gps', { lat: p.gps.lat.toFixed(5), lon: p.gps.lon.toFixed(5), acc: Math.round(p.gps.acc), time: fmtDateTime(new Date(p.gps.at)) })}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div data-pdf-block style={{ paddingTop: 14, fontSize: 12, color: '#374151' }}>
        <b>{t('ins.off.title')}:</b> {t('ins.off.helpline')} 14447 · https://pmfby.gov.in/
      </div>
    </div>
  );
}
