import { Bug, Leaf, FlaskConical, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SectionTitle } from './ui';
import { pestGuides } from '../data/communityTools';

/** Pest & disease signs to watch for (shown on Crop Doctor). */
const TYPE_STYLE = {
  fungus: { icon: Leaf, cls: 'bg-earth-100 text-earth-700' },
  virus: { icon: AlertTriangle, cls: 'bg-red-50 text-red-600' },
  insect: { icon: Bug, cls: 'bg-violet-50 text-violet-700' },
};

export default function PestWatch() {
  const { t, L } = useApp();
  return (
    <section aria-labelledby="cm-pest" className="mt-8">
      <SectionTitle icon={Bug}><span id="cm-pest">{t('cm.pest.title')}</span></SectionTitle>
      <p className="text-sm text-forest-700/70 -mt-1 mb-3">{t('cm.pest.sub')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {pestGuides.map((g) => {
          const ty = TYPE_STYLE[g.type];
          const Icon = ty.icon;
          return (
            <article key={g.id} className="card p-4 flex flex-col sm:flex-row gap-4 min-w-0">
              <div className="sm:w-40 shrink-0">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${ty.cls}`}>
                  <Icon size={14} aria-hidden /> {t(`cm.type.${g.type}`)}
                </span>
                <h3 className="font-extrabold text-forest-900 mt-2 leading-snug">{L(g.name)}</h3>
                <p className="text-sm text-forest-700/70 mt-0.5">{L(g.crop)}</p>
              </div>
              <div className="min-w-0 flex-1 space-y-2.5 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-forest-600/70">{t('cm.pest.signs')}</p>
                  <p className="text-forest-800">{L(g.signs)}</p>
                </div>
                <div className="rounded-2xl bg-forest-50 px-3 py-2">
                  <p className="text-xs font-bold text-forest-700 flex items-center gap-1"><Leaf size={13} aria-hidden /> {t('cm.pest.organic')}</p>
                  <p className="text-forest-800">{L(g.organic)}</p>
                </div>
                <div className="rounded-2xl bg-earth-100/70 px-3 py-2">
                  <p className="text-xs font-bold text-earth-700 flex items-center gap-1"><FlaskConical size={13} aria-hidden /> {t('cm.pest.chemical')}</p>
                  <p className="text-forest-800">{L(g.chemical)}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-earth-700 bg-earth-100/70 rounded-xl px-3 py-2">
        <Info size={14} className="shrink-0 mt-0.5" aria-hidden /> {t('cm.pest.disclaimer')}
      </p>
    </section>
  );
}
