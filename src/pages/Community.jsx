import { Headset, Phone, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui';

/** Community – kept intentionally minimal: the official Kisan Call Centre helpline. Space reserved for future features. */
export default function Community() {
  const { t } = useApp();
  return (
    <div>
      <PageHeader title={t('community.title')} subtitle={t('community.sub')} />

      <section className="rounded-3xl bg-forest-700 text-cream-50 p-5 md:p-6 flex flex-wrap items-center gap-4 shadow-lift">
        <span className="h-14 w-14 rounded-2xl bg-white/15 grid place-items-center"><Headset size={28} className="text-earth-400" /></span>
        <div className="flex-1 min-w-[14rem]">
          <h2 className="font-extrabold text-xl">{t('community.helpline')}</h2>
          <p className="text-cream-200">{t('community.helplineNote')}</p>
        </div>
        <a href="tel:18001801551" className="btn bg-cream-50 text-forest-800 hover:bg-white text-lg"><Phone size={20} /> 1800-180-1551</a>
      </section>

      <div className="mt-6 rounded-3xl border-2 border-dashed border-black/[0.08] p-10 text-center text-forest-600/80">
        <Sparkles size={28} className="mx-auto text-forest-300" aria-hidden />
        <p className="mt-2">{t('fx.comingSoon')}</p>
      </div>
    </div>
  );
}
