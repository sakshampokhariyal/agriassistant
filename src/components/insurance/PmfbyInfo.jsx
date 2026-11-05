import { ExternalLink, Info, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LINKS, pmfbyInfo } from '../../data/insurance';

export default function PmfbyInfo() {
  const { t, L } = useApp();
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        {pmfbyInfo.map((s) => (
          <section key={s.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-lg font-semibold text-forest-900">{L(s.title)}</h3>
              {s.depends && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-2.5 py-1">
                  <Info size={13} /> {t('ins.info.depends')}
                </span>
              )}
            </div>
            {s.body && <p className="text-forest-800">{L(s.body)}</p>}
            {s.points && (
              <ul className="space-y-2">
                {s.points.map((p, i) => (
                  <li key={i} className="flex gap-2.5 text-forest-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span>{L(p)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
        <section className="rounded-3xl bg-forest-800 text-white p-5">
          <h3 className="font-semibold text-lg">{t('ins.info.links')}</h3>
          <p className="text-white/80 text-sm mt-1">{t('ins.off.helpline')}</p>
          <a href={LINKS.helplineTel} className="btn bg-white text-forest-900 hover:bg-cream-100 w-full mt-3"><Phone size={18} /> {t('ins.off.call')}</a>
          <a href={LINKS.portal} target="_blank" rel="noopener noreferrer" className="btn-primary w-full mt-3"><ExternalLink size={18} /> {t('ins.off.portal')}</a>
          <p className="text-xs text-white/70 mt-3">pmfby.gov.in · {LINKS.helpline}</p>
        </section>
        <p className="text-xs text-forest-600 bg-cream-100 rounded-2xl p-3">{t('ins.info.source')}</p>
      </aside>
    </div>
  );
}
