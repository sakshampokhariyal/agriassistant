import { Phone, Headset, ShieldCheck, Siren, Stethoscope } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader, SectionTitle } from '../components/ui';
import { helplines } from '../data/communityTools';

/* ───────────── 1. Helplines hub ───────────── */
const HELP_TONE = {
  emerald: { icon: Headset, ring: 'bg-forest-700 text-cream-50', chip: 'bg-white/15 text-earth-400', btn: 'bg-cream-50 text-forest-800 hover:bg-white', sub: 'text-cream-200' },
  amber: { icon: ShieldCheck, ring: 'bg-white border border-earth-100', chip: 'bg-earth-100 text-earth-700', btn: 'bg-earth-500 text-white hover:bg-earth-600', sub: 'text-forest-700/70' },
  red: { icon: Siren, ring: 'bg-white border border-red-100', chip: 'bg-red-50 text-red-600', btn: 'bg-red-600 text-white hover:bg-red-700', sub: 'text-forest-700/70' },
  violet: { icon: Stethoscope, ring: 'bg-white border border-navy-100', chip: 'bg-navy-50 text-navy-700', btn: 'bg-navy-600 text-white hover:bg-navy-700', sub: 'text-forest-700/70' },
};

function HelplineHub() {
  const { t, L } = useApp();
  return (
    <section aria-labelledby="cm-help">
      <SectionTitle icon={Phone}><span id="cm-help">{t('cm.help.title')}</span></SectionTitle>
      <p className="text-sm text-forest-700/70 -mt-1 mb-3">{t('cm.help.sub')}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {helplines.map((h) => {
          const tone = HELP_TONE[h.tone];
          const Icon = tone.icon;
          return (
            <article key={h.id} className={`rounded-3xl p-4 flex flex-col gap-3 shadow-card min-w-0 ${tone.ring}`}>
              <div className="flex items-start gap-3 min-w-0">
                <span className={`h-11 w-11 shrink-0 rounded-2xl grid place-items-center ${tone.chip}`}><Icon size={22} aria-hidden /></span>
                <div className="min-w-0">
                  <h3 className="font-extrabold leading-snug">{L(h.title)}</h3>
                  <p className={`text-sm mt-0.5 ${tone.sub}`}>{L(h.desc)}</p>
                </div>
              </div>
              <p className={`text-xs ${tone.sub}`}>{L(h.hours)}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                {h.numbers.map((n) => (
                  <a
                    key={n.tel}
                    href={`tel:${n.tel}`}
                    className={`btn flex-1 justify-center text-base font-bold whitespace-nowrap ${tone.btn}`}
                    aria-label={`${t('cm.help.call')} ${L(h.title)} ${n.label}`}
                  >
                    <Phone size={18} aria-hidden /> {n.label}
                    {n.note && <span className="text-xs font-semibold opacity-80">· {L(n.note)}</span>}
                  </a>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}


export default function Community() {
  const { t } = useApp();
  return (
    <div>
      <PageHeader title={t('community.title')} subtitle={t('cm.sub')} />
      <HelplineHub />
    </div>
  );
}
